import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { switchLanguage, isRTL } from '@/i18n';

/**
 * Hook for accessing translations and language controls.
 * Wraps react-i18next with app-specific helpers.
 */
export function useLanguage() {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language as 'en' | 'ar';
  const isArabic = currentLanguage === 'ar';
  const rtl = isRTL();

  const changeLanguage = useCallback((lang: 'en' | 'ar') => {
    switchLanguage(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    const next = currentLanguage === 'en' ? 'ar' : 'en';
    switchLanguage(next);
  }, [currentLanguage]);

  return {
    t,
    i18n,
    currentLanguage,
    isArabic,
    rtl,
    changeLanguage,
    toggleLanguage,
  };
}
