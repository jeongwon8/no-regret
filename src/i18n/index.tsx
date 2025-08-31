import React, { createContext, useContext, useState } from "react";
import { messages, type Locale } from "./messages";

type Ctx = { t: (k: string) => string; locale: Locale; setLocale: (l: Locale) => void; };
const I18nCtx = createContext<Ctx>(null!);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>("ko");

  const t = (key: string) => {
    const parts = key.split(".");
    let cur: any = messages[locale];
    for (const p of parts) cur = cur?.[p];
    if (cur == null) {
      let en: any = messages.en; for (const p of parts) en = en?.[p];
      return en ?? key;
    }
    return cur;
  };

  return <I18nCtx.Provider value={{ t, locale, setLocale }}>{children}</I18nCtx.Provider>;
};

export const useI18n = () => useContext(I18nCtx);
