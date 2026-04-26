'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { NotificationBell } from './notifications';
import { Menu, LogOut, User, Settings } from 'lucide-react';
import { ROLES } from '@/lib/auth/roles';
import type { UserRole } from '@/types';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || 'Admin');
        const { data: userData } = await supabase
          .from('users').select('school_id, full_name, role').eq('id', user.id).single();
        if (userData) {
          setUserRole(userData.role as UserRole);
          const { data: school } = await supabase.from('schools').select('name').eq('id', userData.school_id).single();
          if (school) setSchoolName(school.name);
        }
      }
    }
    loadUser();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const roleLabel = ROLES.find(r => r.value === userRole)?.label || 'Staff';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{schoolName || 'EDU GATE'}</h2>
            <p className="text-xs text-slate-500">Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-500 text-white text-sm">
                    {userName?.charAt(0)?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-700">{userName || 'Admin'}</p>
                  <p className="text-xs text-slate-500">{roleLabel}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs text-slate-400 font-normal -mt-2">
                {roleLabel} • {schoolName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
              <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
