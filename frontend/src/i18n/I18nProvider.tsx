import { useState, useCallback } from "react";
import type { Language } from "./index";
import { I18nContext, getStoredLanguage, setStoredLanguage, translations } from "./index";
import type { TranslationKey } from "./translations";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
  }, []);

  const translate = useCallback(
    (key: TranslationKey): string => translations[language]?.[key] ?? translations["en"][key] ?? key,
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </I18nContext.Provider>
  );
}
