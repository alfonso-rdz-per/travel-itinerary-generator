import { createClient } from "@/services/supabase/server";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/features/dashboard/components/AppSidebar";
import { HeaderBreadcrumb } from "@/components/shared/HeaderBreadcrumb";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-4 lg:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <HeaderBreadcrumb />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
