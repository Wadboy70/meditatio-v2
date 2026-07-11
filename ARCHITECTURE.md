# Meditatio — Architecture

> Last updated: 2026-07-05

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
│   └── (tabs)/               # Bottom tab navigator
│       ├── _layout.tsx       # Floating tab bar (Home, Profile)
│       ├── index.tsx         # Home — saved passages list
│       └── profile.tsx       # Profile tab
├── components/
│   ├── index.ts              # Root barrel — import shared UI via @/components
│   ├── ui/                   # Design system primitives (placeholder)
│   └── shared/               # Composite components
│       ├── FloatingTabBar.tsx
│       ├── PassageCard.tsx
│       └── EmptyState.tsx
├── context/                  # React context providers (reserved)
├── lib/
│   ├── bible/                # BibleTextService + LocalSqliteProvider
│   └── supabase.ts           # Supabase client (optional)
├── constants/
│   └── tokens.ts             # Colors, radii, spacing, section palette
├── assets/
│   ├── bible/                # Generated translation DBs (gitignored *.sqlite)
│   │   └── .gitkeep
│   └── …                     # Images, fonts
├── scripts/                  # One-time data tooling (not app runtime)
│   ├── extract_bible_epub.py # EPUB → {translationId}.sqlite
│   ├── book_ids.py           # 66-book slug map
│   ├── requirements.txt      # Python deps (use scripts/.venv/)
│   └── data/                 # Source EPUB (gitignored)
├── global.css
├── tailwind.config.js        # Token-mapped Tailwind theme (sync with tokens.ts)
└── .env                      # Local secrets (gitignored)
```

## Navigation

Expo Router maps the filesystem under `app/` to routes.

```
app/_layout.tsx          → Root Stack
  └── (tabs)/_layout.tsx → Bottom tabs (custom FloatingTabBar)
        ├── index        → /          (Home — passages list)
        └── profile      → /profile   (Profile)
```

- **Initial route:** `(tabs)` (see `unstable_settings` in `app/_layout.tsx`)
- **Tab bar:** Custom floating pill bar via `components/shared/FloatingTabBar.tsx` — absolute positioned above content with safe-area inset
- **Screen padding:** Use `layout.screenBottomPadding` from tokens so lists scroll above the floating nav
- **Typed routes:** enabled via `experiments.typedRoutes` in `app.json`

## Home screen

Per the [Meditatio Spec](https://docs.google.com/document/d/1yog0U4SkrWwxtr_vdeyp98xp82PQVG2HRROi7mbgXdE/edit), the home screen lists saved passages with in-progress vs completed states.

**Current setup phase:**
- `PassageCard` displays title, reference, status badge, and progress hint
- `EmptyState` for zero-passage UI
- Placeholder sample data in `app/(tabs)/index.tsx` (no local storage yet)
- "Start a passage" shows a coming-soon alert until the memorization flow is built

**Deferred:** SQLite/AsyncStorage, `Passage` entity CRUD, Bible picker, memorization task flow.

## Component library

Import shared UI from `@/components` (barrel at `components/index.ts`).

| Component | Location | Purpose |
|-----------|----------|---------|
| `FloatingTabBar` | `components/shared/` | Floating rounded bottom navigation |
| `PassageCard` | `components/shared/` | Passage list item on home screen |
| `EmptyState` | `components/shared/` | Reusable empty list placeholder |
| Primitives (future) | `components/ui/` | Button, Badge, Input, etc. |

Before building new UI, audit `components/ui/` and `components/shared/`. See `.cursor/rules/frontend.mdc`.

## Design tokens

Source of truth: [`constants/tokens.ts`](constants/tokens.ts)

- **Colors:** `background`, `surface`, `textPrimary`, `textSecondary`, `accent`, status colors
- **Section palette:** `sectionColors[]` — assigned per memorization section (future)
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
| Passage CRUD + local storage | `lib/storage/`, `hooks/usePassages.ts` |
| Bible text provider | `lib/bible/BibleTextService.ts`, `lib/bible/providers/LocalSqliteProvider` (`.native` / `.web`) |
| Bundled Bible data | `assets/bible/{translationId}.sqlite` (generated via `npm run bible:extract`, gitignored) |
| Memorization task flow | `app/passage/` route group |
| Section colors assignment | Use `sectionColors` from tokens |
| User auth / cloud sync | `context/AuthContext.tsx`, Supabase |
| User settings | `app/(tabs)/profile.tsx` |

## Running locally

```bash
npm install
npx expo start          # dev server
npx expo start --clear  # clear Metro cache (after NativeWind/config changes)
```
