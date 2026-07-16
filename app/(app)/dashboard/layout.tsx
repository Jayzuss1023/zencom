import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { OrgGuard } from "@/components/dashboard/OrgGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 backdrop-blur-md lg:px-6">
          <SidebarTrigger className="-ml-1.5 text-muted-foreground" />
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-5"
          />
          <span className="text-sm font-seimbold tracking-tight">
            Dashboard
          </span>
        </header>
        <OrgGuard>{children}</OrgGuard>
      </SidebarInset>
    </SidebarProvider>
  );
}
