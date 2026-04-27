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
  MessageSquare, CreditCard, Settings
} from 'lucide-react';

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [openSection, setOpenSection] = useState<string | null>(null);

  const guides = [
    {
      id: 'getting-started',
      icon: HelpCircle,
      title: 'Getting Started',
      content: [
        { q: 'How to register a new school?', a: 'Click "Register School" on the landing page. Fill in school details and admin account. You\'ll get a 14-day free trial.' },
        { q: 'How to add staff members?', a: 'Go to Teachers & Staff → Add Staff Member. Enter their details and TSC number (used as default password). Assign a role.' },
        { q: 'How to set up departments?', a: 'Go to Departments → Add Department. Create departments like Library, Games, Music, etc. Assign officers and set clearance order.' },
      ]
    },
    {
      id: 'students',
      icon: Users,
      title: 'Student Management',
      content: [
        { q: 'How to register a student?', a: 'Go to Students → Add Student. Fill name, admission number, DOB, grade, stream, house. Upload photo and add guardian contacts.' },
        { q: 'How to add guardians?', a: 'During registration, add up to 3 guardians. Mark one as Primary (required) and one as Emergency Contact. Phone numbers are used for SMS alerts.' },
        { q: 'How to promote students?', a: 'On the Overview page, click "Run Auto-Promotion". Grade 10→11, 11→12. Cleared Grade 12s become Alumni.' },
      ]
    },
    {
      id: 'finance',
      icon: DollarSign,
      title: 'Finance & Fees',
      content: [
        { q: 'How to set fee structures?', a: 'Go to Finance → Fee Structure. Add fee items per grade, term, and academic year. The system auto-calculates totals.' },
        { q: 'How to record a payment?', a: 'Go to Finance → Payments. Search student, enter amount, select method (Cash/M-Pesa/Bank), and record. Balance updates automatically.' },
        { q: 'How to check arrears?', a: 'Go to Finance → Reports. Filter by grade, year, or status (Arrears/Overpaid/Cleared). Export to CSV or print per grade.' },
      ]
    },
    {
      id: 'clearance',
      icon: GraduationCap,
      title: 'Clearance Process',
      content: [
        { q: 'How does clearance work?', a: 'Grade 12 and transferred students go through clearance. Each department (Library, Games, Finance, etc.) must clear the student before graduation.' },
        { q: 'What happens if a student has arrears?', a: 'The Finance department will show "Blocked". The student must pay all outstanding fees before the bursar can clear them.' },
        { q: 'How to start clearance?', a: 'Go to Clearance → find the student → click "Start Clearance". All departments are auto-created for that student.' },
      ]
    },
    {
      id: 'leave',
      icon: DoorOpen,
      title: 'Leave Management',
      content: [
        { q: 'How to approve a leave?', a: 'Go to Leave → Apply Leave. Search student, select guardian, set return date/time. SMS is sent to guardian. Print the leave sheet.' },
        { q: 'How to track returns?', a: 'Go to Leave → Approve & Track. Click "Mark Returned" when student returns. System auto-detects late returns.' },
      ]
    },
    {
      id: 'discipline',
      icon: Scale,
      title: 'Discipline & Black Book',
      content: [
        { q: 'How to record an offense?', a: 'Go to Discipline → Black Book. Search student, describe offense, add punishment. Status starts as "Pending".' },
        { q: 'How to mark as served?', a: 'Click "Served" on the offense record. The student can now be cleared during clearance.' },
      ]
    },
  ];

  const filteredGuides = guides.filter(g =>
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    g.content.some(c => c.q.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Help & Guides</h1>
        <p className="text-slate-500 mt-1">Learn how to use EDU GATE effectively</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          placeholder="Search for help topics..."
          className="pl-10 h-12 text-lg"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Video Tutorials', icon: Video, color: 'bg-red-100 text-red-700' },
          { label: 'FAQ', icon: HelpCircle, color: 'bg-blue-100 text-blue-700' },
          { label: 'Contact Support', icon: MessageSquare, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Documentation', icon: BookOpen, color: 'bg-purple-100 text-purple-700' },
        ].map(q => (
          <Card key={q.label} className="border-0 shadow-sm hover:shadow-md cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className={`p-3 rounded-xl w-fit mx-auto mb-2 ${q.color}`}><q.icon className="h-5 w-5" /></div>
              <p className="text-sm font-medium">{q.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guides */}
      <div className="space-y-3">
        {filteredGuides.map(section => (
          <Card key={section.id} className="border-0 shadow-sm">
            <CardHeader
              className="cursor-pointer hover:bg-slate-50 rounded-t-lg"
              onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <section.icon className="h-5 w-5 text-blue-600" />
                  {section.title}
                </CardTitle>
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

      {/* Contact */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <CardContent className="p-6 text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-2" />
          <p className="font-bold text-lg">Need more help?</p>
          <p className="text-white/80 text-sm mb-3">Contact our support team</p>
          <div className="flex gap-4 justify-center">
            <Badge className="bg-white/20 text-white px-4 py-2">📧 support@edugate.co.ke</Badge>
            <Badge className="bg-white/20 text-white px-4 py-2">📞 +254112410721</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
