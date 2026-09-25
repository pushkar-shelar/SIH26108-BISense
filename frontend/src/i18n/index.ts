import { createContext, useContext } from "react";
import type { Language, TranslationKey } from "./translations";
import { translations } from "./translations";

export type { Language, TranslationKey };
export { translations };

const STORAGE_KEY = "maanak_language";
const DEFAULT_LANGUAGE: Language = "en";

export function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "hi" || stored === "mr") return stored;
  } catch {}
  return DEFAULT_LANGUAGE;
}

export function setStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
}

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang]?.[key] ?? translations["en"][key] ?? key;
}

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const I18nContext = createContext<I18nContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => translations["en"][key] ?? key,
});

export function useI18n(): I18nContextType {
  return useContext(I18nContext);
}
