'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, User, BookOpen, DollarSign, AlertCircle } from 'lucide-react';

interface SearchResult {
  type: 'student' | 'payment' | 'offense' | 'book';
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
  photo?: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(() => searchAll(), 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function searchAll() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }
    const sid = userData.school_id;

    const all: SearchResult[] = [];

    // Search students
    const { data: students } = await supabase.from('students').select('*').eq('school_id', sid).or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,admission_number.ilike.%${query}%`).limit(5);
    if (students) {
      students.forEach((s: any) => all.push({
        type: 'student', title: `${s.first_name} ${s.last_name}`,
        subtitle: `${s.admission_number} · Grade ${s.grade}`,
        badge: s.status, href: `/students/${s.id}`, photo: s.profile_picture_url,
      }));
    }

    // Search books
    const { data: books } = await supabase.from('library_books').select('*').eq('school_id', sid).or(`title.ilike.%${query}%,ref_no.ilike.%${query}%`).limit(3);
    if (books) {
      books.forEach((b: any) => all.push({
        type: 'book', title: b.title, subtitle: `${b.ref_no} · ${b.available}/${b.quantity} available`,
        href: '/library',
      }));
    }

    // Search offenses
    const { data: offenses } = await supabase.from('black_book').select('offense, students(first_name, last_name, id)').eq('school_id', sid).ilike('offense', `%${query}%`).limit(3);
    if (offenses) {
      offenses.forEach((o: any) => all.push({
        type: 'offense', title: o.offense?.substring(0, 50),
        subtitle: `${o.students?.first_name} ${o.students?.last_name}`,
        href: '/discipline/black-book',
      }));
    }

    setResults(all);
    setIsLoading(false);
  }

  function getIcon(type: string) {
    switch (type) {
      case 'student': return <User className="h-4 w-4 text-blue-600" />;
      case 'book': return <BookOpen className="h-4 w-4 text-emerald-600" />;
      case 'offense': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Search className="h-4 w-4" />;
    }
  }

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search students, books, offenses..."
          className="pl-10 bg-slate-100 border-0 focus:bg-white"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b last:border-b-0"
              onClick={() => { router.push(r.href); setShowResults(false); setQuery(''); }}
            >
              {r.photo ? (
                <Avatar className="h-8 w-8"><AvatarImage src={r.photo} /><AvatarFallback>{r.title[0]}</AvatarFallback></Avatar>
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">{getIcon(r.type)}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.title}</p>
                <p className="text-xs text-slate-500 truncate">{r.subtitle}</p>
              </div>
              {r.badge && <Badge variant="outline" className="text-xs">{r.badge}</Badge>}
              <span className="text-xs text-slate-400 capitalize">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
