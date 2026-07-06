# Bible EPUB extraction

One-time script to convert a Bible EPUB into a SQLite database for the Meditatio app.

## Setup

```bash
cd scripts
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Place the source EPUB at `scripts/data/NETBIBLE21.epub` (not committed to git).

## Usage

From the repo root:

```bash
npm run bible:extract
```

Or manually:

```bash
cd scripts
source .venv/bin/activate
python extract_bible_epub.py \
  --epub data/NETBIBLE21.epub \
  --translation-id net
```

Output defaults to `assets/bible/net.sqlite` (gitignored). The app reads it via `lib/bible/BibleTextService`.

## SQLite schema

```sql
CREATE TABLE verses (
  translation_id TEXT NOT NULL,
  book_id        TEXT NOT NULL,
  chapter        INTEGER NOT NULL,
  verse          INTEGER NOT NULL,
  text           TEXT NOT NULL,
  PRIMARY KEY (translation_id, book_id, chapter, verse)
);
```

## Licensing

The NET Bible EPUB is **Copyright 1996–2019, Biblical Studies Press**. The source EPUB and generated `assets/bible/*.sqlite` files are gitignored. Confirm NET Bible usage terms before publishing or distributing the app.
