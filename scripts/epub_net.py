"""NET Bible EPUB → verse records (NET 2.1 HTML structure)."""

from __future__ import annotations

import html
import re
import warnings
import zipfile
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET

from bs4 import BeautifulSoup, NavigableString, Tag, XMLParsedAsHTMLWarning

from bible_db import VerseRecord
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

SKIP_HREF_PARTS = (
    "_notes.xhtml",
    "cover.xhtml",
    "kindle-toc.xhtml",
    "preface.xhtml",
    "titlepage.xhtml",
)

VERSE_LABEL_RE = re.compile(r"^(\d+):(\d+)$")
WHITESPACE_RE = re.compile(r"\s+")


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
