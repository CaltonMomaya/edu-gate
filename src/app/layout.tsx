import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { PwaRegister } from '@/components/shared/pwa-register';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EDU GATE - #1 School Management System in Kenya | Free Trial',
  description: 'The most affordable school management platform in Kenya. Manage students, fees, exams, clearance, discipline, library, SMS alerts & parent portal. Trusted by schools across Kenya. Start free today!',
  keywords: [
    'school management system kenya',
    'school management software kenya',
    'best school management system kenya',
    'zeraki alternative',
    'school management platform kenya',
    'student management system',
    'fee management software',
    'school clearance system',
    'exam management system',
    'school discipline tracker',
    'parent portal kenya',
    'school sms alerts',
    'library management system',
    'boarding school management',
    'secondary school software kenya',
    'KCSE results management',
    'school fees tracking',
    'edtech kenya',
    'school administration software',
    'free school management system',
  ].join(', '),
  authors: [{ name: 'EDU GATE', url: 'https://edugate.co.ke' }],
  creator: 'EDU GATE',
  publisher: 'EDU GATE',
  metadataBase: new URL('https://edugate.co.ke'),
  alternates: { canonical: 'https://edugate.co.ke' },
  openGraph: {
    title: 'EDU GATE - #1 School Management System in Kenya',
    description: 'Affordable, complete school management for Kenyan schools. Student tracking, fees, exams, clearance, SMS, parent portal. Better than Zeraki. Start free!',
    url: 'https://edugate.co.ke',
    siteName: 'EDU GATE',
    locale: 'en_KE',
    type: 'website',
    images: [{ url: 'https://edugate.co.ke/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EDU GATE - Best School Management System Kenya',
    description: 'Affordable school management for Kenyan schools. Student tracking, fees, exams, SMS alerts, parent portal. Free trial!',
    images: ['https://edugate.co.ke/og-image.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  category: 'Education Technology',
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon-192.svg" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "EDU GATE",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web, Android, iOS",
            "description": "Complete school management platform for Kenyan secondary schools. Track students, fees, discipline, clearance, exams, and parent communication.",
            "offers": {
              "@type": "Offer",
              "price": "2900",
              "priceCurrency": "KES",
              "description": "Starts at KES 2,900/month"
            }
          })
        }} />
      </head>
      <body className={geist.className}>
        {children}
        <Toaster position="top-right" richColors />
        <PwaRegister />
      </body>
    </html>
  );
}
