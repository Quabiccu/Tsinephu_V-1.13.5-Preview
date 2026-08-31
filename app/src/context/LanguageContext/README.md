# LanguageContext - De-minified

Original file: 14,693 lines, 579KB, single file containing 128 languages.

Refactored structure for readability:

## Files
- `types.ts` - Language union type (130+ codes) and interfaces
- `baseTranslations.ts` - Base English translations (source of truth)
- `languagesMeta.ts` - Language list with flags, names, living/ancient categorization
- `translations/` - One file per language:
  - `en.ts` - English (base)
  - `es.ts` - Spanish
  - `ca.ts` - Catalan
  - ... 128 total
  - `index.ts` - Aggregates all into `translations` map
- `provider.tsx` - React Context provider, hooks, localStorage persistence
- `index.tsx` - Public API (re-exports everything)

## Benefits
- Each language file is ~50-200 lines instead of 14k monolith
- Easy to find and edit a specific language
- Better git diffs
- Tree-shakable (in future can lazy-load)
- Proper JSDoc and section headers

## Usage (unchanged)
```tsx
import { useLanguage } from '@/context/LanguageContext';
const { t, language, setLanguage, livingLanguages, ancientLanguages } = useLanguage();
```
