import { Shell } from '@/components/dashboard/layout/shell';
import { SessionTimer } from "@/components/shared/session-timer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Shell>{children}</Shell>;
      <SessionTimer />
}
