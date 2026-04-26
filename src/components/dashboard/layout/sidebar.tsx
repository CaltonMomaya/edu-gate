'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  GraduationCap,
  TrendingUp,
  LayoutDashboard,
  Users,
  BookOpen,
  DollarSign,
  Scale,
  DoorOpen,
  ClipboardCheck,
  Settings,
  Gamepad2,
  Music,
  FlaskConical,
  X,
  Home,
  CreditCard, MessageSquare,
  UserPlus,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Overview', href: '/overview', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Teachers & Staff', href: '/teachers', icon: UserPlus },
  { name: 'Classes & Streams', href: '/classes', icon: Home },
  { name: "Exams & Results", href: "/exams", icon: BookOpen },
  { name: 'Houses', href: '/houses', icon: Home },
  { separator: true },
  { name: 'Finance', href: '/finance', icon: DollarSign },
  { name: 'Fees Structure', href: '/finance/fees', icon: CreditCard, MessageSquare, indent: true },
  { name: 'Payments', href: '/finance/payments', icon: DollarSign, indent: true },
  { name: 'Reports', href: '/finance/reports', icon: BookOpen, indent: true },
  { separator: true },
  { name: 'Library', href: '/library', icon: BookOpen },
  { name: 'Games & Sports', href: '/games', icon: Gamepad2 },
  { name: 'Music & Drama', href: '/music', icon: Music },
  { name: 'Departments', href: '/departments', icon: FlaskConical },
  { separator: true },
  { name: 'Discipline', href: '/discipline', icon: Scale },
  { name: 'Black Book', href: '/discipline/black-book', icon: Scale, indent: true },
  { separator: true },
  { name: 'Leave Management', href: '/leave', icon: DoorOpen },
  { name: "SMS", href: "/sms", icon: MessageSquare },
  { separator: true },
  { name: 'Clearance', href: '/clearance', icon: ClipboardCheck },
  { name: 'Alumni', href: '/alumni', icon: GraduationCap },
  { separator: true },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Subscription', href: '/subscription', icon: CreditCard },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose();
  };

  const NavContent = () => (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {navigation.map((item, index) => {
        if (item.separator) return <Separator key={`sep-${index}`} className="my-3 bg-slate-700/50" />;
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link key={item.name} href={item.href || ""} onClick={handleNavClick}
            className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              item.indent && 'ml-4',
              isActive ? 'bg-gradient-to-r from-blue-600/30 to-emerald-600/30 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white')}>
            {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}{item.name}
          </Link>
        );
      })}
    </nav>
  );

  const BrandLogo = () => (
    <Link href="/overview" className="flex items-center gap-2" onClick={handleNavClick}>
      <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-2 rounded-lg"><GraduationCap className="h-5 w-5 text-white" /></div>
      <span className="text-lg font-bold"><span className="text-blue-400">EDU</span><span className="text-emerald-400"> GATE</span></span>
    </Link>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/50">
        <BrandLogo />
        <Button variant="ghost" size="icon" className="lg:hidden text-white hover:text-slate-200 hover:bg-slate-700" onClick={onClose}><X className="h-5 w-5" /></Button>
      </div>
      <NavContent />
      <div className="p-4 border-t border-slate-700/50"><div className="text-xs text-slate-500 text-center">© 2026 EDU GATE</div></div>
    </div>
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-r-0" onPointerDownOutside={onClose} onEscapeKeyDown={onClose}>
          <VisuallyHidden><SheetTitle>Navigation Menu</SheetTitle></VisuallyHidden>
          {sidebarContent}
        </SheetContent>
      </Sheet>
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64">{sidebarContent}</div>
    </>
  );
}
