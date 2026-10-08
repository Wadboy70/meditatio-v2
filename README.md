# Meditatio

Scripture memorization app built with Expo, React Native, and TypeScript.

## Getting started

```bash
npm install
npx expo start
```

### Test on a physical phone (tunnel)

LAN mode only works when your phone and machine share a network. From a Cloud Agent VM (or any remote host), use tunnel mode instead:

```bash
npm run start:tunnel
# equivalent: npx expo start --tunnel
```

1. Install **Expo Go** on your phone (SDK 57 for this project).
2. Scan the QR code Expo prints (iOS Camera app, or Expo Go → Scan QR on Android).
3. Keep the terminal session running while you test.

Requires `@expo/ngrok` (already in dependencies). Tunnel URLs look like `*.exp.direct`.

## Bible data (local / cloud)

Translation databases are generated locally and **not** committed to git. Import them before the first native run.

```bash
# Python tooling (once)
cd scripts && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cd ..

# KJV (public-domain JSON)
curl -L -o scripts/data/kjv.json \
  https://raw.githubusercontent.com/midvash/bible-data/main/versions/en/kjv/kjv.json
npm run bible:import:kjv

# NET (official EPUB only — bible.org has no SQLite dump)
# Place EPUB at scripts/data/NETBIBLE21.epub, then:
npm run bible:import:net
```

**Cursor cloud:** download the NET EPUB on the VM with `curl`/`wget` into `scripts/data/` — do not chat-attach it. Details, licensing, and snapshot tips: [`scripts/README.md`](scripts/README.md).

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for project structure.
