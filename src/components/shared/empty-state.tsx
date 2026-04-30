import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Package } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        {icon || <Package className="h-16 w-16 text-slate-300 mb-4" />}
        <h3 className="text-lg font-medium text-slate-700 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 max-w-md mb-4">{description}</p>
        {actionLabel && actionHref && (
          <Link href={actionHref}><Button variant="outline">{actionLabel}</Button></Link>
        )}
      </CardContent>
    </Card>
  );
}
