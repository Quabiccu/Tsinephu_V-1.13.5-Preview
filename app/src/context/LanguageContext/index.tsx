/**
 * LanguageContext - Main entry point (de-minified)
 *
 * This file replaces the previous 14k-line monolith with a clean modular structure.
 *
 * Structure:
 * ├── types.ts              - Language union + interfaces
 * ├── baseTranslations.ts   - English base (all keys)
 * ├── languagesMeta.ts      - Metadata: name, flag, living/ancient split
 * ├── translations/         - 128 individual language files
 * │   ├── index.ts          - Aggregated map
 * │   ├── en.ts, es.ts, etc.
 * ├── provider.tsx          - React context implementation
 * └── index.tsx             - This file (public API)
 */

export * from "./provider";
export * from "./types";
export {
  languages,
  livingLanguages,
  ancientLanguages,
  ANCIENT_CODES,
} from "./languagesMeta";
export { baseTranslations } from "./baseTranslations";
export { translations } from "./translations";
