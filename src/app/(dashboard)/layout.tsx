import { Shell } from '@/components/dashboard/layout/shell';
import { SessionTimer } from '@/components/shared/session-timer';
import { BrandingProvider } from '@/lib/branding';
import { InteractiveTour } from '@/components/shared/interactive-tour';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandingProvider>
      <SessionTimer />
      <InteractiveTour />
      <Shell>{children}</Shell>
    </BrandingProvider>
  );
}
