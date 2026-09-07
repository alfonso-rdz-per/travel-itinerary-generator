"use client";

import type { User } from "@supabase/supabase-js";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/features/auth/actions";

function getDisplayName(user: User | null) {
  const fullName = user?.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim().length > 0) return fullName;
  return user?.email?.split("@")[0] ?? "Agente";
}

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "A";
}

export function NavUser({ user }: { user: User | null }) {
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-gold font-medium text-gold-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col text-left">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {displayName}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">{user?.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/50" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5 px-0.5 py-0.5">
                  <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
              <LogOut /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
