'use client';

import { ReactNode } from 'react';

export function ResponsiveTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-slate-200 sm:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
