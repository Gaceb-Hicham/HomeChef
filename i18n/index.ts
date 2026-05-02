import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager, Platform } from 'react-native';
import en from './en';
import ar from './ar';

const resources = { en: { translation: en }, ar: { translation: ar } };

// Detect device locale
const deviceLang = Localization.getLocales?.()?.[0]?.languageCode || 'en';
const defaultLang = ['ar', 'en'].includes(deviceLang) ? deviceLang : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

/**
 * Switch language and apply RTL if needed
 */
export function switchLanguage(lang: 'en' | 'ar') {
  i18n.changeLanguage(lang);

  const isRTL = lang === 'ar';
  if (Platform.OS !== 'web') {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }
}

/**
 * Get current language direction
 */
export function isRTL(): boolean {
  return i18n.language === 'ar';
}

export default i18n;
