#!/usr/bin/env python3
"""Import Bible translations from JSON, SQLite, or NET EPUB into app SQLite DBs."""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path

from bible_db import VerseRecord, print_summary, spot_check, validate_records, write_sqlite
from book_ids import resolve_book
from epub_net import extract_epub

WHITESPACE_RE = re.compile(r"\s+")
SCRIPTS_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPTS_DIR.parent
DEFAULT_DATA_DIR = SCRIPTS_DIR / "data"
DEFAULT_OUT_DIR = REPO_ROOT / "assets" / "bible"

DEFAULT_SOURCES: dict[str, Path] = {
    "kjv": DEFAULT_DATA_DIR / "kjv.json",
    "net": DEFAULT_DATA_DIR / "NETBIBLE21.epub",
}


def normalize_text(raw: str) -> str:
    return WHITESPACE_RE.sub(" ", str(raw)).strip()


def detect_format(path: Path, explicit: str | None) -> str:
    if explicit and explicit != "auto":
        return explicit
    suffix = path.suffix.lower()
    if suffix == ".json":
        return "json"
    if suffix in {".sqlite", ".db", ".sqlite3"}:
        return "sqlite"
    if suffix == ".epub":
        return "epub"
    raise ValueError(f"Cannot detect format for {path}; pass --format json|sqlite|epub")


def _verse_number(obj: dict) -> int:
    for key in ("verse", "number", "v"):
        if key in obj:
            return int(obj[key])
    raise ValueError(f"Verse object missing verse number: {obj!r}")


def _chapter_number(obj: dict) -> int:
    for key in ("chapter", "c"):
        if key in obj:
            return int(obj[key])
    raise ValueError(f"Chapter object missing chapter number: {obj!r}")


def _book_key(obj: dict) -> str | int:
    for key in ("book", "book_id", "bookId", "book_osis", "osis", "name", "englishName"):
        if key in obj and obj[key] is not None:
            return obj[key]
    raise ValueError(f"Book object missing book identifier: {obj!r}")


def records_from_midvash_bible(data: dict, translation_id: str) -> list[VerseRecord]:
    records: list[VerseRecord] = []
    for book_obj in data.get("books", []):
        book = resolve_book(_book_key(book_obj))
        for chapter_obj in book_obj.get("chapters", []):
            chapter = _chapter_number(chapter_obj)
            for verse_obj in chapter_obj.get("verses", []):
                text = normalize_text(verse_obj.get("text", ""))
                if not text:
                    continue
                records.append(
                    VerseRecord(
                        translation_id=translation_id,
                        book_id=book.slug,
                        chapter=chapter,
                        verse=_verse_number(verse_obj),
                        text=text,
                    )
                )
    return records


def extract_json(path: Path, translation_id: str) -> list[VerseRecord]:
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)

    if isinstance(data, dict) and isinstance(data.get("books"), list):
        return records_from_midvash_bible(data, translation_id)

    if isinstance(data, list):
        records: list[VerseRecord] = []
        for row in data:
            if not isinstance(row, dict):
                raise ValueError("Flat JSON array must contain objects")
            book = resolve_book(_book_key(row))
            text = normalize_text(row.get("text", ""))
            if not text:
                continue
            chapter_raw = row.get("chapter", row.get("c"))
            if chapter_raw is None:
                raise ValueError(f"JSON row missing chapter: {row!r}")
            records.append(
                VerseRecord(
                    translation_id=translation_id,
                    book_id=book.slug,
                    chapter=int(chapter_raw),
                    verse=_verse_number(row),
                    text=text,
                )
            )
        return records

    if isinstance(data, dict) and "verses" in data and isinstance(data["verses"], list):
        return extract_json_from_verses_key(data["verses"], translation_id)

    raise ValueError(
        "Unsupported JSON shape. Expected midvash whole-Bible object "
        "({books:[...]}) or a flat array of verse objects."
    )


def extract_json_from_verses_key(rows: list, translation_id: str) -> list[VerseRecord]:
    records: list[VerseRecord] = []
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("verses[] entries must be objects")
        book = resolve_book(_book_key(row))
        text = normalize_text(row.get("text", ""))
        if not text:
            continue
        chapter_raw = row.get("chapter", row.get("c"))
        if chapter_raw is None:
            raise ValueError(f"JSON verse missing chapter: {row!r}")
        records.append(
            VerseRecord(
                translation_id=translation_id,
                book_id=book.slug,
                chapter=int(chapter_raw),
                verse=_verse_number(row),
                text=text,
            )
        )
    return records


def _table_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return {row[1] for row in rows}


