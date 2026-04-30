'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Menu, Home, Users, DollarSign, GraduationCap } from 'lucide-react';

const mobileLinks = [
  { name: 'Dashboard', href: '/overview', icon: Home },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Finance', href: '/finance', icon: DollarSign },
  { name: 'Clearance', href: '/clearance', icon: GraduationCap },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="flex items-center justify-around p-2">
        {mobileLinks.map(link => (
          <Link key={link.name} href={link.href} className="flex flex-col items-center p-2 text-slate-500 hover:text-blue-600">
            <link.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{link.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
