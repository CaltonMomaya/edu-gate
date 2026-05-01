'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';

export default function EventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);
    const { data } = await supabase.from('events').select('*').eq('school_id', userData.school_id).order('created_at', { ascending: false });
    if (data) setEvents(data);
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) { toast.error("Loading... Please wait"); return; }
    if (!name || !eventDate) { toast.error('Name and date required'); return; }
    setIsLoading(true);
    const { error } = await supabase.from('events').insert({
      school_id: schoolId,
      name,
      event_date: eventDate,
      event_time: eventTime || null,
      venue: venue || null,
      description: description || null,
    });
    if (error) {
      toast.error('Failed to create event: ' + error.message);
    } else {
      toast.success('Event created!');
      setName(''); setEventDate(''); setEventTime(''); setVenue(''); setDescription('');
      loadEvents();
    }
    setIsLoading(false);
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); loadEvents(); }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Events</h1><p className="text-slate-500">Create school events for SMS invitations</p></div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle><Plus className="h-5 w-5 inline mr-2" />Create Event</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addEvent} className="space-y-3">
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Event name *" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label><Calendar className="h-3 w-3 inline mr-1" />Date *</Label><Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} /></div>
              <div className="space-y-1"><Label><Clock className="h-3 w-3 inline mr-1" />Time</Label><Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label><MapPin className="h-3 w-3 inline mr-1" />Venue</Label><Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="School hall, Classroom, etc." /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Event'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No events yet.</p>
          ) : (
            events.map(e => (
              <div key={e.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-sm text-slate-500">
                    <Calendar className="h-3 w-3 inline mr-1" />{e.event_date}
                    {e.event_time && <><Clock className="h-3 w-3 inline ml-2 mr-1" />{e.event_time}</>}
                    {e.venue && <><MapPin className="h-3 w-3 inline ml-2 mr-1" />{e.venue}</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{new Date(e.event_date) > new Date() ? 'Upcoming' : 'Past'}</Badge>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteEvent(e.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
