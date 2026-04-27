'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building2, Mail, MapPin, Hash, Save, Calendar, Clock, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createClient();
  const [school, setSchool] = useState({ name: '', email: '', po_box: '', school_code: '', phone: '' });
  const [schoolId, setSchoolId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [currentTerm, setCurrentTerm] = useState('term1');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadSchool(); }, []);

  async function loadSchool() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data } = await supabase.from('schools').select('*').eq('id', userData.school_id).single();
    if (data) {
      setSchool({
        name: data.name || '', email: data.email || '', po_box: data.po_box || '',
        school_code: data.school_code || '', phone: data.phone || '',
      });
      setCurrentYear(data.current_academic_year || new Date().getFullYear().toString());
      setCurrentTerm(data.current_term || 'term1');
      setAcademicYear(data.current_academic_year || new Date().getFullYear().toString());
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault(); setIsSaving(true);
    const { error } = await supabase.from('schools').update({
      name: school.name, email: school.email, po_box: school.po_box, phone: school.phone,
    }).eq('id', schoolId);
    setIsSaving(false);
    if (error) toast.error('Failed');
    else toast.success('School profile saved!');
  }

  async function saveAcademicSettings() {
    setIsSaving(true);
    const { error } = await supabase.from('schools').update({
      current_academic_year: academicYear,
      current_term: currentTerm,
    }).eq('id', schoolId);
    setIsSaving(false);
    if (error) toast.error('Failed');
    else {
      setCurrentYear(academicYear);
      toast.success(`Academic year set to ${academicYear}, ${currentTerm === 'term1' ? 'Term 1' : currentTerm === 'term2' ? 'Term 2' : 'Term 3'}`);
    }
  }

  const termLabel = (t: string) => t === 'term1' ? 'Term 1' : t === 'term2' ? 'Term 2' : 'Term 3';

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">System Settings</h1><p className="text-slate-500">Configure your school profile and academic settings</p></div>

      {/* School Profile */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-blue-600" />School Profile</CardTitle>
          <CardDescription>This appears on reports, ID cards, and leave sheets</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveSettings} className="space-y-4">
            <div className="space-y-2"><Label>School Name</Label><Input value={school.name} onChange={e => setSchool({...school, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label><Mail className="h-3 w-3 inline mr-1" />Email</Label><Input value={school.email} onChange={e => setSchool({...school, email: e.target.value})} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={school.phone} onChange={e => setSchool({...school, phone: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label><MapPin className="h-3 w-3 inline mr-1" />P.O Box</Label><Input value={school.po_box} onChange={e => setSchool({...school, po_box: e.target.value})} /></div>
              <div className="space-y-2"><Label><Hash className="h-3 w-3 inline mr-1" />School Code</Label><Input value={school.school_code} disabled className="bg-slate-50" /><p className="text-xs text-slate-400">Cannot be changed</p></div>
            </div>
            <Separator />
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Academic Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-emerald-600" />Academic Settings</CardTitle>
          <CardDescription>Set the current academic year and term. This becomes the default across the system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <CheckCircle className="h-4 w-4 inline mr-1 text-blue-600" />
            Currently active: <Badge className="bg-blue-600">{termLabel(currentTerm)}, {currentYear}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input type="number" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2026" />
            </div>
            <div className="space-y-2">
              <Label>Current Term</Label>
              <select value={currentTerm} onChange={e => setCurrentTerm(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-transparent px-3 py-1 text-sm">
                <option value="term1">Term 1</option>
                <option value="term2">Term 2</option>
                <option value="term3">Term 3</option>
              </select>
            </div>
          </div>
          <Button onClick={saveAcademicSettings} disabled={isSaving}>
            {isSaving ? 'Saving...' : <><Clock className="mr-2 h-4 w-4" />Apply Academic Settings</>}
          </Button>
          <p className="text-xs text-slate-400">This sets the default year for fees, payments, exams, and reports across the entire system.</p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-0 shadow-sm border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">Irreversible actions. Please be careful.</p>
          <Button variant="outline" className="text-red-600 border-red-200" onClick={() => toast.error('Feature coming soon')}>
            Reset All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
