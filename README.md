# Meditatio

Scripture memorization app built with Expo, React Native, and TypeScript.

## Getting started

```bash
npm install
npx expo start
```

## Bible data (local dev)

Translation databases are generated locally and not committed to git.

1. Place the NET Bible EPUB at `scripts/data/NETBIBLE21.epub`
2. Set up the Python venv (first time only): see [`scripts/README.md`](scripts/README.md)
3. Run `npm run bible:extract` to generate `assets/bible/net.sqlite`

The app bundles that file when present. See [`ARCHITECTURE.md`](ARCHITECTURE.md) for project structure.
