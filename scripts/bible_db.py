"""Shared verse record + SQLite write/validate helpers for Bible importers."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
import sqlite3


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
                warnings.append(
                    f"{key[0]} {key[1]} does not start at verse 1 (starts at {verse_numbers[0]})"
                )
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
