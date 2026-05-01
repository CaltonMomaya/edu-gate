import { createTranslator } from 'next-intl';

export const locales = ['en', 'sw', 'fr', 'de'];
export const defaultLocale = 'en';

export function getLocale() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('edu-gate-locale');
    return stored || defaultLocale;
  }
  return defaultLocale;
}

export function setLocale(locale: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('edu-gate-locale', locale);
  }
}

export function getTranslations(locale: string) {
  try {
    const messages = require(`../../messages/${locale}.json`);
    return messages;
  } catch {
    const messages = require(`../../messages/${defaultLocale}.json`);
    return messages;
  }
}
