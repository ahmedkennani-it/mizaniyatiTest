import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';

import './i18n';
import { isRTLLanguage, type SupportedLanguage } from './i18n';

export interface LanguageContextValue {
  language: SupportedLanguage;
  isRTL: boolean;
  setLanguage: (language: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<SupportedLanguage>(
    i18n.language as SupportedLanguage,
  );

  const setLanguage = useCallback(
    (nextLanguage: SupportedLanguage) => {
      void i18n.changeLanguage(nextLanguage);

      // Native RTL mirroring only takes full effect after an app restart (a well-known
      // RN/I18nManager platform constraint), so `I18nManager.isRTL` itself never reflects this
      // in-session — compare against our own previous language instead. The `isRTL` flag
      // exposed by this context is what drives in-session RTL-aware behavior (e.g. forcing
      // amounts back to LTR) without waiting for that restart.
      const nextIsRTL = isRTLLanguage(nextLanguage);
      setLanguageState((previousLanguage) => {
        if (isRTLLanguage(previousLanguage) !== nextIsRTL) {
          I18nManager.allowRTL(nextIsRTL);
          I18nManager.forceRTL(nextIsRTL);
        }
        return nextLanguage;
      });
    },
    [i18n],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, isRTL: isRTLLanguage(language), setLanguage }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
