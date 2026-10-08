# Meditatio — Architecture

> Last updated: 2026-10-08

Scripture memorization app built with Expo, React Native, TypeScript, and NativeWind. Optional Supabase integration is stubbed but disabled until credentials are provided.

## Tech stack

| Layer | Choice |
|-------|--------|
| Runtime | Expo SDK 57, React Native 0.86 |
| Language | TypeScript (strict) |
| Navigation | Expo Router (file-based) + floating custom tab bar |
| Styling | NativeWind v4 + Tailwind CSS v3, design tokens in `constants/tokens.ts` |
| Backend (optional) | Supabase (`@supabase/supabase-js`) — disabled without env keys |
| Path aliases | `@/*` → project root (`tsconfig.json`) |

## High-level layout

```
meditatio/
├── app/                      # Screens & navigation (Expo Router)
│   ├── _layout.tsx           # Root stack, fonts, splash screen
│   ├── (tabs)/               # Bottom tab navigator
│   │   ├── _layout.tsx       # Floating tab bar (Home, Profile)
│   │   ├── index.tsx         # Home — saved passages list
│   │   └── profile.tsx       # Profile tab
│   └── passage/              # Passage selection + sectioning flow
│       ├── _layout.tsx
│       ├── new.tsx           # Translation picker
│       ├── reader.tsx        # Infinite-scroll reader + verse multi-select
│       └── sections.tsx      # Divide passage into color-coded sections
├── components/
│   ├── index.ts              # Root barrel — import shared UI via @/components
│   ├── ui/                   # Design system primitives (placeholder)
│   └── shared/               # Composite components
│       ├── FloatingTabBar.tsx
│       ├── PassageCard.tsx
│       ├── EmptyState.tsx
│       ├── BibleReader.tsx
│       ├── BookChapterModal.tsx
│       ├── VerseBlock.tsx
│       ├── SelectionConfirmBar.tsx
│       └── PassageVerseList.tsx
├── context/                  # React context providers (reserved)
├── hooks/
│   └── usePassages.ts        # Load/create/update local passages
├── lib/
│   ├── bible/                # BibleTextService, books, translations, SQLite provider
│   ├── storage/              # AsyncStorage Passage, PassageVerse, Section snapshots
│   └── supabase.ts           # Supabase client (optional)
├── constants/
│   └── tokens.ts             # Colors, radii, spacing, section palette
├── assets/
│   ├── bible/                # Generated translation DBs (gitignored *.sqlite)
│   │   └── .gitkeep
│   └── …                     # Images, fonts
├── scripts/                  # One-time data tooling (not app runtime)
│   ├── import_bible.py       # JSON / SQLite / EPUB → {translationId}.sqlite
│   ├── epub_net.py           # NET EPUB parser (used by import_bible)
│   ├── bible_db.py           # Shared schema write + validation
│   ├── book_ids.py           # 66-book slug / OSIS / numeric map
│   ├── extract_bible_epub.py # Deprecated wrapper → import_bible epub path
│   ├── requirements.txt      # Python deps (use scripts/.venv/)
│   └── data/                 # Source JSON/EPUB (gitignored)
├── global.css
├── tailwind.config.js        # Token-mapped Tailwind theme (sync with tokens.ts)
└── .env                      # Local secrets (gitignored)
```

## Navigation

Expo Router maps the filesystem under `app/` to routes.

```
app/_layout.tsx          → Root Stack
  ├── (tabs)/_layout.tsx → Bottom tabs (custom FloatingTabBar)
  │     ├── index        → /          (Home — passages list)
  │     └── profile      → /profile   (Profile)
  └── passage/           → Passage flow stack
        ├── new          → /passage/new       (translation)
        ├── reader       → /passage/reader    (Bible reader)
        └── sections     → /passage/sections  (divide into sections)
```

- **Initial route:** `(tabs)` (see `unstable_settings` in `app/_layout.tsx`)
- **Tab bar:** Custom floating pill bar via `components/shared/FloatingTabBar.tsx` — absolute positioned above content with safe-area inset
- **Screen padding:** Use `layout.screenBottomPadding` from tokens so lists scroll above the floating nav
- **Typed routes:** enabled via `experiments.typedRoutes` in `app.json`

## Home screen

