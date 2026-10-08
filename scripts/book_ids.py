"""Canonical 66-book map: display names, OSIS codes, numeric IDs → slugs."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Testament = Literal["OT", "NT"]


@dataclass(frozen=True)
class Book:
    name: str
    slug: str
    testament: Testament
    osis: str
    number: int  # 1–66 Protestant order


# Ordered canonical list — names match NET Bible 2.1 NCX / h1 labels exactly.
BOOKS: tuple[Book, ...] = (
    Book("Genesis", "genesis", "OT", "Gen", 1),
    Book("Exodus", "exodus", "OT", "Exod", 2),
    Book("Leviticus", "leviticus", "OT", "Lev", 3),
    Book("Numbers", "numbers", "OT", "Num", 4),
    Book("Deuteronomy", "deuteronomy", "OT", "Deut", 5),
    Book("Joshua", "joshua", "OT", "Josh", 6),
    Book("Judges", "judges", "OT", "Judg", 7),
    Book("Ruth", "ruth", "OT", "Ruth", 8),
    Book("1 Samuel", "1-samuel", "OT", "1Sam", 9),
    Book("2 Samuel", "2-samuel", "OT", "2Sam", 10),
    Book("1 Kings", "1-kings", "OT", "1Kgs", 11),
    Book("2 Kings", "2-kings", "OT", "2Kgs", 12),
    Book("1 Chronicles", "1-chronicles", "OT", "1Chr", 13),
    Book("2 Chronicles", "2-chronicles", "OT", "2Chr", 14),
    Book("Ezra", "ezra", "OT", "Ezra", 15),
    Book("Nehemiah", "nehemiah", "OT", "Neh", 16),
    Book("Esther", "esther", "OT", "Esth", 17),
    Book("Job", "job", "OT", "Job", 18),
    Book("Psalms", "psalms", "OT", "Ps", 19),
    Book("Proverbs", "proverbs", "OT", "Prov", 20),
    Book("Ecclesiastes", "ecclesiastes", "OT", "Eccl", 21),
    Book("Song of Solomon", "song-of-solomon", "OT", "Song", 22),
    Book("Isaiah", "isaiah", "OT", "Isa", 23),
    Book("Jeremiah", "jeremiah", "OT", "Jer", 24),
    Book("Lamentations", "lamentations", "OT", "Lam", 25),
    Book("Ezekiel", "ezekiel", "OT", "Ezek", 26),
    Book("Daniel", "daniel", "OT", "Dan", 27),
    Book("Hosea", "hosea", "OT", "Hos", 28),
    Book("Joel", "joel", "OT", "Joel", 29),
    Book("Amos", "amos", "OT", "Amos", 30),
    Book("Obadiah", "obadiah", "OT", "Obad", 31),
    Book("Jonah", "jonah", "OT", "Jonah", 32),
    Book("Micah", "micah", "OT", "Mic", 33),
    Book("Nahum", "nahum", "OT", "Nah", 34),
    Book("Habakkuk", "habakkuk", "OT", "Hab", 35),
    Book("Zephaniah", "zephaniah", "OT", "Zeph", 36),
    Book("Haggai", "haggai", "OT", "Hag", 37),
    Book("Zechariah", "zechariah", "OT", "Zech", 38),
    Book("Malachi", "malachi", "OT", "Mal", 39),
    Book("Matthew", "matthew", "NT", "Matt", 40),
    Book("Mark", "mark", "NT", "Mark", 41),
    Book("Luke", "luke", "NT", "Luke", 42),
    Book("John", "john", "NT", "John", 43),
    Book("Acts", "acts", "NT", "Acts", 44),
    Book("Romans", "romans", "NT", "Rom", 45),
    Book("1 Corinthians", "1-corinthians", "NT", "1Cor", 46),
    Book("2 Corinthians", "2-corinthians", "NT", "2Cor", 47),
    Book("Galatians", "galatians", "NT", "Gal", 48),
    Book("Ephesians", "ephesians", "NT", "Eph", 49),
    Book("Philippians", "philippians", "NT", "Phil", 50),
    Book("Colossians", "colossians", "NT", "Col", 51),
    Book("1 Thessalonians", "1-thessalonians", "NT", "1Thess", 52),
    Book("2 Thessalonians", "2-thessalonians", "NT", "2Thess", 53),
    Book("1 Timothy", "1-timothy", "NT", "1Tim", 54),
    Book("2 Timothy", "2-timothy", "NT", "2Tim", 55),
    Book("Titus", "titus", "NT", "Titus", 56),
    Book("Philemon", "philemon", "NT", "Phlm", 57),
    Book("Hebrews", "hebrews", "NT", "Heb", 58),
    Book("James", "james", "NT", "Jas", 59),
    Book("1 Peter", "1-peter", "NT", "1Pet", 60),
    Book("2 Peter", "2-peter", "NT", "2Pet", 61),
    Book("1 John", "1-john", "NT", "1John", 62),
    Book("2 John", "2-john", "NT", "2John", 63),
    Book("3 John", "3-john", "NT", "3John", 64),
    Book("Jude", "jude", "NT", "Jude", 65),
    Book("Revelation", "revelation", "NT", "Rev", 66),
)

NAME_TO_BOOK: dict[str, Book] = {book.name: book for book in BOOKS}
SLUG_TO_BOOK: dict[str, Book] = {book.slug: book for book in BOOKS}
OSIS_TO_BOOK: dict[str, Book] = {book.osis.lower(): book for book in BOOKS}
NUMBER_TO_BOOK: dict[int, Book] = {book.number: book for book in BOOKS}

# Extra aliases seen in dumps / APIs (normalized lowercase, no spaces/punct).
_ALIAS_TO_SLUG: dict[str, str] = {
    "psalm": "psalms",
    "songofsolomon": "song-of-solomon",
    "songofsongs": "song-of-solomon",
    "songs": "song-of-solomon",
    "canticles": "song-of-solomon",
    "apocalypse": "revelation",
    "genesis": "genesis",
    "exodus": "exodus",
    "1samuel": "1-samuel",
    "2samuel": "2-samuel",
    "1kings": "1-kings",
    "2kings": "2-kings",
    "1chronicles": "1-chronicles",
    "2chronicles": "2-chronicles",
    "1corinthians": "1-corinthians",
    "2corinthians": "2-corinthians",
    "1thessalonians": "1-thessalonians",
    "2thessalonians": "2-thessalonians",
    "1timothy": "1-timothy",
    "2timothy": "2-timothy",
    "1peter": "1-peter",
    "2peter": "2-peter",
    "1john": "1-john",
    "2john": "2-john",
    "3john": "3-john",
}


def _normalize_key(value: str) -> str:
    return "".join(ch for ch in value.lower() if ch.isalnum())


def lookup_book(name: str) -> Book:
    """Resolve a NET display name to its canonical book record."""
    normalized = " ".join(name.split())
    if normalized not in NAME_TO_BOOK:
        raise ValueError(f"Unknown book name: {name!r}")
    return NAME_TO_BOOK[normalized]


def resolve_book(value: str | int) -> Book:
    """Resolve OSIS, slug, display name, alias, or 1–66 number to a Book."""
    if isinstance(value, int) or (isinstance(value, str) and value.isdigit()):
        number = int(value)
        book = NUMBER_TO_BOOK.get(number)
        if book is None:
            raise ValueError(f"Unknown book number: {value!r}")
        return book

    text = " ".join(str(value).split())
    if text in NAME_TO_BOOK:
        return NAME_TO_BOOK[text]
    if text in SLUG_TO_BOOK:
        return SLUG_TO_BOOK[text]
    if text.lower() in OSIS_TO_BOOK:
        return OSIS_TO_BOOK[text.lower()]

    key = _normalize_key(text)
    # OSIS without punctuation (1sam, song, etc.)
    if key in OSIS_TO_BOOK:
        return OSIS_TO_BOOK[key]
    for book in BOOKS:
        if _normalize_key(book.osis) == key or _normalize_key(book.slug) == key:
            return book
        if _normalize_key(book.name) == key:
            return book

    slug = _ALIAS_TO_SLUG.get(key)
    if slug and slug in SLUG_TO_BOOK:
        return SLUG_TO_BOOK[slug]

    raise ValueError(f"Unknown book identifier: {value!r}")
