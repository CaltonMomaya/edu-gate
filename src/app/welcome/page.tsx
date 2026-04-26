import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Shield, Users, DollarSign, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-blue-400">EDU</span>
                <span className="text-emerald-400"> GATE</span>
              </span>
            </div>
            <div className="flex gap-4">
              <Link href="/login"><Button variant="ghost" className="text-white">Sign In</Button></Link>
              <Link href="/register"><Button className="bg-gradient-to-r from-blue-600 to-emerald-600">Get Started</Button></Link>
            </div>
          </nav>
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold leading-tight mb-6">The Complete School Management Platform</h1>
            <p className="text-xl text-slate-300 mb-8">Streamline admissions, track finances, manage clearance, and secure your campus — all in one place. Built for Kenyan schools.</p>
            <div className="flex gap-4">
              <Link href="/register"><Button size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-600 text-lg px-8">Start Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
              <Link href="/login"><Button size="lg" variant="outline" className="text-white border-white/30 text-lg px-8">School Login</Button></Link>
            </div>
          </div>
        </div>
      </header>

      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Need to Run Your School</h2>
          <p className="text-slate-500 text-center mb-12">From student admission to graduation clearance, EDU GATE handles it all.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Student Management', desc: 'Register students, capture photos, manage guardian contacts, and track academic progress.' },
              { icon: DollarSign, title: 'Finance Tracking', desc: 'Set fee structures, record payments, track balances, and manage overpayments automatically.' },
              { icon: Shield, title: 'Clearance System', desc: 'Step-by-step clearance workflow with Black Book integration.' },
              { icon: BookOpen, title: 'Library & Departments', desc: 'Issue books, track equipment, manage fines. Each department has its own dashboard.' },
              { icon: GraduationCap, title: 'Leave Management', desc: 'Approve leaves, send SMS to guardians, track returns. Auto-detect late returns.' },
              { icon: CheckCircle, title: 'Auto-Promotion', desc: 'Automatic grade promotion and alumni graduation at end of year.' },
            ].map((f, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardHeader>
                  <div className="p-3 bg-blue-100 rounded-xl w-fit mb-3"><f.icon className="h-6 w-6 text-blue-600" /></div>
                  <CardTitle>{f.title}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-slate-500 text-sm">{f.desc}</p></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-slate-500 text-center mb-12">All prices in Kenyan Shillings (KES)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { name: 'Starter', price: '2,900', limit: '200 students', features: ['Student Management', 'Library Module', 'Basic Reports'] },
              { name: 'Standard', price: '7,900', limit: '500 students', features: ['Everything in Starter', 'Leave Management', 'Clearance System', 'Black Book', 'SMS Alerts'], popular: true },
              { name: 'Premium', price: '14,900', limit: 'Unlimited', features: ['Everything in Standard', 'Priority Support', 'Custom Branding', 'API Access'] },
            ].map((p, i) => (
              <Card key={i} className={`border-0 shadow-sm relative ${p.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm">Most Popular</div>}
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <div className="mt-2"><span className="text-4xl font-bold">KES {p.price}</span><span className="text-slate-500">/mo</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {p.features.map((f, j) => <li key={j} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-500" />{f}</li>)}
                  </ul>
                  <Link href="/register"><Button className="w-full mt-6" variant={p.popular ? 'default' : 'outline'}>Start Free Trial</Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <GraduationCap className="h-6 w-6 text-blue-400" />
          <span className="text-xl font-bold"><span className="text-blue-400">EDU</span><span className="text-emerald-400"> GATE</span></span>
        </div>
        <p className="text-slate-400">© 2026 EDU GATE. All rights reserved.</p>
      </footer>
    </div>
  );
}
