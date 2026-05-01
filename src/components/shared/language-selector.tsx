'use client';

import { useState, useEffect } from 'react';
import { getLocale, setLocale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';

export function LanguageSelector() {
  const [currentLocale, setCurrentLocale] = useState('en');

  useEffect(() => {
    setCurrentLocale(getLocale());
  }, []);

  const changeLanguage = (locale: string) => {
    setLocale(locale);
    setCurrentLocale(locale);
    window.location.reload();
  };

  const languageNames: Record<string, string> = {
    en: 'English',
    sw: 'Swahili',
    fr: 'French',
    de: 'German',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languageNames).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => changeLanguage(code)}
            className={currentLocale === code ? 'bg-blue-50 text-blue-600' : ''}
          >
            {name} {currentLocale === code && '✓'}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
