'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

interface TourStep {
  title: string;
  content: string;
  icon: string;
  target?: string;
}

const steps: TourStep[] = [
  { title: 'Welcome! 👋', content: 'This tour shows you around your school dashboard.', icon: '👋' },
  { title: 'Sidebar Navigation', content: 'Use the sidebar to access all modules: Students, Finance, Clearance, and more.', icon: '📋' },
  { title: 'Quick Actions', content: 'The overview page has shortcuts to add students, record payments, and manage staff.', icon: '⚡' },
  { title: 'Search Anything', content: 'Use the search bar at the top to find students, books, offenses instantly.', icon: '🔍' },
  { title: 'Notifications', content: 'The bell icon shows payment receipts, leave alerts, and overdue reminders.', icon: '🔔' },
  { title: 'Profile & Settings', content: 'Click your avatar to manage profile, security, branding, and sign out.', icon: '👤' },
  { title: "You're Ready! 🚀", content: 'Start by adding students, creating departments, and setting up fee structures.', icon: '🚀' },
];

export function InteractiveTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState({ top: '50%', left: '50%' });

  useEffect(() => {
    const seen = localStorage.getItem('edu-gate-interactive-tour');
    if (!seen) {
      setTimeout(() => setShow(true), 1500);
    }
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem('edu-gate-interactive-tour', 'true');
  }

  function next() {
    if (step < steps.length - 1) {
      setStep(step + 1);
      // Randomize position slightly for visual interest
      const tops = ['15%', '30%', '50%', '25%', '40%', '55%', '20%'];
      const lefts = ['30%', '60%', '50%', '35%', '55%', '45%', '40%'];
      setPosition({ top: tops[step + 1] || '50%', left: lefts[step + 1] || '50%' });
    } else {
      dismiss();
    }
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  if (!show) return null;

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Tooltip Card */}
      <div style={{ position: 'absolute', top: position.top, left: position.left, transform: 'translate(-50%, -50%)', pointerEvents: 'auto' }}>
        <Card className="w-80 shadow-2xl border-2 border-blue-200 animate-in zoom-in-95 duration-300">
          <CardContent className="p-5 text-center">
            <button onClick={dismiss} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            
            <div className="text-4xl mb-3">{current.icon}</div>
            <h3 className="font-bold text-slate-800 mb-1">{current.title}</h3>
            <p className="text-sm text-slate-500 mb-4">{current.content}</p>

            {/* Step indicator */}
            <div className="flex justify-center gap-1.5 mb-4">
              {steps.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-blue-600 scale-125' : i < step ? 'bg-emerald-400' : 'bg-slate-300'}`} />
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={prev} disabled={step === 0}><ArrowLeft className="mr-1 h-3 w-3" />Back</Button>
              <span className="text-xs text-slate-400 pt-2">{step + 1} of {steps.length}</span>
              <Button size="sm" onClick={next} className="bg-gradient-to-r from-blue-600 to-emerald-600">
                {step === steps.length - 1 ? <><CheckCircle className="mr-1 h-3 w-3" />Done</> : <>Next<ArrowRight className="ml-1 h-3 w-3" /></>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arrow pointing to sidebar (visual indicator) */}
      {step >= 1 && step <= 3 && (
        <div style={{ position: 'absolute', top: '15%', left: '10px', pointerEvents: 'none' }}>
          <div className="text-white text-4xl animate-bounce">👈</div>
        </div>
      )}
    </div>
  );
}
