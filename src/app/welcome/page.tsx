'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Shield, Users, DollarSign, BookOpen, ArrowRight, CheckCircle, Phone, Building2, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold"><span className="text-blue-600">EDU</span><span className="text-emerald-600"> GATE</span></span>
          </div>
          <div className="hidden md:flex gap-4">
            <Link href="/login"><Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg">🔑 Staff Login</Button></Link>
            <Link href="/parent"><Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg">Parent Portal</Button></Link>
            <Link href="/register"><Button className="bg-gradient-to-r from-blue-600 to-emerald-600">Get Started Free</Button></Link>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t p-4 space-y-2 bg-white">
            <Link href="/login" className="block p-2 hover:bg-slate-50 rounded">🔑 Staff Login</Link>
            <Link href="/parent" className="block p-2 hover:bg-slate-50 rounded">Parent Portal</Link>
            <Link href="/register" className="block p-2 text-blue-600 font-medium">Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Badge className="mb-4 bg-white/10 text-white border-white/20">🇰🇪 🇰🇪 Trusted by Schools Across Kenya</Badge>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            The #1 School Management<br />Platform in Kenya
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            From student admission to graduation clearance. Track fees, manage discipline, 
            send SMS to parents, and run your entire school from one place.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register"><Button size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-600 text-lg px-8 h-14">Start Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
            <Link href="/login"><Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg px-8 h-14 shadow-lg">School Login</Button></Link>
            <Link href="/parent"><Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-lg px-8 h-14 shadow-lg">Parent Portal</Button></Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Need</h2>
          <p className="text-slate-500 text-center mb-12">One platform for your entire school operation</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Student Management', desc: 'Register students, capture photos, track guardian contacts, and monitor academic progress from Grade 10 to 12.' },
              { icon: DollarSign, title: 'Finance Tracking', desc: 'Set fee structures per grade, record payments, track arrears across terms, and generate reports for clearance.' },
              { icon: Shield, title: 'Clearance System', desc: 'Full clearance workflow across all departments. Black Book integration ensures no student graduates with pending issues.' },
              { icon: BookOpen, title: 'Library & Departments', desc: 'Manage books, equipment, and inventory. Each department gets its own dashboard with issue/return tracking.' },
              { icon: Phone, title: 'SMS & Parent Portal', desc: 'Send bulk SMS to guardians. Parents access fee balances and exam results via phone OTP login.' },
              { icon: GraduationCap, title: 'Auto-Promotion', desc: 'Automatic grade promotion at year-end. Grade 10→11, 11→12. Cleared Grade 12s graduate to Alumni.' },
            ].map((f, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
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

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-slate-500 text-center mb-12">All prices in Kenyan Shillings (KES). Start with a 14-day free trial.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { name: 'Starter', price: '2,900', limit: 'Up to 200 students', features: ['Student Management', 'Library Module', 'Basic Reports', 'Email Support'] },
              { name: 'Standard', price: '7,900', limit: 'Up to 500 students', features: ['Everything in Starter', 'Leave Management', 'Clearance System', 'Black Book', 'SMS Alerts', 'Parent Portal'], popular: true },
              { name: 'Premium', price: '14,900', limit: 'Unlimited students', features: ['Everything in Standard', 'Priority Support', 'Custom Branding', 'API Access', 'Dedicated Account Manager'] },
            ].map((p, i) => (
              <Card key={i} className={`border-0 shadow-sm relative ${p.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</div>}
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <div className="mt-2"><span className="text-4xl font-bold">KES {p.price}</span><span className="text-slate-500">/mo</span></div>
                  <p className="text-sm text-slate-500">{p.limit}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {p.features.map((f, j) => <li key={j} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />{f}</li>)}
                  </ul>
                  <Link href="/register"><Button className="w-full h-12" variant={p.popular ? "default" : "outline"}>Start Free Trial</Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold"><span className="text-blue-400">EDU</span><span className="text-emerald-400"> GATE</span></span>
              </div>
              <p className="text-slate-400 text-sm">The complete school management platform for Kenyan secondary schools.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p><Link href="/login" className="hover:text-white">Staff Login</Link></p>
                <p><Link href="/parent" className="hover:text-white">Parent Portal</Link></p>
                <p><Link href="/register" className="hover:text-white">Register School</Link></p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>📧 support@edugate.co.ke</p>
                <p>📞 +254112410721</p>
                <p>📍 Nairobi, Kenya</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            © 2026 EDU GATE. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
