'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessageSquare, Send, FileText, Users, Search, Loader2, History, Phone, Plus } from 'lucide-react';
import { sendSms } from '@/lib/sms/send';

interface SmsLog {
  id: string;
  recipient_phone: string;
  message: string;
  message_type: string;
  status: string;
  credits_used: number;
  sent_at: string;
}

export default function SmsPage() {
  const supabase = createClient();
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [smsBalance, setSmsBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [toNumber, setToNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);
    const { data: school } = await supabase.from('schools').select('sms_balance').eq('id', userData.school_id).single();
    if (school) setSmsBalance(school.sms_balance || 0);
    const { data: logs } = await supabase.from('sms_log').select('*').eq('school_id', userData.school_id).order('sent_at', { ascending: false }).limit(100);
    if (logs) setSmsLogs(logs);
  }

  async function sendManualSms(e: React.FormEvent) {
    e.preventDefault();
    if (!toNumber || !smsMessage) { toast.error('Enter phone and message'); return; }
    setIsLoading(true);
    const result = await sendSms(toNumber, smsMessage, schoolId, supabase);
    if (result.success) { toast.success('SMS sent!'); setToNumber(''); setSmsMessage(''); loadData(); }
    else toast.error(result.error || 'Failed');
    setIsLoading(false);
  }

  const filtered = smsLogs.filter(log => log.recipient_phone.includes(search) || log.message.toLowerCase().includes(search.toLowerCase()));
  const totalSent = smsLogs.length;
  const totalCredits = smsLogs.reduce((s, l) => s + l.credits_used, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">SMS Management</h1><p className="text-slate-500">Send messages and view history</p></div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-700 text-lg px-4 py-2"><MessageSquare className="h-4 w-4 mr-2" />{smsBalance} credits</Badge>
          <Link href="/sms/topup"><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Top Up</Button></Link>
          <Link href="/sms/bulk"><Button size="sm" variant="outline"><Users className="h-3 w-3 mr-1" /> Bulk SMS</Button></Link>
          <Link href="/sms/templates"><Button size="sm" variant="outline"><FileText className="mr-1 h-3 w-3" /> Templates</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Send className="h-5 w-5 text-blue-600" /> Send SMS</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={sendManualSms} className="space-y-4">
              <div className="space-y-2"><Label><Phone className="h-3 w-3 inline mr-1" /> Phone *</Label><Input value={toNumber} onChange={(e) => setToNumber(e.target.value)} placeholder="0712345678" /></div>
              <div className="space-y-2"><Label>Message *</Label><Textarea value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} placeholder="Type message..." rows={4} /></div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading || smsBalance <= 0}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Send (1 credit)</>}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> History</CardTitle><div className="flex gap-2 text-sm"><Badge variant="outline">{totalSent} sent</Badge><Badge variant="outline">{totalCredits} credits</Badge></div></div>
            <div className="relative mt-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Phone</TableHead><TableHead>Message</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Sent</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No SMS yet.</TableCell></TableRow> :
                  filtered.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.recipient_phone}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.message}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{log.message_type === 'leave_exit' ? 'Exit' : log.message_type === 'payment_reminder' ? 'Payment' : 'General'}</Badge></TableCell>
                      <TableCell><Badge className={log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{log.status}</Badge></TableCell>
                      <TableCell className="text-slate-500 text-sm">{new Date(log.sent_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
