import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t">
      <p className="text-sm text-slate-500">Page {page} of {totalPages} · {total} records</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p = i + 1;
          if (totalPages > 5 && page > 3) p = page - 3 + i;
          if (p > totalPages) return null;
          return <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" onClick={() => onPageChange(p)}>{p}</Button>;
        })}
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
