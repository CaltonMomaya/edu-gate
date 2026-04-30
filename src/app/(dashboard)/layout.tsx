import { Shell } from '@/components/dashboard/layout/shell';
import { SessionTimer } from '@/components/shared/session-timer';
import { BrandingProvider } from '@/lib/branding';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandingProvider>
      <SessionTimer />
      <Shell>{children}</Shell>
    </BrandingProvider>
  );
}
