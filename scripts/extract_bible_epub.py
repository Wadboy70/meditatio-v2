#!/usr/bin/env python3
"""Extract structured verse data from a NET Bible EPUB."""

from __future__ import annotations

import argparse
import html
import re
import sqlite3
import sys
import zipfile
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET

from bs4 import BeautifulSoup, NavigableString, Tag, XMLParsedAsHTMLWarning

import warnings

from book_ids import lookup_book

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

OPF_NS = {"opf": "http://www.idpf.org/2007/opf"}
CONTAINER_NS = {"cn": "urn:oasis:names:tc:opendocument:xmlns:container"}

SKIP_IDREFS = {
    "cover",
    "kindle-toc",
    "preface",
    "titlepage",
    "ncx",
}

SKIP_HREF_PARTS = ("_notes.xhtml", "cover.xhtml", "kindle-toc.xhtml", "preface.xhtml", "titlepage.xhtml")

VERSE_LABEL_RE = re.compile(r"^(\d+):(\d+)$")
WHITESPACE_RE = re.compile(r"\s+")


@dataclass(frozen=True)
class VerseRecord:
    translation_id: str
    book_id: str
    chapter: int
    verse: int
    text: str


def write_sqlite(path: Path, records: list[VerseRecord]) -> None:
    if path.exists():
        path.unlink()

    conn = sqlite3.connect(path)
    try:
        conn.execute(
            """
            CREATE TABLE verses (
                translation_id TEXT NOT NULL,
                book_id TEXT NOT NULL,
                chapter INTEGER NOT NULL,
                verse INTEGER NOT NULL,
                text TEXT NOT NULL,
                PRIMARY KEY (translation_id, book_id, chapter, verse)
            )
            """
        )
        conn.execute("CREATE INDEX idx_verses_book_chapter ON verses (book_id, chapter)")
        conn.executemany(
            "INSERT INTO verses (translation_id, book_id, chapter, verse, text) VALUES (?, ?, ?, ?, ?)",
            [
                (r.translation_id, r.book_id, r.chapter, r.verse, r.text)
                for r in records
            ],
        )
        conn.commit()
    finally:
        conn.close()


def read_spine_paths(epub_path: Path) -> list[str]:
    """Return content document paths inside the EPUB in spine order."""
    with zipfile.ZipFile(epub_path) as archive:
        container_xml = ET.fromstring(archive.read("META-INF/container.xml"))
        opf_path = container_xml.find(".//cn:rootfile", CONTAINER_NS).attrib["full-path"]

        opf_xml = ET.fromstring(archive.read(opf_path))
        opf_dir = f"{Path(opf_path).parent}/" if "/" in opf_path else ""

        manifest: dict[str, str] = {}
        for item in opf_xml.findall(".//opf:manifest/opf:item", OPF_NS):
            manifest[item.attrib["id"]] = item.attrib["href"]

        paths: list[str] = []
        for itemref in opf_xml.findall(".//opf:spine/opf:itemref", OPF_NS):
            idref = itemref.attrib["idref"]
            if idref in SKIP_IDREFS:
                continue
            href = manifest.get(idref)
            if not href:
                continue
            if any(part in href for part in SKIP_HREF_PARTS):
                continue
            paths.append(f"{opf_dir}{href}")

        return paths


def read_document(archive: zipfile.ZipFile, path: str) -> str:
    return archive.read(path).decode("utf-8")


def normalize_text(raw: str) -> str:
    unescaped = html.unescape(raw)
    return WHITESPACE_RE.sub(" ", unescaped).strip()


def parse_book_name(soup: BeautifulSoup) -> str:
    h1 = soup.find("h1")
    if h1:
        parts: list[str] = []
        for child in h1.children:
            if isinstance(child, Tag) and child.name == "br":
                break
            if isinstance(child, NavigableString):
                parts.append(str(child))
            elif isinstance(child, Tag):
                parts.append(child.get_text())
        name = normalize_text("".join(parts))
        if name:
            return name

    title = soup.find("title")
    if title:
        title_text = normalize_text(title.get_text())
        # "NET Bible 2.1 Genesis 1" -> "Genesis"
        match = re.match(r"NET Bible 2\.1\s+(.+?)\s+\d+$", title_text)
        if match:
            return match.group(1)
        match = re.match(r"NET Bible 2\.1\s+(.+)$", title_text)
        if match:
            return match.group(1)

    raise ValueError("Could not determine book name from chapter document")


def prepare_body(soup: BeautifulSoup) -> Tag:
    body = soup.body
    if body is None:
        raise ValueError("Chapter document has no <body>")

    for node in body.find_all("sup"):
        node.decompose()
    for node in body.find_all("p", class_="paragraphtitle"):
        node.decompose()

    return body


def iter_body_nodes(root: Tag) -> Iterable[tuple[str, NavigableString | Tag]]:
    for child in root.children:
        if isinstance(child, NavigableString):
            if str(child).strip():
                yield ("text", child)
        elif isinstance(child, Tag):
            classes = child.get("class") or []
            if child.name == "span" and "verse" in classes:
                yield ("verse", child)
            else:
                yield from iter_body_nodes(child)


