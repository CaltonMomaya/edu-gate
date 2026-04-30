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
import { useBranding } from '@/lib/branding';
import {
  GraduationCap, FileText, TrendingUp, LayoutDashboard, Users, BookOpen,
  DollarSign, Scale, DoorOpen, ClipboardCheck, Settings,
  Gamepad2, Music, FlaskConical, X, Home, CreditCard, UserPlus,
  MessageSquare, Download, Activity, HelpCircle, History, Database,
  Shield, Palette, Bell,
  Play,
  CheckCircle,
  PieChart, BarChart3,
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
  { name: "Overview", href: "/overview", icon: LayoutDashboard, "data-tour": "sidebar-overview" },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp, roles: ['admin', 'principal'] },
  { name: "Students", href: "/students", icon: Users, "data-tour": "sidebar-students" },
  { name: 'Report Cards', href: '/report-cards', icon: FileText, roles: ['admin', 'principal', 'teacher', 'class_teacher'] },
  { name: 'Exams & Results', href: '/exams', icon: BookOpen, roles: ['admin', 'principal', 'teacher', 'class_teacher'] },
  { name: 'Teachers & Staff', href: '/teachers', icon: UserPlus, roles: ['admin'] },
  { name: 'Classes & Streams', href: '/classes', icon: Home },
  { name: 'Houses', href: '/houses', icon: Home },
  { separator: true },
  { name: "Finance", href: "/finance", icon: DollarSign, "data-tour": "sidebar-finance", roles: ['admin', 'bursar', 'principal'] },
  { name: 'Fees Structure', href: '/finance/fees', icon: CreditCard, indent: true, roles: ['admin', 'bursar'] },
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
  { name: "Clearance", href: "/clearance", icon: ClipboardCheck, "data-tour": "sidebar-clearance" },
  { name: 'Alumni', href: '/alumni', icon: GraduationCap },
  { separator: true },
  { name: 'SMS', href: '/sms', icon: MessageSquare, roles: ['admin'] },
  { name: 'Data Export', href: '/export', icon: Download, roles: ['admin'] },
  { name: 'System Health', href: '/health', icon: Activity, roles: ['admin'] },
  { name: "System Tests", href: "/testing", icon: Play, roles: ["admin"] },
  { name: "Deploy Checklist", href: "/deploy", icon: CheckCircle, roles: ["admin"] },
  { name: "Audit Report", href: "/audit-report", icon: PieChart, roles: ["admin"] },
  { name: 'Help & Guides', href: '/help', icon: HelpCircle },
  { name: 'Audit Logs', href: '/audit-logs', icon: History, roles: ['admin', 'principal'] },
  { separator: true },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
  { name: 'Security', href: '/security', icon: Shield, roles: ['admin'] },
  { name: 'Bulk Operations', href: '/bulk', icon: TrendingUp, roles: ['admin'] },
  { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['admin'] },
  { name: 'Branding', href: '/branding', icon: Palette, roles: ['admin'] },
  { name: 'Subscription', href: '/subscription', icon: CreditCard, roles: ['admin'] },
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
  const { primaryColor, secondaryColor, logoUrl, schoolName } = useBranding();

  useEffect(() => { loadUserRole(); }, []);

  useEffect(() => {
    async function loadDepts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: assignedDepts } = await supabase.from('departments').select('id, name').eq('assigned_officer', user.id);
      if (assignedDepts && assignedDepts.length > 0) {
        const defaults = ['Library', 'Finance', 'Discipline'];
        const custom = assignedDepts.filter(d => !defaults.includes(d.name));
        if (custom.length > 0) {
          const deptNav = custom.map(d => ({ name: d.name, href: `/departments/${d.id}`, icon: Building2 }));
          setNavigation(prev => { const without = prev.filter(i => !custom.find(d => d.name === i.name)); return [...without, { separator: true }, ...deptNav]; });
        }
      }
    }
    if (userRole && userRole !== 'admin') loadDepts();
  }, [userRole]);

  async function loadUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData?.role) {
      const role = userData.role as UserRole;
      setUserRole(role);
      if (role === 'admin') { setNavigation(allNavigation); }
      else {
        setNavigation(allNavigation.filter(item => {
          if (item.separator) return true;
          if (!item.roles) return true;
          return item.roles.includes(role);
        }).filter((item, index, arr) => {
          if (item.separator && (index === 0 || arr[index - 1]?.separator)) return false;
          if (item.separator && index === arr.length - 1) return false;
          return true;
        }));
      }
    }
  }

  const handleNavClick = () => { if (window.innerWidth < 1024) onClose(); };

  const sidebarContent = (
    <div className="flex h-full flex-col text-white" style={{ background: `linear-gradient(to bottom, ${primaryColor}E6, ${secondaryColor}E6)` }}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        <Link href="/overview" className="flex items-center gap-2" onClick={handleNavClick}>
          <div className="bg-white/20 p-2 rounded-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">{schoolName || 'EDU GATE'}</span>
        </Link>
        <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={onClose}><X className="h-5 w-5" /></Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item, index) => {
          if (item.separator) return <Separator key={`sep-${index}`} className="my-3 bg-white/10" />;
          if (!item.href) return null;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link key={item.name} href={item.href} data-tour={item["data-tour"]} onClick={handleNavClick}
              className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                item.indent && 'ml-4',
                isActive ? 'bg-white/20 text-white shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white')}>
              {item.icon && <item.icon className="h-4 w-4" />}{item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10"><div className="text-xs text-white/60 text-center">© 2026 {schoolName || 'EDU GATE'}</div></div>
    </div>
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" onPointerDownOutside={onClose} className="p-0 w-72 border-r-0" style={{ background: primaryColor }}>
          <VisuallyHidden><SheetTitle>Navigation</SheetTitle></VisuallyHidden>
          {sidebarContent}
        </SheetContent>
      </Sheet>
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64">{sidebarContent}</div>
    </>
  );
}
