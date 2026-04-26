'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  User,
  Camera,
  Upload,
  Mail,
  Phone,
  MapPin,
  Home,
  Users,
  AlertCircle,
  Loader2,
  Check,
  X,
  Calendar,
  Hash,
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const studentSchema = z.object({
  admissionNumber: z.string().min(3, 'Admission number required'),
  firstName: z.string().min(2, 'First name required'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name required'),
  dobDay: z.string().min(1, 'Day required').max(2),
  dobMonth: z.string().min(1, 'Month required').max(2),
  dobYear: z.string().min(4, 'Year required').max(4),
  gender: z.enum(['male', 'female'], { required_error: 'Gender required' }),
  grade: z.enum(['10', '11', '12'], { required_error: 'Grade required' }),
  stream: z.string().optional(),
  house: z.string().optional(),
  guardian1Name: z.string().min(2, 'Primary guardian name required'),
  guardian1Relationship: z.enum(['mother', 'father', 'guardian'], { required_error: 'Required' }),
  guardian1Phone: z.string().min(10, 'Valid phone required'),
  guardian1Email: z.string().email('Invalid email').optional().or(z.literal('')),
  guardian2Name: z.string().optional(),
  guardian2Relationship: z.enum(['mother', 'father', 'guardian']).optional(),
  guardian2Phone: z.string().optional(),
  guardian2Email: z.string().email('Invalid email').optional().or(z.literal('')),
  emergencyName: z.string().optional(),
  emergencyRelationship: z.enum(['mother', 'father', 'guardian']).optional(),
  emergencyPhone: z.string().optional(),
  emergencyEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  emergencyContact: z.enum(['guardian1', 'guardian2', 'emergency']).optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

export function StudentForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      toast.error('Cannot access camera. Please upload a photo instead.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      setPhotoPreview(dataUrl);
      canvas.toBlob((blob) => {
        if (blob) {
          setPhotoFile(new File([blob], 'student-photo.png', { type: 'image/png' }));
        }
      });
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    stopCamera();
  };

  const uploadPhoto = async (schoolId: string, studentId: string): Promise<string | null> => {
    if (!photoFile) return null;
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${schoolId}/${studentId}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('student-photos').upload(fileName, photoFile);
    if (error) { console.error('Upload error:', error); return null; }
    const { data } = supabase.storage.from('student-photos').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const onSubmit = async (data: StudentFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('school_id')
        .eq('id', user.id)
        .single();

      if (!userData?.school_id) throw new Error('School not found');

      const schoolId = userData.school_id;
      
      // Build date string from day/month/year inputs
      const dateOfBirth = `${data.dobYear}-${data.dobMonth.padStart(2, '0')}-${data.dobDay.padStart(2, '0')}`;

      // 1. Create student with manual admission number
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          school_id: schoolId,
          admission_number: data.admissionNumber,
          first_name: data.firstName,
          middle_name: data.middleName || null,
          last_name: data.lastName,
          date_of_birth: dateOfBirth,
          gender: data.gender,
          grade: data.grade,
          stream: data.stream || null,
          house: data.house || null,
        })
        .select('id')
        .single();

      if (studentError) {
        if (studentError.code === '23505') {
          throw new Error('This admission number already exists. Please use a different one.');
        }
        throw studentError;
      }

      // 2. Upload photo
      if (photoFile) {
        const photoUrl = await uploadPhoto(schoolId, student.id);
        if (photoUrl) {
          await supabase.from('students').update({ profile_picture_url: photoUrl }).eq('id', student.id);
        }
      }

      // 3. Add guardians
      const guardians = [];
      const isEmergencyGuardian1 = data.emergencyContact === 'guardian1';
      const isEmergencyGuardian2 = data.emergencyContact === 'guardian2';
      const isEmergencyDedicated = data.emergencyContact === 'emergency';

      // Primary guardian (required)
      guardians.push({
        student_id: student.id,
        full_name: data.guardian1Name,
        relationship: data.guardian1Relationship,
        phone_number: data.guardian1Phone,
        email: data.guardian1Email || null,
        is_primary: true,
        is_emergency_contact: isEmergencyGuardian1,
      });

      // Guardian 2 (optional)
      if (data.guardian2Name && data.guardian2Name.trim() !== '') {
        guardians.push({
          student_id: student.id,
          full_name: data.guardian2Name,
          relationship: data.guardian2Relationship || 'guardian',
          phone_number: data.guardian2Phone || '',
          email: data.guardian2Email || null,
          is_primary: false,
          is_emergency_contact: isEmergencyGuardian2,
        });
      }

      // Emergency guardian (optional)
      if (data.emergencyName && data.emergencyName.trim() !== '') {
        guardians.push({
          student_id: student.id,
          full_name: data.emergencyName,
          relationship: data.emergencyRelationship || 'guardian',
          phone_number: data.emergencyPhone || '',
          email: data.emergencyEmail || null,
          is_primary: false,
          is_emergency_contact: isEmergencyDedicated,
        });
      }

      if (guardians.length > 0) {
        const { error: guardianError } = await supabase.from('guardians').insert(guardians);
        if (guardianError) throw guardianError;
      }

      toast.success(`${data.firstName} ${data.lastName} registered! (${data.admissionNumber})`);
      router.push('/students');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to register student');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* ============ PHOTO ============ */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5" /> Passport Photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {photoPreview ? (
              <div className="relative">
                <Avatar className="h-32 w-32 rounded-lg">
                  <AvatarImage src={photoPreview} className="object-cover" />
                  <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                </Avatar>
                <button type="button" onClick={removePhoto} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="h-32 w-32 rounded-lg bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                <User className="h-12 w-12 text-slate-400" />
              </div>
            )}

            {cameraActive ? (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay className="w-64 h-48 rounded-lg bg-black" />
                <div className="flex gap-2">
                  <Button type="button" onClick={capturePhoto} size="sm"><Camera className="mr-1 h-4 w-4" /> Capture</Button>
                  <Button type="button" variant="outline" onClick={stopCamera} size="sm">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={startCamera}><Camera className="mr-1 h-4 w-4" /> Use Camera</Button>
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" asChild><span><Upload className="mr-1 h-4 w-4" /> Upload Photo</span></Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============ STUDENT DETAILS ============ */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-blue-600" /> Student Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Admission Number */}
          <div className="space-y-2">
            <Label><Hash className="h-3 w-3 inline mr-1" /> Admission Number *</Label>
            <Input {...register('admissionNumber')} placeholder="e.g., SRN/2026/001 or 4071" />
            {errors.admissionNumber && <p className="text-xs text-red-500">{errors.admissionNumber.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input {...register('firstName')} placeholder="e.g., Alice" />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Middle Name</Label>
              <Input {...register('middleName')} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input {...register('lastName')} placeholder="e.g., Otieno" />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* DOB - No validation, just accept input */}
          <div className="space-y-2">
            <Label><Calendar className="h-3 w-3 inline mr-1" /> Date of Birth * (DD / MM / YYYY)</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Input {...register('dobDay')} placeholder="DD" maxLength={2} className="text-center" />
                {errors.dobDay && <p className="text-xs text-red-500">{errors.dobDay.message}</p>}
              </div>
              <div>
                <Input {...register('dobMonth')} placeholder="MM" maxLength={2} className="text-center" />
                {errors.dobMonth && <p className="text-xs text-red-500">{errors.dobMonth.message}</p>}
              </div>
              <div>
                <Input {...register('dobYear')} placeholder="YYYY" maxLength={4} className="text-center" />
                {errors.dobYear && <p className="text-xs text-red-500">{errors.dobYear.message}</p>}
              </div>
            </div>
            <p className="text-xs text-slate-400">Example: 15 06 2008 (Day Month Year)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select onValueChange={(v) => setValue('gender', v as 'male' | 'female')}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Grade *</Label>
              <Select onValueChange={(v) => setValue('grade', v as '10' | '11' | '12')}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Grade 10</SelectItem>
                  <SelectItem value="11">Grade 11</SelectItem>
                  <SelectItem value="12">Grade 12</SelectItem>
                </SelectContent>
              </Select>
              {errors.grade && <p className="text-xs text-red-500">{errors.grade.message}</p>}
            </div>
            <div className="space-y-2">
              <Label><MapPin className="h-3 w-3 inline mr-1" /> Stream/Class</Label>
              <Input {...register('stream')} placeholder="e.g., 10 Blue" />
            </div>
          </div>

          <div className="space-y-2">
            <Label><Home className="h-3 w-3 inline mr-1" /> Boarding House</Label>
            <Input {...register('house')} placeholder="e.g., Elgon House" />
          </div>
        </CardContent>
      </Card>

      {/* ============ GUARDIANS ============ */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-emerald-600" /> Guardian Contacts</CardTitle>
          <p className="text-sm text-slate-500">Add up to 3 contacts. Select one as Emergency Contact.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Guardian 1 - Required */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-medium">Primary Guardian *</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Full Name *</Label><Input {...register('guardian1Name')} placeholder="e.g., Jane Doe" />{errors.guardian1Name && <p className="text-xs text-red-500">{errors.guardian1Name.message}</p>}</div>
              <div className="space-y-2"><Label>Relationship *</Label>
                <Select onValueChange={(v) => setValue('guardian1Relationship', v as 'mother'|'father'|'guardian')}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="mother">Mother</SelectItem><SelectItem value="father">Father</SelectItem><SelectItem value="guardian">Guardian</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label><Phone className="h-3 w-3 inline mr-1" /> Phone *</Label><Input {...register('guardian1Phone')} placeholder="0712345678" />{errors.guardian1Phone && <p className="text-xs text-red-500">{errors.guardian1Phone.message}</p>}</div>
              <div className="space-y-2"><Label><Mail className="h-3 w-3 inline mr-1" /> Email</Label><Input {...register('guardian1Email')} placeholder="parent@email.com" type="email" /></div>
            </div>
          </div>

          {/* Guardian 2 - Optional */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-xs font-medium">Second Guardian (Optional)</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Full Name</Label><Input {...register('guardian2Name')} placeholder="e.g., John Doe" /></div>
              <div className="space-y-2"><Label>Relationship</Label>
                <Select onValueChange={(v) => setValue('guardian2Relationship', v as 'mother'|'father'|'guardian')}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="mother">Mother</SelectItem><SelectItem value="father">Father</SelectItem><SelectItem value="guardian">Guardian</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label><Phone className="h-3 w-3 inline mr-1" /> Phone</Label><Input {...register('guardian2Phone')} placeholder="0723456789" /></div>
              <div className="space-y-2"><Label><Mail className="h-3 w-3 inline mr-1" /> Email</Label><Input {...register('guardian2Email')} placeholder="parent2@email.com" type="email" /></div>
            </div>
          </div>

          {/* Emergency Guardian */}
          <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-medium">Emergency Guardian (Optional)</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Full Name</Label><Input {...register('emergencyName')} placeholder="e.g., Uncle Mike" /></div>
              <div className="space-y-2"><Label>Relationship</Label>
                <Select onValueChange={(v) => setValue('emergencyRelationship', v as 'mother'|'father'|'guardian')}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="mother">Mother</SelectItem><SelectItem value="father">Father</SelectItem><SelectItem value="guardian">Guardian</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label><Phone className="h-3 w-3 inline mr-1" /> Phone</Label><Input {...register('emergencyPhone')} placeholder="0734567890" /></div>
              <div className="space-y-2"><Label><Mail className="h-3 w-3 inline mr-1" /> Email</Label><Input {...register('emergencyEmail')} placeholder="emergency@email.com" type="email" /></div>
            </div>
          </div>

          {/* Emergency Contact Selector */}
          <div className="space-y-2">
            <Label><AlertCircle className="h-3 w-3 inline mr-1" /> Which one is the Emergency Contact?</Label>
            <Select onValueChange={(v) => setValue('emergencyContact', v as 'guardian1'|'guardian2'|'emergency')}>
              <SelectTrigger><SelectValue placeholder="Select emergency contact" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="guardian1">Primary Guardian</SelectItem>
                <SelectItem value="guardian2">Second Guardian</SelectItem>
                <SelectItem value="emergency">Emergency Guardian (above)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700" disabled={isLoading}>
        {isLoading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Registering...</>) : (<><Check className="mr-2 h-5 w-5" /> Register Student</>)}
      </Button>
    </form>
  );
}
