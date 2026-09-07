import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { NavUser } from "./NavUser";
import { SidebarNav } from "./SidebarNav";
import logo from "@/public/branding/logo-blanco.png";

export function AppSidebar({ user }: { user: User | null }) {
  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center px-1">
          <Image src={logo} alt="Wander Travel" sizes="220px" className="h-16 w-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarNav />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
