'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { GraduationCap, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error('Invalid email or password.');
      setIsLoading(false);
      return;
    }

    toast.success('Signed in successfully!');
    router.push('/overview');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-4 rounded-2xl shadow-lg">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            <span className="text-blue-600">EDU</span>
            <span className="text-emerald-600"> GATE</span>
          </CardTitle>
          <CardDescription className="text-base text-slate-500">
            Sign in to your school portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@school.ac.ke"
                required
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">
                <Lock className="h-4 w-4 inline mr-1" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Register your school
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
