#!/usr/bin/env python3
"""Deprecated wrapper — use import_bible.py --format epub instead."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from import_bible import run_import


def main() -> int:
    parser = argparse.ArgumentParser(
        description="(Deprecated) Extract Bible verses from a NET EPUB. Prefer: import_bible.py"
    )
    parser.add_argument("--epub", required=True, type=Path, help="Path to the source EPUB")
    parser.add_argument("--translation-id", required=True, help="Translation slug (e.g. net)")
    parser.add_argument(
        "--out",
        type=Path,
        help="Output SQLite path (default: assets/bible/{translation-id}.sqlite)",
    )
    args = parser.parse_args()

    print(
        "Note: extract_bible_epub.py is deprecated; use "
        "`python import_bible.py --translation-id net --format epub --source …`",
        file=sys.stderr,
    )
    return run_import(
        source=args.epub,
        translation_id=args.translation_id,
        fmt="epub",
        out_path=args.out,
    )


if __name__ == "__main__":
    raise SystemExit(main())