Per the [Meditatio Spec](https://docs.google.com/document/d/1yog0U4SkrWwxtr_vdeyp98xp82PQVG2HRROi7mbgXdE/edit), the home screen lists saved passages with in-progress vs completed states.

**Current:**
- Loads passages from AsyncStorage via `hooks/usePassages.ts`
- `PassageCard` + `EmptyState`; CTA opens `/passage/new`
- Card press resumes by `currentTaskId`: `divide_sections` → `/passage/sections`; later tasks still stubbed

## Passage selection

Flow: translation → infinite-scroll Bible reader → multi-verse select → persist `Passage` + `PassageVerse` snapshots → divide sections (when needed).

- **Bible text:** `lib/bible/` (`BibleTextService` → SQLite `LocalSqliteProvider` on native)
- **User passages:** `lib/storage/` (AsyncStorage). `PassageVerse` is the source of truth for selected verses; Passage `start*`/`end*` are bounding-span metadata only
- **Reader UI:** `app/passage/reader.tsx` with `BibleReader`, `BookChapterModal`, `VerseBlock`, `SelectionConfirmBar`
- After create: if `currentTaskId === 'divide_sections'`, navigate to `/passage/sections`; 1–2 verse passages auto-create one section and skip to `name_sections`

## Divide into sections

Flow: show saved `PassageVerse` list → select contiguous verse groups → lock each as a colored `Section` → continue.

- **Screen:** `app/passage/sections.tsx` with `PassageVerseList`, extended `VerseBlock` / `SelectionConfirmBar`
- **Storage:** `Section` + `SectionVerse` on `PassageRecord`; `savePassageSections` advances `currentTaskId` to `name_sections`
- **Colors:** `sectionColors` / `sectionColorMuted` from tokens, assigned by section order
- **Skip:** passages with ≤2 verses never open this screen

**Deferred:** name sections UI, section tasks, WordToken/Acronym.

## Bible data import

Bundled offline text lives in gitignored `assets/bible/{id}.sqlite`, generated by `npm run bible:import:*`.

| Translation | Official bulk source | Import command |
|-------------|---------------------|----------------|
| KJV | Public-domain JSON (midvash) | `npm run bible:import:kjv` |
| NET | EPUB from bible.org (no official SQLite) | `npm run bible:import:net` |

- Catalog: `lib/bible/translations.ts` (`offlineAvailable`, attribution fields)
- Native assets: `TRANSLATION_ASSETS` in `LocalSqliteProvider.native.ts`
- Credits UI: Profile → Bible text credits (NET copyright + link)
- Full setup, licensing, and **Cursor cloud EPUB download-on-VM** steps: [`scripts/README.md`](scripts/README.md)

## Component library

Import shared UI from `@/components` (barrel at `components/index.ts`).

| Component | Location | Purpose |
|-----------|----------|---------|
| `FloatingTabBar` | `components/shared/` | Floating rounded bottom navigation |
| `PassageCard` | `components/shared/` | Passage list item on home screen |
| `EmptyState` | `components/shared/` | Reusable empty list placeholder |
| `BibleReader` | `components/shared/` | Infinite-scroll chapter reader |
| `BookChapterModal` | `components/shared/` | Book / chapter jump overlay |
| `VerseBlock` | `components/shared/` | Selectable verse row (optional section highlight) |
| `SelectionConfirmBar` | `components/shared/` | Floating confirm bar (configurable CTA) |
| `PassageVerseList` | `components/shared/` | Passage snapshot list for sectioning |
| Primitives (future) | `components/ui/` | Button, Badge, Input, etc. |

Before building new UI, audit `components/ui/` and `components/shared/`. See `.cursor/rules/frontend.mdc`.

## Design tokens

Source of truth: [`constants/tokens.ts`](constants/tokens.ts)

- **Colors:** `background`, `surface`, `textPrimary`, `textSecondary`, `accent`, status colors
- **Section palette:** `sectionColors[]` + `sectionColorMuted()` — assigned per memorization section
- **Radii / spacing / shadow / typography** — for StyleSheet and layout constants
- **Tailwind:** `tailwind.config.js` mirrors token values as utility classes (`bg-surface`, `text-primary`, `rounded-xl`, etc.)
- **Theme:** Light mode only for MVP

## Styling (NativeWind)

Tailwind utility classes are applied via the `className` prop on React Native components.

**Setup chain:**

1. `global.css` — `@tailwind` directives
2. `tailwind.config.js` — scans `app/` and `components/`
3. `babel.config.js` — `nativewind/babel` preset
4. `metro.config.js` — `withNativeWind(config, { input: './global.css' })`
5. `app/_layout.tsx` — imports `../global.css` at the top

If styles don't appear after config changes, run `npx expo start --clear`.

## Supabase (optional, currently disabled)

Client lives in `lib/supabase.ts`.

- Reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env`
- If either is missing, `supabase` is `null` and `isSupabaseConfigured` is `false` — no crash
- SSR-safe: session persistence is skipped during Node static rendering
- **Usage pattern:** always guard calls with `if (supabase)`

## Environment variables

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `COMPOSIO_API_KEY` | Composio MCP (Cursor only, not app bundle) |

## Conventions

- **Screens** go in `app/` (route files)
- **Shared UI** goes in `components/shared/`; primitives in `components/ui/`
- **Import shared components** via `@/components`
- **Global state** goes in `context/`
- **External service clients** go in `lib/`
- **Expo docs:** [Expo SDK 57 docs](https://docs.expo.dev/versions/v57.0.0/)

## Planned extension points

| Feature | Suggested location |
|---------|-------------------|
| Passage CRUD + local storage | `lib/storage/`, `hooks/usePassages.ts` (create/list/save sections) |
| Bible text provider | `lib/bible/BibleTextService.ts`, `lib/bible/providers/LocalSqliteProvider` (`.native` / `.web`) |
| Bundled Bible data | `assets/bible/{translationId}.sqlite` (via `npm run bible:import:*`, gitignored) |
| Passage selection reader | `app/passage/` (translation + reader; implemented) |
| Divide sections | `app/passage/sections.tsx` (implemented) |
| Memorization task flow | `app/passage/` continue screens (name sections → section tasks) |
| Section colors assignment | `sectionColors` / `sectionColorMuted` from tokens (in use) |
| User auth / cloud sync | `context/AuthContext.tsx`, Supabase |
| User settings | `app/(tabs)/profile.tsx` |

## Running locally

```bash
npm install
# Import Bible DBs first (see scripts/README.md) — required before native runs
npx expo start          # dev server
npx expo start --clear  # clear Metro cache (after NativeWind/config changes)
```
