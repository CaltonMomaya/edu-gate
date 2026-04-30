'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Rocket, CheckCircle, AlertTriangle, ExternalLink, Copy } from 'lucide-react';

export default function LaunchPage() {
  const [copied, setCopied] = useState('');

  const checklist = [
    { task: 'Domain purchased (edugate.co.ke)', done: false, priority: 'high' },
    { task: 'Vercel deployment configured', done: true, priority: 'high' },
    { task: 'Supabase project active', done: true, priority: 'high' },
    { task: 'Environment variables set on Vercel', done: true, priority: 'high' },
    { task: 'Resend API key configured', done: true, priority: 'medium' },
    { task: 'Africa\'s Talking API key configured', done: true, priority: 'medium' },
    { task: 'Lemon Squeezy store created', done: false, priority: 'medium' },
    { task: 'SSL certificate active', done: true, priority: 'high' },
    { task: 'Database RLS policies verified', done: true, priority: 'high' },
    { task: 'PWA manifest and icons', done: true, priority: 'low' },
    { task: 'Landing page live', done: true, priority: 'high' },
    { task: 'Privacy policy page', done: false, priority: 'low' },
    { task: 'Terms of service page', done: false, priority: 'low' },
    { task: 'Support email configured', done: true, priority: 'medium' },
    { task: 'Backup strategy in place', done: true, priority: 'medium' },
  ];

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    toast.success('URL copied!');
    setTimeout(() => setCopied(''), 2000);
  }

  const doneCount = checklist.filter(c => c.done).length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Launch Preparation</h1>
          <p className="text-slate-500">Final checklist before going live</p>
        </div>
        <Badge className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-lg px-4 py-2">
          <Rocket className="mr-2 h-5 w-5" />{doneCount}/{checklist.length} Ready
        </Badge>
      </div>

      {/* Checklist */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Pre-Launch Checklist</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {checklist.map((item, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${item.done ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                {item.done ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                <span className={item.done ? 'text-slate-700' : 'text-slate-500'}>{item.task}</span>
              </div>
              <Badge className={item.priority === 'high' ? 'bg-red-100 text-red-700' : item.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
                {item.priority}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Important URLs</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Production URL', url: 'https://edu-gate.vercel.app' },
            { label: 'Supabase Dashboard', url: 'https://supabase.com/dashboard' },
            { label: 'Vercel Dashboard', url: 'https://vercel.com' },
            { label: 'Resend Dashboard', url: 'https://resend.com' },
            { label: 'Africa\'s Talking', url: 'https://account.africastalking.com' },
          ].map(link => (
            <div key={link.label} className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm font-medium">{link.label}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => copyUrl(link.url)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <a href={link.url} target="_blank" rel="noopener">
                  <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                </a>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <CardContent className="p-6 text-center">
          <Rocket className="h-10 w-10 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Almost Ready for Launch!</h2>
          <p className="text-white/80 text-sm mb-4">Complete the remaining items above, then share your school registration link.</p>
          <Button variant="outline" className="text-white border-white/30 hover:bg-white/10" onClick={() => copyUrl('https://edu-gate.vercel.app')}>
            <Copy className="mr-2 h-4 w-4" />{copied === 'https://edu-gate.vercel.app' ? 'Copied!' : 'Copy Registration Link'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
