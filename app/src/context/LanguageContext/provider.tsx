/**
 * LanguageContext - De-minified and refactored for readability
 *
 * Original file was 14,693 lines in a single file.
 * Now split into:
 * - types.ts: Language union type
 * - baseTranslations.ts: English base strings
 * - languagesMeta.ts: Language metadata, flags, categories
 * - translations/: One file per language (128 files)
 * - translations/index.ts: Aggregated map
 * - provider.tsx: React context logic (this file's logic extracted to index.tsx)
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Language, LanguageMeta } from "./types";
import { translations } from "./translations";
import { languages, livingLanguages, ancientLanguages } from "./languagesMeta";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: LanguageMeta[];
  livingLanguages: LanguageMeta[];
  ancientLanguages: LanguageMeta[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("tsinephu-language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("tsinephu-language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    // Try current language, fallback to English, then key
    return translations[language]?.[key] || translations["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages,
        livingLanguages,
        ancientLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export type { Language } from "./types";