def parse_verse_label(label: str) -> tuple[int, int]:
    match = VERSE_LABEL_RE.match(label.strip())
    if not match:
        raise ValueError(f"Invalid verse label: {label!r}")
    return int(match.group(1)), int(match.group(2))


def extract_verses_from_chapter(html_content: str) -> tuple[str, list[tuple[int, int, str]]]:
    soup = BeautifulSoup(html_content, "lxml-xml")
    book_name = parse_book_name(soup)
    body = prepare_body(soup)

    if not body.find("span", class_="verse"):
        return book_name, []

    verses: list[tuple[int, int, str]] = []
    current_key: tuple[int, int] | None = None
    current_parts: list[str] = []

    def flush() -> None:
        nonlocal current_key, current_parts
        if current_key is None:
            return
        text = normalize_text(" ".join(part for part in current_parts if part.strip()))
        if text:
            verses.append((current_key[0], current_key[1], text))
        current_parts = []

    for kind, node in iter_body_nodes(body):
        if kind == "verse":
            flush()
            current_key = parse_verse_label(node.get_text())
        else:
            if current_key is not None:
                current_parts.append(str(node))

    flush()
    return book_name, verses


def extract_epub(epub_path: Path, translation_id: str) -> list[VerseRecord]:
    spine_paths = read_spine_paths(epub_path)
    records: list[VerseRecord] = []

    with zipfile.ZipFile(epub_path) as archive:
        for path in spine_paths:
            html_content = read_document(archive, path)
            if 'class="verse"' not in html_content and "class='verse'" not in html_content:
                continue

            book_name, chapter_verses = extract_verses_from_chapter(html_content)
            if not chapter_verses:
                continue

            book = lookup_book(book_name)
            for chapter, verse, text in chapter_verses:
                records.append(
                    VerseRecord(
                        translation_id=translation_id,
                        book_id=book.slug,
                        chapter=chapter,
                        verse=verse,
                        text=text,
                    )
                )

    return records


def validate_records(records: list[VerseRecord]) -> list[str]:
    warnings: list[str] = []

    books = {record.book_id for record in records}
    if len(books) != 66:
        warnings.append(f"Expected 66 books, found {len(books)}")

    if len(records) < 30000 or len(records) > 32000:
        warnings.append(f"Unexpected verse count: {len(records)} (expected ~31,000)")

    empty_text = sum(1 for record in records if not record.text)
    if empty_text:
        warnings.append(f"{empty_text} verses have empty text")

    by_chapter: dict[tuple[str, int], list[int]] = defaultdict(list)
    for record in records:
        by_chapter[(record.book_id, record.chapter)].append(record.verse)

    gap_count = 0
    for key, verse_numbers in by_chapter.items():
        verse_numbers.sort()
        if verse_numbers[0] != 1:
            gap_count += 1
            if gap_count <= 5:
                warnings.append(f"{key[0]} {key[1]} does not start at verse 1 (starts at {verse_numbers[0]})")
        for prev, nxt in zip(verse_numbers, verse_numbers[1:]):
            if nxt != prev + 1:
                gap_count += 1
                if gap_count <= 5:
                    warnings.append(f"{key[0]} {key[1]} has gap between verses {prev} and {nxt}")

    if gap_count > 5:
        warnings.append(f"...and {gap_count - 5} more chapter contiguity issues")

    return warnings


def print_summary(records: list[VerseRecord]) -> None:
    books = {record.book_id for record in records}
    chapters = {(record.book_id, record.chapter) for record in records}
    print(f"Books:    {len(books)}")
    print(f"Chapters: {len(chapters)}")
    print(f"Verses:   {len(records)}")


def spot_check(records: list[VerseRecord], checks: list[tuple[str, int, int]]) -> None:
    index = {(r.book_id, r.chapter, r.verse): r.text for r in records}
    print("\nSpot checks:")
    for book_id, chapter, verse in checks:
        text = index.get((book_id, chapter, verse))
        if text is None:
            print(f"  MISSING  {book_id} {chapter}:{verse}")
        else:
            preview = text if len(text) <= 120 else f"{text[:117]}..."
            print(f"  {book_id} {chapter}:{verse}  {preview}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract Bible verses from a NET EPUB.")
    parser.add_argument("--epub", required=True, type=Path, help="Path to the source EPUB")
    parser.add_argument("--translation-id", required=True, help="Translation slug (e.g. net)")
    parser.add_argument(
        "--out",
        type=Path,
        help="Output SQLite path (default: assets/bible/{translation-id}.sqlite)",
    )
    args = parser.parse_args()

    out_path = args.out
    if out_path is None:
        out_path = Path(__file__).resolve().parent.parent / "assets" / "bible" / f"{args.translation_id}.sqlite"

    if not args.epub.is_file():
        print(f"EPUB not found: {args.epub}", file=sys.stderr)
        return 1

    print(f"Reading {args.epub} ...")
    records = extract_epub(args.epub, args.translation_id)

    warnings = validate_records(records)
    print_summary(records)

    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"  - {warning}")

    spot_check(
        records,
        [
            ("matthew", 5, 3),
            ("matthew", 5, 4),
            ("john", 3, 16),
            ("psalms", 23, 1),
        ],
    )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    write_sqlite(out_path, records)
    print(f"\nWrote {len(records)} verses to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
