'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: string;
}

const tourSteps: TourStep[] = [
  { title: 'Welcome to EDU GATE!', description: 'This is your school management dashboard. Let us show you around.', icon: '👋' },
  { title: 'Students', description: 'Register students, upload photos, track academic progress from Grade 10 to 12.', icon: '👤' },
  { title: 'Finance', description: 'Set fee structures, record payments, track arrears, and generate reports.', icon: '💰' },
  { title: 'Clearance', description: 'Manage Grade 12 clearance workflow. Each department clears students before graduation.', icon: '✅' },
  { title: 'Departments', description: 'Create custom departments like Labs, Games, Music. Each gets inventory tracking.', icon: '🏢' },
  { title: 'SMS & Parent Portal', description: 'Send bulk SMS to parents. Parents view fees and results via phone OTP.', icon: '📱' },
  { title: "You're Ready!", description: 'Start by adding students and staff. Configure fee structures and departments.', icon: '🚀' },
];

export function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('edu-gate-tour');
    if (!seen) {
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  function dismiss() {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('edu-gate-tour', 'true');
  }

  function next() {
    if (step < tourSteps.length - 1) setStep(step + 1);
    else dismiss();
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  if (!show || dismissed) return null;

  const current = tourSteps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        <CardContent className="p-6 text-center">
          <button onClick={dismiss} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
          
          <div className="text-5xl mb-4">{current.icon}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{current.title}</h2>
          <p className="text-slate-500 mb-6">{current.description}</p>

          {/* Progress dots */}
          <div className="flex justify-center gap-1 mb-4">
            {tourSteps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-blue-600' : i < step ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            ))}
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={prev} disabled={step === 0}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
            <Button onClick={next} className="bg-gradient-to-r from-blue-600 to-emerald-600">
              {step === tourSteps.length - 1 ? <><CheckCircle className="mr-1 h-4 w-4" /> Finish</> : <><ArrowRight className="mr-1 h-4 w-4" /> Next</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
