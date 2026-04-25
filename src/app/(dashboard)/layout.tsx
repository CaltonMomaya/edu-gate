import { Shell } from '@/components/dashboard/layout/shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Shell>{children}</Shell>;
}
