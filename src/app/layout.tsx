import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const geist = Geist({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EDU GATE - School Management System',
  description: 'Multi-tenant school management platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geist.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
