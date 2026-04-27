'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { BookOpen, BookPlus, BookCheck, Search, Loader2, AlertCircle, Trash2, DollarSign } from 'lucide-react';

interface Book {
  id: string; ref_no: string; title: string; author: string; isbn: string;
  category: string; quantity: number; available: number; book_value: number;
}
interface IssuedBook {
  id: string; book_id: string; student_id: string; issued_date: string; due_date: string;
  return_date: string; status: string; fine_amount: number;
  library_books: { title: string; ref_no: string; book_value: number };
  students: { first_name: string; last_name: string; admission_number: string; grade: string; profile_picture_url: string };
}

export default function LibraryPage() {
  const supabase = createClient();
  const [books, setBooks] = useState<Book[]>([]);
  const [issued, setIssued] = useState<IssuedBook[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<'inventory' | 'issued' | 'history'>('inventory');
  const [searchBook, setSearchBook] = useState('');

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState('General');
  const [quantity, setQuantity] = useState('1');
  const [bookValue, setBookValue] = useState('');

  const [bookSearch, setBookSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [dueDate, setDueDate] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [showBookResults, setShowBookResults] = useState(false);
  const [showStudentResults, setShowStudentResults] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);
    const { data: b } = await supabase.from('library_books').select('*').eq('school_id', userData.school_id).order('title');
    if (b) setBooks(b);
    const { data: i } = await supabase.from('library_issued').select('*, library_books(title, ref_no, book_value), students(first_name, last_name, admission_number, grade, profile_picture_url)').eq('school_id', userData.school_id).order('issued_date', { ascending: false }).limit(100);
    if (i) setIssued(i);
  }

  async function addBook(e: React.FormEvent) {
    e.preventDefault(); if (!title) return;
    const qty = parseInt(quantity) || 1;
    const val = bookValue ? parseFloat(bookValue) : 0;
    const refNo = 'BK-' + new Date().getFullYear() + '-' + String(books.length + 1).padStart(4, '0');
    await supabase.from('library_books').insert({ school_id: schoolId, ref_no: refNo, title, author, isbn, category, quantity: qty, available: qty, book_value: val });
    toast.success(`${title} added`); setTitle(''); setAuthor(''); setIsbn(''); setQuantity('1'); setBookValue(''); loadData();
  }

  async function deleteBook(id: string) { await supabase.from('library_books').delete().eq('id', id); toast.success('Deleted'); loadData(); }

  async function searchStudents(query: string) {
    setStudentSearch(query);
    setSelectedStudent(null);
    if (query.length < 2) { setStudents([]); return; }
    const { data } = await supabase.from('students').select('id, first_name, last_name, admission_number, grade, profile_picture_url').eq('school_id', schoolId).eq('status', 'active').or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,admission_number.ilike.%${query}%`).limit(10);
    if (data) setStudents(data);
  }

  function selectStudent(student: any) {
    setSelectedStudent(student);
    setStudentSearch(`${student.first_name} ${student.last_name} (${student.admission_number})`);
    setShowStudentResults(false);
  }

  function selectBookForIssue(book: Book) {
    setSelectedBook(book.id);
    setBookSearch(`${book.ref_no} - ${book.title}`);
    setShowBookResults(false);
  }

  async function issueBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook) { toast.error('Search and select a book'); return; }
    if (!selectedStudent) { toast.error('Search and select a student'); return; }
    if (!dueDate) { toast.error('Set a due date'); return; }
    
    const book = books.find(b => b.id === selectedBook);
    if (!book || book.available <= 0) { toast.error('Book not available'); return; }

    setIsLoading(true);
    const { error } = await supabase.from('library_issued').insert({
      school_id: schoolId, book_id: selectedBook, student_id: selectedStudent.id, due_date: dueDate,
    });
    if (!error) {
      await supabase.from('library_books').update({ available: book.available - 1 }).eq('id', selectedBook);
      toast.success(`Issued to ${selectedStudent.first_name}!`);
      setSelectedBook(''); setSelectedStudent(null); setStudentSearch(''); setBookSearch(''); setDueDate('');
      loadData();
    } else toast.error('Failed');
    setIsLoading(false);
  }

  async function returnBook(issueId: string, bookId: string) {
    const fine = prompt('Fine amount (KES, 0 if none):', '0');
    const fineVal = fine ? parseFloat(fine) : 0;
    await supabase.from('library_issued').update({ status: 'returned', return_date: new Date().toISOString().split('T')[0], fine_amount: fineVal }).eq('id', issueId);
    const book = books.find(b => b.id === bookId);
    if (book) await supabase.from('library_books').update({ available: book.available + 1 }).eq('id', bookId);
    toast.success(fineVal > 0 ? `Returned with KES ${fineVal} fine` : 'Returned');
    loadData();
  }

  async function markLost(issueId: string, bookId: string) {
    const book = books.find(b => b.id === bookId);
    const autoFine = book?.book_value || 500;
    if (!confirm(`Mark as lost? KES ${autoFine.toLocaleString()} fine will be recorded.`)) return;
    await supabase.from('library_issued').update({ status: 'lost', fine_amount: autoFine }).eq('id', issueId);
    toast.error(`Lost - KES ${autoFine} fine`);
    loadData();
  }

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(searchBook.toLowerCase()) || (b.ref_no && b.ref_no.includes(searchBook)));
  const filteredForIssue = books.filter(b => !bookSearch || b.title.toLowerCase().includes(bookSearch.toLowerCase()) || (b.ref_no && b.ref_no.includes(bookSearch)));
  const activeIssues = issued.filter(i => i.status === 'issued');
  const overdueBooks = issued.filter(i => i.status === 'issued' && new Date(i.due_date) < new Date());
  const totalBookValue = books.reduce((s, b) => s + (b.book_value || 0) * b.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Library</h1><p className="text-slate-500">{books.length} titles · KES {totalBookValue.toLocaleString()} value · {activeIssues.length} issued · {overdueBooks.length} overdue</p></div>
        <div className="flex gap-2">
          <Button variant={tab === 'inventory' ? 'default' : 'outline'} onClick={() => setTab('inventory')}><BookOpen className="mr-2 h-4 w-4" /> Books</Button>
          <Button variant={tab === 'issued' ? 'default' : 'outline'} onClick={() => setTab('issued')}><BookCheck className="mr-2 h-4 w-4" /> Issued ({activeIssues.length})</Button>
          <Button variant={tab === 'history' ? 'default' : 'outline'} onClick={() => setTab('history')}>📋 History</Button>
        </div>
      </div>

      {tab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle><BookPlus className="h-5 w-5 inline mr-2" />Add Book</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={addBook} className="space-y-3">
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *" />
                <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author" />
                <Input value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="ISBN" />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Textbook">Textbook</SelectItem><SelectItem value="Reference">Reference</SelectItem><SelectItem value="Set Books">Set Books</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select>
                  <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" placeholder="Qty" />
                </div>
                <div className="space-y-1"><Label><DollarSign className="h-3 w-3 inline mr-1" />Book Value (KES)</Label><Input type="number" value={bookValue} onChange={e => setBookValue(e.target.value)} placeholder="e.g., 500" /><p className="text-xs text-slate-400">Auto-charged if lost</p></div>
                <Button type="submit" className="w-full">Add Book</Button>
              </form>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><div className="flex justify-between"><CardTitle>Inventory</CardTitle><Badge className="bg-blue-100 text-blue-700">Value: KES {totalBookValue.toLocaleString()}</Badge></div><div className="relative mt-2"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input placeholder="Search..." className="pl-10" value={searchBook} onChange={e => setSearchBook(e.target.value)} /></div></CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Ref</TableHead><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>Value</TableHead><TableHead>Stock</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>{filteredBooks.map(b => (
                  <TableRow key={b.id}><TableCell><Badge variant="outline" className="font-mono text-xs">{b.ref_no}</Badge></TableCell><TableCell className="font-medium">{b.title}</TableCell><TableCell className="text-slate-500 text-sm">{b.author || '-'}</TableCell><TableCell className="text-sm">{b.book_value > 0 ? `KES ${b.book_value.toLocaleString()}` : '-'}</TableCell><TableCell><Badge className={b.available > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{b.available}/{b.quantity}</Badge></TableCell><TableCell><Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteBook(b.id)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>
                ))}</TableBody></Table>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'issued' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle><BookCheck className="h-5 w-5 inline mr-2" />Issue Book</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={issueBook} className="space-y-3">
                {/* Search Book */}
                <div className="relative">
                  <Label>Book *</Label>
                  <Input placeholder="Search book by title or ref..." value={bookSearch} onChange={e => { setBookSearch(e.target.value); setShowBookResults(true); }} onFocus={() => setShowBookResults(true)} />
                  {showBookResults && bookSearch && (
                    <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-36 overflow-y-auto">
                      {filteredForIssue.filter(b => b.available > 0).length === 0 ? <p className="p-3 text-sm text-slate-500">No books found</p> :
                        filteredForIssue.filter(b => b.available > 0).map(b => (
                          <button key={b.id} type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b" onClick={() => selectBookForIssue(b)}>
                            <span className="font-medium">{b.ref_no}</span> - {b.title} <Badge className="ml-2 text-xs">{b.available} left</Badge>
                          </button>
                        ))
                      }
                    </div>
                  )}
                  {selectedBook && <p className="text-xs text-emerald-600 mt-1">✅ Selected</p>}
                </div>

                {/* Search Student */}
                <div className="relative">
                  <Label>Student *</Label>
                  <Input placeholder="Search student by name or admission..." value={studentSearch} onChange={e => { searchStudents(e.target.value); setShowStudentResults(true); }} onFocus={() => { if (students.length > 0) setShowStudentResults(true); }} />
                  {showStudentResults && students.length > 0 && !selectedStudent && (
                    <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {students.map(s => (
                        <button key={s.id} type="button" className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b flex items-center gap-2" onClick={() => selectStudent(s)}>
                          <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{s.first_name?.[0]}{s.last_name?.[0]}</AvatarFallback></Avatar>
                          <div><span className="font-medium">{s.first_name} {s.last_name}</span><span className="text-xs text-slate-400 ml-2">{s.admission_number} · G{s.grade}</span></div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedStudent && (
                    <div className="flex items-center justify-between bg-emerald-50 p-2 rounded-lg mt-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}</AvatarFallback></Avatar>
                        <span className="text-sm font-medium">{selectedStudent.first_name} {selectedStudent.last_name}</span>
                        <span className="text-xs text-slate-500">{selectedStudent.admission_number}</span>
                      </div>
                      <button type="button" onClick={() => { setSelectedStudent(null); setStudentSearch(''); }} className="text-red-500 text-xs">✕</button>
                    </div>
                  )}
                </div>

                <div className="space-y-1"><Label>Due Date *</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={isLoading || !selectedBook || !selectedStudent}>Issue Book</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Active Issues ({activeIssues.length})</CardTitle></CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Book</TableHead><TableHead>Student</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>{activeIssues.map(i => (
                  <TableRow key={i.id} className={new Date(i.due_date) < new Date() ? 'bg-red-50' : ''}>
                    <TableCell><p className="font-medium text-sm">{i.library_books?.title}</p><p className="text-xs text-slate-400">{i.library_books?.ref_no} · KES {i.library_books?.book_value?.toLocaleString() || 'N/A'}</p></TableCell>
                    <TableCell><p className="text-sm">{i.students?.first_name} {i.students?.last_name}</p><p className="text-xs text-slate-400">G{i.students?.grade}</p></TableCell>
                    <TableCell className="text-xs">{i.due_date}</TableCell>
                    <TableCell>{new Date(i.due_date) < new Date() ? <Badge className="bg-red-100 text-red-700"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge> : <Badge className="bg-blue-100">Issued</Badge>}</TableCell>
                    <TableCell><div className="flex gap-1"><Button size="sm" variant="outline" className="text-emerald-600 text-xs" onClick={() => returnBook(i.id, i.book_id)}>Return</Button><Button size="sm" variant="outline" className="text-red-600 text-xs" onClick={() => markLost(i.id, i.book_id)}>Lost</Button></div></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'history' && (
        <Card><CardHeader><CardTitle>History</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Book</TableHead><TableHead>Student</TableHead><TableHead>Issued</TableHead><TableHead>Returned</TableHead><TableHead>Status</TableHead><TableHead>Fine</TableHead></TableRow></TableHeader>
            <TableBody>{issued.map(i => (
              <TableRow key={i.id}><TableCell><span className="text-sm">{i.library_books?.title}</span><br /><span className="text-xs text-slate-400">{i.library_books?.ref_no}</span></TableCell><TableCell>{i.students?.first_name} {i.students?.last_name}</TableCell><TableCell className="text-xs">{i.issued_date}</TableCell><TableCell className="text-xs">{i.return_date || '-'}</TableCell><TableCell><Badge className={i.status === "returned" ? "bg-emerald-100 text-emerald-700 font-medium" : i.status === "lost" ? "bg-red-100 text-red-700 font-medium" : "bg-amber-100 text-amber-700 font-medium"}>{i.status === "returned" ? "✅ Returned" : i.status === "lost" ? "❌ Lost" : "📤 Issued"}</Badge></TableCell><TableCell>{i.fine_amount > 0 ? <span className="text-red-600 font-medium">KES {i.fine_amount}</span> : '-'}</TableCell></TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
      )}
    </div>
  );
}
