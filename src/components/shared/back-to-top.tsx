'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return visible ? (
    <Button
      className="fixed bottom-6 right-6 rounded-full h-12 w-12 shadow-lg z-50 bg-gradient-to-r from-blue-600 to-emerald-600"
      size="icon"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  ) : null;
}
