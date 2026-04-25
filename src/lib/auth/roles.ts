export const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'principal', label: 'Principal' },
  { value: 'deputy', label: 'Deputy Principal' },
  { value: 'bursar', label: 'Bursar' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'class_teacher', label: 'Class Teacher' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'games_master', label: 'Games Master' },
  { value: 'lab_tech', label: 'Lab Technician' },
  { value: 'music_teacher', label: 'Music Teacher' },
] as const;

export type Role = (typeof ROLES)[number]['value'];
