import { useState, useEffect } from 'react';
import { getLocale, getTranslations } from '@/lib/i18n';

export function useTranslation() {
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState({});

  useEffect(() => {
    const lang = getLocale();
    setLocale(lang);
    setMessages(getTranslations(lang));
  }, []);

  const t = (key: string) => {
    const keys = key.split('.');
    let value = messages;
    for (const k of keys) {
      if (value === undefined) return key;
      value = value[k];
    }
    return value || key;
  };

  return { t, locale, messages };
}
