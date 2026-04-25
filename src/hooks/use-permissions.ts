'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ROLE_PERMISSIONS, type UserRole, type Permission } from '@/types';

export function usePermissions() {
  const supabase = createClient();
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role) {
        const userRole = userData.role as UserRole;
        setRole(userRole);
        setPermissions(ROLE_PERMISSIONS[userRole] || []);
        setIsAdmin(userRole === 'admin');
      }
      setIsLoading(false);
    }
    loadRole();
  }, [supabase]);

  const canAccess = (module: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean => {
    if (isAdmin) return true; // Admin can do everything
    
    const modulePermission = permissions.find(
      p => p.module === module || p.module === '*'
    );
    
    if (!modulePermission) return false;
    return modulePermission.actions.includes(action);
  };

  return { role, permissions, isAdmin, canAccess, isLoading };
}
