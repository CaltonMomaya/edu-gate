'use client';

import { StudentForm } from '@/components/forms/student/student-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddStudentPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/students" className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Register New Student</h1>
          <p className="text-slate-500 mt-1">Fill in student details, upload photo, and add guardian contacts</p>
        </div>
      </div>

      <StudentForm />
    </div>
  );
}
