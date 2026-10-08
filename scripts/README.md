# Bible translation import

One-time tooling to build local SQLite databases the app bundles as `assets/bible/{translationId}.sqlite`.

There is **no official NET SQLite** from bible.org. KJV uses public-domain JSON; NET uses the official EPUB.

## Setup (once per machine)

```bash
cd scripts
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## First-run import (KJV + NET)

```bash
# KJV — public domain structured JSON (curl one-liner)
curl -L -o scripts/data/kjv.json \
  https://raw.githubusercontent.com/midvash/bible-data/main/versions/en/kjv/kjv.json

# NET — official EPUB only (no official SQLite/JSON dump)
# Local: save from https://bible.org/downloads as scripts/data/NETBIBLE21.epub
# Cursor cloud: download on the VM (do not chat-attach the EPUB) — see below

npm run bible:import:kjv
npm run bible:import:net

# Or import every default source that exists under scripts/data/
npm run bible:import
```

Output: `assets/bible/kjv.sqlite`, `assets/bible/net.sqlite` (gitignored). Import **before** the first native Expo run — Metro `require`s those files.

## npm scripts

| Script | What it does |
|--------|----------------|
| `bible:import:kjv` | `data/kjv.json` → `assets/bible/kjv.sqlite` |
| `bible:import:net` | `data/NETBIBLE21.epub` → `assets/bible/net.sqlite` |
| `bible:import` | Import every default source present under `scripts/data/` |
| `bible:extract` | Alias of `bible:import:net` (legacy name) |

Advanced:

```bash
cd scripts && source .venv/bin/activate
python import_bible.py --translation-id kjv --source data/kjv.json --format json
python import_bible.py --translation-id net --source data/NETBIBLE21.epub --format epub
# Optional third-party structured NET (not from bible.org):
python import_bible.py --translation-id net --source data/net.sqlite --format sqlite
```

## SQLite schema (app runtime)

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

## Wisest NET path

1. **Default (free / not-for-sale app):** official EPUB from [bible.org/downloads](https://bible.org/downloads) → `npm run bible:import:net` → local `net.sqlite` (never commit it).
2. bible.org does **not** publish a bulk NET SQLite or complete-Bible JSON.
3. Optional third-party structured dumps are not official — only use if you trust the license.
4. If you **sell** the app later: stop bundling NET, get a HarperCollins / Thomas Nelson license, or switch NET to their passage API and keep only KJV offline.

Attribution (shown under Profile → Bible text credits): use `(NET)` and link to https://netbible.org for internet-connected apps. See [netbible.com/copyright](https://netbible.com/copyright/).

## Getting the NET EPUB into a Cursor cloud environment

Do **not** chat-attach the EPUB (large binary; poor fit for Cloud Agent uploads).

1. **Download on the VM (recommended):** ask the agent to `curl`/`wget` the official EPUB into `scripts/data/NETBIBLE21.epub`, then `npm run bible:import:net`. Prompt: “Download the NET 2.1 EPUB from bible.org into `scripts/data/NETBIBLE21.epub` and import it.”
2. **Environment snapshot (frequent cloud runs):** after one successful import, bake `assets/bible/*.sqlite` (and optionally the EPUB) into a private snapshot so future agents skip re-download. Still never commit those files.
3. **Desktop attach** — fallback only; prefer download-on-VM.
4. Local laptop import is fine; cloud checkouts still need (1) or (2) because `*.sqlite` is gitignored.

Direct download URLs on bible.org can move, and automated `curl` may get **403 Forbidden**. If that happens, open [bible.org/downloads](https://bible.org/downloads) in a browser, save the NET 2.1 EPUB, and place it at `scripts/data/NETBIBLE21.epub` (or use remote desktop in the cloud VM to download once).

**Cloud fallback:** if bible.org blocks download, the importer also accepts the eBible NET EPUB (`https://eBible.org/epub/engnet.epub`) saved as `scripts/data/NETBIBLE21.epub` — same import command.

## Supported source formats

| Format | Typical use |
|--------|-------------|
| **JSON** | KJV (midvash whole-Bible `{ books: [...] }`, or flat verse arrays) |
| **SQLite** | Remap midvash / already-normalized DBs into the app schema |
| **EPUB** | NET official seed (`--format epub`) |

## Dev rules

- Never commit `scripts/data/*` Bible sources or `assets/bible/*.sqlite`
- KJV is reproducible from the public midvash URL above
- NET must be obtained from bible.org (EPUB) on each machine or baked into a private snapshot
