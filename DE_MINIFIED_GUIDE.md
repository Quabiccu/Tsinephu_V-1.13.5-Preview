# Tsinephu V1.13.5-Preview — De-minified for Readability

This document explains the de-minification work performed on the codebase.

## Summary

Original codebase had:
- `app/src/context/LanguageContext.tsx`: **14,693 lines**, **579 KB**, single file containing 128 languages
- `app/dist/assets/index-CUaEfRIS.js`: **116 lines**, **1.3 MB** minified bundle (unreadable)
- `app/src/components/MapParnikDrawer.tsx`: **1,560 lines**, mixed concerns (icons, geo math, KML parser, UI)

After de-minification:
- LanguageContext split into **135 files** (types, base, meta, 128 language files, provider)
- MapParnikDrawer split into **6 modules** + main component with JSDoc
- Dist bundle beautified from 116 lines → **50,957 lines** readable
- All source files formatted with Prettier

---

## 1. LanguageContext Refactor

### Before
```
app/src/context/LanguageContext.tsx (14,693 lines)
  ├── type Language = ... (130+ union)
  ├── interface Translations
  ├── const baseTranslations = { ... } (200+ keys)
  ├── const translations: Record<Language, Translations> = {
  │     en: { ... },
  │     es: { ... },
  │     ... 128 languages
  │   }
  ├── const languages = [ {code, name, flag}, ... ]
  ├── livingLanguages / ancientLanguages filters
  └── LanguageProvider + useLanguage hook
```

### After
```
app/src/context/LanguageContext/
  ├── types.ts                → Language union + interfaces (33 lines)
  ├── baseTranslations.ts     → English source of truth (297 lines)
  ├── languagesMeta.ts        → Metadata + ANCIENT_CODES + living/ancient (152 lines)
  ├── translations/
  │   ├── index.ts            → Aggregated map, imports all languages
  │   ├── en.ts               → English
  │   ├── es.ts               → Spanish
  │   ├── af.ts, de.ts, ...   → 128 files, ~50-200 lines each
  │   ├── elx.ts, phn.ts, ... → Ancient symbolic languages
  │   └── ...
  ├── provider.tsx            → React context logic (clean, 80 lines)
  ├── index.tsx               → Public API (re-exports)
  ├── README.md               → Documentation
  └── LanguageContext.original.tsx → Backup of original
```

#### Benefits
- **Findability**: Need to edit Turkish? Open `translations/tr.ts`
- **Git diffs**: Changing one language doesn't touch 14k lines
- **Readability**: Each file has header comment, JSDoc
- **Maintainability**: Easy to add new language, just create file + import in index

#### Example: translations/es.ts
```ts
/**
 * es translations
 * Auto-generated from monolithic LanguageContext.tsx - de-minified
 */

import { baseTranslations } from '../baseTranslations';
import type { Translations } from '../types';

export const esTranslations: Translations = {
  ...baseTranslations,
  welcome: 'Bienvenido a Tsinephu',
  // ...
};
```

---

## 2. MapParnikDrawer Refactor

### Before
Single 1,560-line file with:
- Types, constants, icons, geo helpers, KML parser, subcomponents, main component

### After
```
app/src/components/map/
  ├── constants.ts            → MAX_HISTORY, COLORS, mapStyles
  ├── types.ts                → Layer, HistoryEntry, DrawingTool, etc.
  ├── geoHelpers.ts           → calculateDistance, calculatePolygonArea, getZoneBounds
  ├── icons.ts                → editIcon, markerIcon, distanceIcon, selectedPointIcon
  ├── kmlParser.ts            → parseKMLToGeoJSON
  ├── subcomponents.tsx       → MapController, MapInfoTracker, DrawingHandler, etc.
  └── MapParnikDrawer.original.tsx → Backup

app/src/components/MapParnikDrawer.tsx → Main component (now imports from ./map/*)
```

#### Benefits
- Each module is independently testable
- Clear separation: pure functions vs UI
- JSDoc on every helper
- Easier to reuse geo helpers elsewhere

---

## 3. Dist Bundle De-minification

### Before
```
app/dist/assets/index-CUaEfRIS.js
  - 116 lines
  - 1,323,099 bytes
  - Minified: no whitespace, single-char variables
```

