"""Canonical NET Bible book names mapped to slugs and testament."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Testament = Literal["OT", "NT"]


@dataclass(frozen=True)
class Book:
    name: str
    slug: str
    testament: Testament


# Ordered canonical list — names match NET Bible 2.1 NCX / h1 labels exactly.
BOOKS: tuple[Book, ...] = (
    Book("Genesis", "genesis", "OT"),
    Book("Exodus", "exodus", "OT"),
    Book("Leviticus", "leviticus", "OT"),
    Book("Numbers", "numbers", "OT"),
    Book("Deuteronomy", "deuteronomy", "OT"),
    Book("Joshua", "joshua", "OT"),
    Book("Judges", "judges", "OT"),
    Book("Ruth", "ruth", "OT"),
    Book("1 Samuel", "1-samuel", "OT"),
    Book("2 Samuel", "2-samuel", "OT"),
    Book("1 Kings", "1-kings", "OT"),
    Book("2 Kings", "2-kings", "OT"),
    Book("1 Chronicles", "1-chronicles", "OT"),
    Book("2 Chronicles", "2-chronicles", "OT"),
    Book("Ezra", "ezra", "OT"),
    Book("Nehemiah", "nehemiah", "OT"),
    Book("Esther", "esther", "OT"),
    Book("Job", "job", "OT"),
    Book("Psalms", "psalms", "OT"),
    Book("Proverbs", "proverbs", "OT"),
    Book("Ecclesiastes", "ecclesiastes", "OT"),
    Book("Song of Solomon", "song-of-solomon", "OT"),
    Book("Isaiah", "isaiah", "OT"),
    Book("Jeremiah", "jeremiah", "OT"),
    Book("Lamentations", "lamentations", "OT"),
    Book("Ezekiel", "ezekiel", "OT"),
    Book("Daniel", "daniel", "OT"),
    Book("Hosea", "hosea", "OT"),
    Book("Joel", "joel", "OT"),
    Book("Amos", "amos", "OT"),
    Book("Obadiah", "obadiah", "OT"),
    Book("Jonah", "jonah", "OT"),
    Book("Micah", "micah", "OT"),
    Book("Nahum", "nahum", "OT"),
    Book("Habakkuk", "habakkuk", "OT"),
    Book("Zephaniah", "zephaniah", "OT"),
    Book("Haggai", "haggai", "OT"),
    Book("Zechariah", "zechariah", "OT"),
    Book("Malachi", "malachi", "OT"),
    Book("Matthew", "matthew", "NT"),
    Book("Mark", "mark", "NT"),
    Book("Luke", "luke", "NT"),
    Book("John", "john", "NT"),
    Book("Acts", "acts", "NT"),
    Book("Romans", "romans", "NT"),
    Book("1 Corinthians", "1-corinthians", "NT"),
    Book("2 Corinthians", "2-corinthians", "NT"),
    Book("Galatians", "galatians", "NT"),
    Book("Ephesians", "ephesians", "NT"),
    Book("Philippians", "philippians", "NT"),
    Book("Colossians", "colossians", "NT"),
    Book("1 Thessalonians", "1-thessalonians", "NT"),
    Book("2 Thessalonians", "2-thessalonians", "NT"),
    Book("1 Timothy", "1-timothy", "NT"),
    Book("2 Timothy", "2-timothy", "NT"),
    Book("Titus", "titus", "NT"),
    Book("Philemon", "philemon", "NT"),
    Book("Hebrews", "hebrews", "NT"),
    Book("James", "james", "NT"),
    Book("1 Peter", "1-peter", "NT"),
    Book("2 Peter", "2-peter", "NT"),
    Book("1 John", "1-john", "NT"),
    Book("2 John", "2-john", "NT"),
    Book("3 John", "3-john", "NT"),
    Book("Jude", "jude", "NT"),
    Book("Revelation", "revelation", "NT"),
)

NAME_TO_BOOK: dict[str, Book] = {book.name: book for book in BOOKS}


def lookup_book(name: str) -> Book:
    """Resolve a NET display name to its canonical book record."""
    normalized = " ".join(name.split())
    if normalized not in NAME_TO_BOOK:
        raise ValueError(f"Unknown book name: {name!r}")
    return NAME_TO_BOOK[normalized]
