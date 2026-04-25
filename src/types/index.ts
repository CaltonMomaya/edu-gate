// ==================== SCHOOL ====================
export interface School {
  id: string;
  name: string;
  po_box: string;
  email: string;
  school_code: string;
  subscription_status: 'active' | 'grace_period' | 'suspended';
  subscription_plan: 'starter' | 'standard' | 'premium' | null;
  subscription_expires_at: string | null;
  created_at: string;
}

// ==================== USER ROLES & PERMISSIONS ====================
export type UserRole = 
  | 'admin' 
  | 'principal' 
  | 'deputy' 
  | 'bursar' 
  | 'teacher' 
  | 'class_teacher' 
  | 'librarian' 
  | 'games_master' 
  | 'lab_tech' 
  | 'music_teacher';

export interface Permission {
  module: string;
  actions: ('view' | 'create' | 'edit' | 'delete')[];
}

// Define what each role can access
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { module: '*', actions: ['view', 'create', 'edit', 'delete'] },
  ],
  principal: [
    { module: 'overview', actions: ['view'] },
    { module: 'students', actions: ['view', 'create', 'edit'] },
    { module: 'teachers', actions: ['view'] },
    { module: 'finance', actions: ['view'] },
    { module: 'discipline', actions: ['view', 'edit'] },
    { module: 'clearance', actions: ['view'] },
  ],
  deputy: [
    { module: 'overview', actions: ['view'] },
    { module: 'students', actions: ['view', 'edit'] },
    { module: 'discipline', actions: ['view', 'create', 'edit', 'delete'] },
    { module: 'leave', actions: ['view', 'create', 'edit'] },
    { module: 'clearance', actions: ['view', 'create', 'edit'] },
  ],
  bursar: [
    { module: 'overview', actions: ['view'] },
    { module: 'finance', actions: ['view', 'create', 'edit', 'delete'] },
    { module: 'students', actions: ['view'] },
    { module: 'clearance', actions: ['view', 'edit'] },
  ],
  teacher: [
    { module: 'overview', actions: ['view'] },
    { module: 'students', actions: ['view'] },
    { module: 'classes', actions: ['view'] },
  ],
  class_teacher: [
    { module: 'overview', actions: ['view'] },
    { module: 'students', actions: ['view', 'edit'] },
    { module: 'leave', actions: ['view', 'create'] },
  ],
  librarian: [
    { module: 'overview', actions: ['view'] },
    { module: 'library', actions: ['view', 'create', 'edit'] },
    { module: 'clearance', actions: ['view', 'edit'] },
  ],
  games_master: [
    { module: 'overview', actions: ['view'] },
    { module: 'games', actions: ['view', 'create', 'edit'] },
    { module: 'clearance', actions: ['view', 'edit'] },
  ],
  lab_tech: [
    { module: 'overview', actions: ['view'] },
    { module: 'departments', actions: ['view', 'create', 'edit'] },
    { module: 'clearance', actions: ['view', 'edit'] },
  ],
  music_teacher: [
    { module: 'overview', actions: ['view'] },
    { module: 'music', actions: ['view', 'create', 'edit'] },
    { module: 'clearance', actions: ['view', 'edit'] },
  ],
};

// ==================== USER ====================
export interface User {
  id: string;
  email: string;
  school_id: string;
  role: UserRole;
  full_name: string;
}

// ==================== STUDENT ====================
export interface Student {
  id: string;
  school_id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | null;
  profile_picture_url: string | null;
  grade: '10' | '11' | '12';
  stream: string | null;
  house: string | null;
  status: 'active' | 'graduated' | 'transferred' | 'alumni';
  created_at: string;
}

// ==================== GUARDIAN ====================
export interface Guardian {
  id: string;
  student_id: string;
  full_name: string;
  relationship: 'mother' | 'father' | 'guardian';
  phone_number: string;
  email: string | null;
  is_emergency_contact: boolean;
  is_primary: boolean;
}
