'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { schoolRegistrationSchema } from '@/lib/validators/school';
import { toast } from 'sonner';
import { GraduationCap, Building2, Mail, MapPin, Hash, User, Lock, ArrowRight, Loader2, Shield, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const extendedSchema = schoolRegistrationSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ExtendedForm = z.infer<typeof extendedSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExtendedForm>({
    resolver: zodResolver(extendedSchema),
  });

  async function onSubmit(data: ExtendedForm) {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('schoolName', data.schoolName);
      formData.append('poBox', data.poBox);
      formData.append('email', data.email);
      formData.append('schoolCode', data.schoolCode);
      formData.append('adminFullName', data.adminFullName);
      formData.append('adminEmail', data.adminEmail);
      formData.append('adminPassword', data.adminPassword);

      const response = await fetch('/api/auth/register', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Registration failed');
        return;
      }
      if (result.success) {
        setIsSuccess(true);
        toast.success('School registered successfully!');
        setTimeout(() => { window.location.href = '/login?registered=true'; }, 2000);
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-emerald-600 items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 text-center text-white">
            <div className="bg-white/20 p-6 rounded-full inline-block mb-6">
              <CheckCircle className="h-16 w-16" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Registration Successful!</h2>
            <p className="text-white/80 text-lg">Redirecting to login...</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 bg-white lg:hidden">
          <div className="text-center">
            <div className="bg-emerald-100 p-6 rounded-full inline-block mb-4">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Successful!</h2>
            <p className="text-slate-500">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - IMAGE */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900">
        <img
          src="/reg-img/stud.png"
          alt="Students"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40" />
        <div className="relative z-10 flex flex-col justify-center p-12 w-full">
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            <span className="text-blue-400">EDU</span>
            <span className="text-emerald-400"> GATE</span>
          </h1>
          <p className="text-slate-200 text-lg leading-relaxed max-w-md">
            The complete school management platform. Streamline admissions, track finances, manage clearance, and secure your campus — all in one place.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white">
              <span className="w-2 h-2 bg-blue-400 rounded-full" /> Student Management
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" /> Finance Tracking
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white">
              <span className="w-2 h-2 bg-amber-400 rounded-full" /> Clearance System
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden text-center mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-3 rounded-2xl shadow-lg inline-block mb-3">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-blue-600">EDU</span>
              <span className="text-emerald-600"> GATE</span>
            </h1>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Register Your School</h2>
            <p className="text-slate-500 mt-1">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">School Information</h3>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName" className="text-slate-700 text-sm">School Name *</Label>
                  <Input id="schoolName" placeholder="e.g., Sunrise Academy" className="h-10" {...register('schoolName')} />
                  {errors.schoolName && <p className="text-xs text-red-500">{errors.schoolName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poBox" className="text-slate-700 text-sm"><MapPin className="h-3 w-3 inline mr-1" /> P.O Box *</Label>
                  <Input id="poBox" placeholder="e.g., 1234-00100" className="h-10" {...register('poBox')} />
                  {errors.poBox && <p className="text-xs text-red-500">{errors.poBox.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 text-sm"><Mail className="h-3 w-3 inline mr-1" /> School Email *</Label>
                  <Input id="email" type="email" placeholder="info@school.ac.ke" className="h-10" autoComplete="email" {...register('email')} />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolCode" className="text-slate-700 text-sm"><Hash className="h-3 w-3 inline mr-1" /> School Code *</Label>
                  <Input id="schoolCode" placeholder="e.g., 4072101" className="h-10" {...register('schoolCode')} />
                  {errors.schoolCode && <p className="text-xs text-red-500">{errors.schoolCode.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Admin Account</h3>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="adminFullName" className="text-slate-700 text-sm"><User className="h-3 w-3 inline mr-1" /> Full Name *</Label>
                <Input id="adminFullName" placeholder="e.g., John Doe" className="h-10" autoComplete="name" {...register('adminFullName')} />
                {errors.adminFullName && <p className="text-xs text-red-500">{errors.adminFullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail" className="text-slate-700 text-sm"><Mail className="h-3 w-3 inline mr-1" /> Admin Email *</Label>
                <Input id="adminEmail" type="email" placeholder="admin@school.ac.ke" className="h-10" autoComplete="email" {...register('adminEmail')} />
                {errors.adminEmail && <p className="text-xs text-red-500">{errors.adminEmail.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword" className="text-slate-700 text-sm"><Lock className="h-3 w-3 inline mr-1" /> Password *</Label>
                <div className="relative">
                  <Input id="adminPassword" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 chars, upper, lower, number" className="h-10 pr-10" autoComplete="new-password" {...register('adminPassword')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {errors.adminPassword && <p className="text-xs text-red-500">{errors.adminPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 text-sm"><Lock className="h-3 w-3 inline mr-1" /> Confirm Password *</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter your password" className="h-10 pr-10" autoComplete="new-password" {...register('confirmPassword')} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg shadow-blue-500/25 transition-all" disabled={isLoading}>
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating School...</>) : (<><span>Register School</span><ArrowRight className="ml-2 h-4 w-4" /></>)}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
