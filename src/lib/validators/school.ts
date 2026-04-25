import { z } from 'zod';

export const schoolRegistrationSchema = z.object({
  schoolName: z
    .string()
    .min(3, 'School name must be at least 3 characters')
    .max(100, 'School name must be less than 100 characters'),
  poBox: z
    .string()
    .min(1, 'P.O Box is required')
    .max(20, 'P.O Box must be less than 20 characters'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  schoolCode: z
    .string()
    .min(4, 'School code (index number) must be at least 4 characters')
    .max(20, 'School code must be less than 20 characters'),
  adminFullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters'),
  adminEmail: z
    .string()
    .email('Please enter a valid email address'),
  adminPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type SchoolRegistrationForm = z.infer<typeof schoolRegistrationSchema>;