### After
```
app/dist-readable/assets/index-CUaEfRIS.readable.js
  - 50,957 lines
  - 1.8 MB beautified
  - Indented 2 spaces, max 2 blank lines
  - Readable function bodies, object literals
```

Generated via:
```bash
npx js-beautify dist/assets/index-CUaEfRIS.js --indent-size 2 > dist-readable/assets/index-CUaEfRIS.readable.js
```

---

## 4. General Formatting

All source files formatted with Prettier:
```bash
npx prettier --write "src/**/*.{ts,tsx,js,jsx,css}"
```

- Consistent 2-space indent
- Semicolons, double quotes
- Trailing commas
- Line wrapping

---

## 5. Other Readability Improvements

### AuthContext.tsx (581 lines)
Already readable but enhanced:
- Section headers: Secure Admin System, Input Sanitization, Rate Limiting, Audit Logging, Password Hashing
- JSDoc on `sanitizeInput`, `iterativeHash`
- Clear separation of concerns

### ParnikContext.tsx (468 lines)
- Added comments for global storage keys
- Documented ban/report system
- Clear method grouping: CRUD, likes, reparniks, polls, code parniks, admin

### CodeEditor.tsx & CodePreview.tsx
- Line number sync explained
- Build document function documented
- Keyboard shortcuts documented

---

## How to Use De-minified Code

### Development
```bash
cd app
npm install
npm run dev
```

Imports unchanged:
```ts
import { useLanguage } from '@/context/LanguageContext';
import { MapParnikDrawer } from '@/components/MapParnikDrawer';
```

Because `LanguageContext` is now a folder with `index.tsx`, the alias `@/context/LanguageContext` still resolves correctly (folder index).

### Adding a New Language
1. Create `app/src/context/LanguageContext/translations/xx.ts`:
```ts
import { baseTranslations } from '../baseTranslations';
export const xxTranslations = {
  ...baseTranslations,
  welcome: '...',
};
```
2. Add to `translations/index.ts`:
```ts
import { xxTranslations } from './xx';
export const translations = {
  // ...
  xx: xxTranslations,
};
```
3. Add metadata to `languagesMeta.ts`

---

## File Tree (De-minified Highlights)

```
app/
  ├── src/
  │   ├── context/
  │   │   ├── LanguageContext/          ← NEW modular (was single file)
  │   │   │   ├── types.ts
  │   │   │   ├── baseTranslations.ts
  │   │   │   ├── languagesMeta.ts
  │   │   │   ├── provider.tsx
  │   │   │   ├── index.tsx
  │   │   │   └── translations/ (128 files)
  │   │   ├── AuthContext.tsx           ← Formatted + documented
  │   │   ├── ParnikContext.tsx         ← Formatted
  │   │   └── ...
  │   ├── components/
  │   │   ├── map/                      ← NEW modular
  │   │   │   ├── constants.ts
  │   │   │   ├── types.ts
  │   │   │   ├── geoHelpers.ts
  │   │   │   ├── icons.ts
  │   │   │   ├── kmlParser.ts
  │   │   │   └── subcomponents.tsx
  │   │   ├── MapParnikDrawer.tsx       ← De-minified main (imports from ./map)
  │   │   ├── ParnikCard.tsx            ← Formatted
  │   │   ├── ComposeModal.tsx          ← Formatted
  │   │   └── ...
  │   └── ...
  ├── dist/
  │   └── assets/
  │       └── index-CUaEfRIS.js         ← Original minified (116 lines)
  └── dist-readable/                    ← NEW readable bundle
      └── assets/
          └── index-CUaEfRIS.readable.js ← Beautified (50,957 lines)
```

---

## Verification

```bash
# Check LanguageContext split
ls app/src/context/LanguageContext/translations | wc -l
# → 129 (128 languages + index.ts)

# Check Map split
ls app/src/components/map/
# → constants.ts, types.ts, geoHelpers.ts, icons.ts, kmlParser.ts, subcomponents.tsx

# Check readable bundle
wc -l app/dist-readable/assets/index-CUaEfRIS.readable.js
# → 50957
```

---

## License
Apache 2.0 — Same as original Tsinephu
2026 Quabiccu
