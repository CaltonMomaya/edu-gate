'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  HelpCircle, BookOpen, Video, Search, ChevronDown, ChevronRight,
  Users, DollarSign, BookMarked, Scale, DoorOpen, GraduationCap,
  MessageSquare, Shield, Printer, Smartphone, FileText
} from 'lucide-react';

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [openSection, setOpenSection] = useState<string | null>('getting-started');

  const guides = [
    {
      id: 'getting-started',
      icon: HelpCircle,
      title: 'Getting Started',
      content: [
        { q: 'How do I register my school?', a: 'Go to the landing page and click "Register School". Fill in your school name, PO Box, email, and school code. Create an admin account to get started with a 14-day free trial.' },
        { q: 'How do I add staff members?', a: 'Navigate to Teachers & Staff → Add Staff Member. Enter their full name, email, and TSC number (used as their default password). Select their role and click Add.' },
        { q: 'How do I set up departments?', a: 'Go to Departments → Add Department. Create all departments needed (Library, Games, Music, Labs, etc.). Arrange them in clearance order using the ▲▼ arrows.' },
      ]
    },
    {
      id: 'students',
      icon: Users,
      title: 'Student Management',
      content: [
        { q: 'How do I register a student?', a: 'Go to Students → Add Student. Fill in admission number, names, date of birth (DD/MM/YYYY), gender, grade, stream, and house. Upload a passport photo and add up to 3 guardian contacts.' },
        { q: 'How do guardians get notified?', a: 'When you approve a leave, the system automatically sends an SMS to the selected guardian\'s phone number. The guardian receives a code to present at the gate.' },
        { q: 'How does auto-promotion work?', a: 'On the Overview page, click "Run Auto-Promotion". Grade 10 students move to Grade 11, Grade 11 to 12, and cleared Grade 12 students become Alumni.' },
      ]
    },
    {
      id: 'finance',
      icon: DollarSign,
      title: 'Finance & Fees',
      content: [
        { q: 'How do I set up fee structures?', a: 'Go to Finance → Fee Structure. Add fee items per grade and term (e.g., Tuition: KES 25,000 for Grade 10, Term 1). The system auto-calculates totals.' },
        { q: 'How do I record payments?', a: 'Go to Finance → Payments. Search for the student, enter the amount, select payment method (Cash/M-Pesa/Bank), and record. The balance updates automatically.' },
        { q: 'How do I check arrears?', a: 'Go to Finance → Reports. Filter by grade, year, or status. Use "All Years" for cumulative balances. Export to CSV or print per grade.' },
        { q: 'Do arrears carry over to next year?', a: 'Yes. When a student is promoted, their unpaid fees from the previous year remain. The "All Years" view shows cumulative totals.' },
      ]
    },
    {
      id: 'clearance',
      icon: GraduationCap,
      title: 'Clearance Process',
      content: [
        { q: 'How does clearance work?', a: 'Grade 12 and transferred students go through clearance. Each department must clear the student. Start from Clearance page → click "Start Clearance".' },
        { q: 'What blocks a student?', a: 'Unpaid fees, unreturned library books, missing equipment, unresolved discipline cases, or any department marking them as "Blocked".' },
        { q: 'What happens after clearance?', a: 'When ALL departments clear the student, they can graduate. Their status becomes "Alumni" and they appear in the Alumni section.' },
      ]
    },
    {
      id: 'security',
      icon: Shield,
      title: 'Security & Access',
      content: [
        { q: 'Can other schools see our data?', a: 'No. Each school\'s data is completely isolated using database-level Row Level Security (RLS). Staff can only see their own school\'s data.' },
        { q: 'What can different roles access?', a: 'Admin sees everything. Bursar sees Finance only. Librarian sees Library only. Custom department staff see their assigned departments.' },
        { q: 'How do I deactivate a staff member?', a: 'Go to Teachers & Staff → click the ban icon on the staff member. They can no longer log in. Click the check icon to reactivate.' },
      ]
    },
  ];

  const filtered = guides.filter(g =>
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    g.content.some(c => c.q.toLowerCase().includes(search.toLowerCase()) || c.a.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Help & Documentation</h1><p className="text-slate-500">Learn how to use EDU GATE effectively</p></div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input placeholder="Search help topics..." className="pl-10 h-12 text-lg" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Video Tutorials', icon: Video, color: 'bg-red-100 text-red-700' },
          { label: 'User Manual (PDF)', icon: FileText, color: 'bg-blue-100 text-blue-700' },
          { label: 'Contact Support', icon: MessageSquare, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Mobile App Guide', icon: Smartphone, color: 'bg-purple-100 text-purple-700' },
        ].map(q => (
          <Card key={q.label} className="border-0 shadow-sm hover:shadow-md cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className={`p-3 rounded-xl w-fit mx-auto mb-2 ${q.color}`}><q.icon className="h-5 w-5" /></div>
              <p className="text-sm font-medium">{q.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(section => (
          <Card key={section.id} className="border-0 shadow-sm">
            <CardHeader className="cursor-pointer hover:bg-slate-50 rounded-t-lg" onClick={() => setOpenSection(openSection === section.id ? null : section.id)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><section.icon className="h-5 w-5 text-blue-600" />{section.title}</CardTitle>
                {openSection === section.id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
            </CardHeader>
            {openSection === section.id && (
              <CardContent className="space-y-3">
                <Separator className="mb-3" />
                {section.content.map((item, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-medium text-sm text-blue-700 mb-1">❓ {item.q}</p>
                    <p className="text-sm text-slate-600">{item.a}</p>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <CardContent className="p-6 text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-2" />
          <p className="font-bold text-lg">Need more help?</p>
          <p className="text-white/80 text-sm mb-3">Contact our support team</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Badge className="bg-white/20 text-white px-4 py-2">📧 support@edugate.co.ke</Badge>
            <Badge className="bg-white/20 text-white px-4 py-2">📞 +254112410721</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
