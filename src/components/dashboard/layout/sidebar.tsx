'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { createClient } from '@/lib/supabase/client';
import {
  GraduationCap, TrendingUp, LayoutDashboard, Users, BookOpen,
  DollarSign, Scale, DoorOpen, ClipboardCheck, Settings,
  Gamepad2, Music, FlaskConical, X, Home, CreditCard, Download, Activity, HelpCircle, UserPlus, MessageSquare,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface NavItem {
  name: string;
  href?: string;
  icon?: any;
  indent?: boolean;
  separator?: boolean;
  roles?: UserRole[];
}

const allNavigation: NavItem[] = [
  { name: 'Overview', href: '/overview', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp, roles: ['admin', 'principal'] },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Exams & Results', href: '/exams', icon: BookOpen, roles: ['admin', 'principal', 'teacher', 'class_teacher'] },
  { name: 'Teachers & Staff', href: '/teachers', icon: UserPlus, roles: ['admin'] },
  { name: 'Classes & Streams', href: '/classes', icon: Home },
  { name: 'Houses', href: '/houses', icon: Home },
  { separator: true },
  { name: 'Finance', href: '/finance', icon: DollarSign, roles: ['admin', 'bursar', 'principal'] },
  { name: 'Fees Structure', href: '/finance/fees', icon: CreditCard, Download, Activity, HelpCircle, indent: true, roles: ['admin', 'bursar'] },
  { name: 'Payments', href: '/finance/payments', icon: DollarSign, indent: true, roles: ['admin', 'bursar'] },
  { name: 'Reports', href: '/finance/reports', icon: BookOpen, indent: true, roles: ['admin', 'bursar', 'principal'] },
  { separator: true },
  { name: 'Library', href: '/library', icon: BookOpen, roles: ['admin', 'librarian'] },
  { name: 'Games & Sports', href: '/games', icon: Gamepad2, roles: ['admin', 'games_master'] },
  { name: 'Music & Drama', href: '/music', icon: Music, roles: ['admin', 'music_teacher'] },
  { name: 'Departments', href: '/departments', icon: FlaskConical, roles: ['admin'] },
  { separator: true },
  { name: 'Discipline', href: '/discipline', icon: Scale, roles: ['admin', 'deputy'] },
  { name: 'Black Book', href: '/discipline/black-book', icon: Scale, indent: true, roles: ['admin', 'deputy'] },
  { separator: true },
  { name: 'Leave Management', href: '/leave', icon: DoorOpen, roles: ['admin', 'deputy', 'class_teacher'] },
  { separator: true },
  { name: 'Clearance', href: '/clearance', icon: ClipboardCheck },
  { name: 'Alumni', href: '/alumni', icon: GraduationCap },
  { separator: true },
  { name: 'SMS', href: '/sms', icon: MessageSquare, roles: ['admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
  { name: 'Subscription', href: '/subscription', icon: CreditCard, Download, Activity, HelpCircle, roles: ['admin'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [navigation, setNavigation] = useState<NavItem[]>(allNavigation);

  useEffect(() => {
    loadUserRole();
  }, []);

  async function loadUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData?.role) {
      const role = userData.role as UserRole;
      setUserRole(role);

      // Filter navigation based on role
      if (role === 'admin') {
        setNavigation(allNavigation); // Admin sees everything
      } else {
        setNavigation(
          allNavigation.filter(item => {
            // Separators always show
            if (item.separator) {
              // Only show separator if the next visible item exists
              return true;
            }
            // If no roles specified, show to everyone
            if (!item.roles) return true;
            // Show if user's role is in the allowed roles
            return item.roles.includes(role);
          }).filter((item, index, arr) => {
            // Remove orphan separators (two in a row)
            if (item.separator && (index === 0 || arr[index - 1]?.separator)) return false;
            if (item.separator && index === arr.length - 1) return false;
            return true;
          })
        );
      }
    }
  }

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose();
  };

  const NavContent = () => (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {navigation.map((item, index) => {
        if (item.separator) return <Separator key={`sep-${index}`} className="my-3 bg-slate-700/50" />;
        if (!item.href) return null;
        
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link key={item.name} href={item.href} onClick={handleNavClick}
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
      <div className="p-4 border-t border-slate-700/50">
        <div className="text-xs text-slate-500 text-center">© 2026 EDU GATE</div>
      </div>
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
