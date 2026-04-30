"use client";
import { useRefreshBranding } from "@/lib/branding";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Palette, Upload, Loader2, Eye, CheckCircle } from 'lucide-react';

export default function BrandingPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const refreshBranding = useRefreshBranding();
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#10b981');

  const colorPresets = [
    { name: 'Blue & Emerald', primary: '#3b82f6', secondary: '#10b981' },
    { name: 'Purple & Pink', primary: '#8b5cf6', secondary: '#ec4899' },
    { name: 'Orange & Red', primary: '#f97316', secondary: '#ef4444' },
    { name: 'Teal & Cyan', primary: '#14b8a6', secondary: '#06b6d4' },
    { name: 'Indigo & Blue', primary: '#6366f1', secondary: '#3b82f6' },
    { name: 'Rose & Amber', primary: '#f43f5e', secondary: '#f59e0b' },
  ];

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);
    const { data: school } = await supabase.from('schools').select('*').eq('id', userData.school_id).single();
    if (school) {
      setSchoolName(school.name);
      setLogoUrl(school.logo_url || '');
      setLogoPreview(school.logo_url || '');
      setPrimaryColor(school.primary_color || '#3b82f6');
      setSecondaryColor(school.secondary_color || '#10b981');
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return logoUrl;
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `logos/${schoolId}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('school-logos').upload(fileName, logoFile);
    if (error) { toast.error('Logo upload failed'); return null; }
    const { data } = supabase.storage.from('school-logos').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function saveBranding() {
    setIsLoading(true);
    let newLogoUrl = logoUrl;
    if (logoFile) {
      const uploaded = await uploadLogo();
      if (uploaded) newLogoUrl = uploaded;
    }
    const { error } = await supabase.from('schools').update({
      logo_url: newLogoUrl, primary_color: primaryColor, secondary_color: secondaryColor,
    }).eq('id', schoolId);
    setIsLoading(false);
    if (error) toast.error('Failed to save');
    else {
      toast.success('Branding updated!');
    refreshBranding();
      setLogoUrl(newLogoUrl);
      setLogoPreview(newLogoUrl);
    }
  }

  async function resetToDefault() {
    if (!confirm('Reset branding to EDU GATE default?')) return;
    setIsLoading(true);
    await supabase.from('schools').update({
      logo_url: null, primary_color: '#3b82f6', secondary_color: '#10b981',
    }).eq('id', schoolId);
    setLogoUrl(''); setLogoPreview(''); setPrimaryColor('#3b82f6'); setSecondaryColor('#10b981'); setLogoFile(null);
    setIsLoading(false);
    toast.success('Branding reset to default!');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">School Branding</h1><p className="text-slate-500">Customize your school's appearance</p></div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle><Upload className="h-5 w-5 inline mr-2 text-blue-600" />School Logo</CardTitle><CardDescription>Upload your school crest or logo</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 rounded-xl border-2">
              <AvatarImage src={logoPreview || ''} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-emerald-500 text-white">{schoolName?.[0] || 'S'}</AvatarFallback>
            </Avatar>
            <label className="cursor-pointer"><Button variant="outline" size="sm" asChild><span><Upload className="mr-1 h-4 w-4" />Upload Logo</span></Button><input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle><Palette className="h-5 w-5 inline mr-2 text-purple-600" />Color Theme</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {colorPresets.map((preset, i) => (
              <button key={i} className={`p-3 rounded-lg border-2 text-center ${primaryColor === preset.primary ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}
                onClick={() => { setPrimaryColor(preset.primary); setSecondaryColor(preset.secondary); }}>
                <div className="flex gap-1 justify-center mb-1"><div className="w-4 h-4 rounded-full" style={{ background: preset.primary }} /><div className="w-4 h-4 rounded-full" style={{ background: preset.secondary }} /></div>
                <p className="text-xs font-medium">{preset.name}</p>
              </button>
            ))}
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Primary</Label><div className="flex gap-2"><Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1" /><Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} /></div></div>
            <div className="space-y-2"><Label>Secondary</Label><div className="flex gap-2"><Input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-12 h-10 p-1" /><Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} /></div></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle><Eye className="h-5 w-5 inline mr-2 text-amber-600" />Preview</CardTitle></CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border" style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}>
            <div className="flex items-center gap-3 text-white">
              <Avatar className="h-10 w-10 rounded-lg bg-white/20"><AvatarImage src={logoPreview || ''} /><AvatarFallback className="text-white">{schoolName?.[0] || 'S'}</AvatarFallback></Avatar>
              <div><p className="font-bold">{schoolName}</p><p className="text-xs text-white/80">Header Preview</p></div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Badge style={{ backgroundColor: primaryColor }} className="text-white">Primary</Badge>
            <Badge style={{ backgroundColor: secondaryColor }} className="text-white">Secondary</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={saveBranding} className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}Save Branding
        </Button>
        <Button variant="outline" onClick={resetToDefault} disabled={isLoading}>↩ Reset Default</Button>
      </div>
    </div>
  );
}