def extract_sqlite(path: Path, translation_id: str) -> list[VerseRecord]:
    conn = sqlite3.connect(path)
    try:
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
        }
        if "verses" not in tables:
            raise ValueError(f"No verses table in {path}")

        cols = _table_columns(conn, "verses")

        # Already in Meditatio schema
        if {"translation_id", "book_id", "chapter", "verse", "text"} <= cols:
            rows = conn.execute(
                "SELECT book_id, chapter, verse, text FROM verses"
            ).fetchall()
            records: list[VerseRecord] = []
            for book_id, chapter, verse, text in rows:
                book = resolve_book(book_id)
                clean = normalize_text(text)
                if not clean:
                    continue
                records.append(
                    VerseRecord(
                        translation_id=translation_id,
                        book_id=book.slug,
                        chapter=int(chapter),
                        verse=int(verse),
                        text=clean,
                    )
                )
            return records

        # midvash: book_id INT, chapter, number, text
        if {"book_id", "chapter", "number", "text"} <= cols:
            rows = conn.execute(
                "SELECT book_id, chapter, number, text FROM verses"
            ).fetchall()
            records = []
            for book_id, chapter, number, text in rows:
                book = resolve_book(int(book_id))
                clean = normalize_text(text)
                if not clean:
                    continue
                records.append(
                    VerseRecord(
                        translation_id=translation_id,
                        book_id=book.slug,
                        chapter=int(chapter),
                        verse=int(number),
                        text=clean,
                    )
                )
            return records

        raise ValueError(
            f"Unsupported SQLite verses schema in {path}. Columns: {sorted(cols)}"
        )
    finally:
        conn.close()


def import_source(
    source: Path,
    translation_id: str,
    fmt: str,
) -> list[VerseRecord]:
    if fmt == "json":
        return extract_json(source, translation_id)
    if fmt == "sqlite":
        return extract_sqlite(source, translation_id)
    if fmt == "epub":
        return extract_epub(source, translation_id)
    raise ValueError(f"Unknown format: {fmt}")


def run_import(
    *,
    source: Path,
    translation_id: str,
    fmt: str | None,
    out_path: Path | None,
) -> int:
    if not source.is_file():
        print(f"Source not found: {source}", file=sys.stderr)
        if translation_id == "net":
            print(
                "NET: download the official EPUB from https://bible.org/downloads "
                "into scripts/data/NETBIBLE21.epub (no official SQLite exists).",
                file=sys.stderr,
            )
        elif translation_id == "kjv":
            print(
                "KJV: curl -L -o scripts/data/kjv.json "
                "https://raw.githubusercontent.com/midvash/bible-data/main/versions/en/kjv/kjv.json",
                file=sys.stderr,
            )
        return 1

    resolved_format = detect_format(source, fmt)
    print(f"Importing {source} as {resolved_format} → translation_id={translation_id}")

    records = import_source(source, translation_id, resolved_format)
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

    destination = out_path or (DEFAULT_OUT_DIR / f"{translation_id}.sqlite")
    destination.parent.mkdir(parents=True, exist_ok=True)
    write_sqlite(destination, records)
    print(f"\nWrote {len(records)} verses to {destination}")
    return 0


def import_all_present() -> int:
    """Import every default source that exists under scripts/data/."""
    exit_code = 0
    found = False
    for translation_id, source in DEFAULT_SOURCES.items():
        if not source.is_file():
            print(f"Skipping {translation_id}: missing {source}")
            continue
        found = True
        code = run_import(
            source=source,
            translation_id=translation_id,
            fmt=None,
            out_path=None,
        )
        if code != 0:
            exit_code = code
    if not found:
        print("No sources found under scripts/data/.", file=sys.stderr)
        return 1
    return exit_code


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import Bible verses into assets/bible/{translationId}.sqlite"
    )
    parser.add_argument(
        "--translation-id",
        help="Translation slug (e.g. kjv, net). Omit with --all.",
    )
    parser.add_argument(
        "--source",
        type=Path,
        help="Path to JSON, SQLite, or EPUB source file",
    )
    parser.add_argument(
        "--format",
        choices=["auto", "json", "sqlite", "epub"],
        default="auto",
        help="Source format (default: auto-detect from extension)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        help="Output SQLite path (default: assets/bible/{translation-id}.sqlite)",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Import every default source present under scripts/data/",
    )
    args = parser.parse_args()

    if args.all:
        return import_all_present()

    if not args.translation_id:
        parser.error("--translation-id is required unless --all is set")

    source = args.source
    if source is None:
        source = DEFAULT_SOURCES.get(args.translation_id)
        if source is None:
            parser.error(
                f"No default source for {args.translation_id!r}; pass --source"
            )

    fmt = None if args.format == "auto" else args.format
    return run_import(
        source=source,
        translation_id=args.translation_id,
        fmt=fmt,
        out_path=args.out,
    )


if __name__ == "__main__":
    raise SystemExit(main())
