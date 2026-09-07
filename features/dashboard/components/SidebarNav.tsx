"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, MapPinned } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const ITEMS = [
  { href: "/dashboard", label: "Itinerarios", icon: MapPinned, match: ["/dashboard", "/itineraries"] },
  { href: "/proposals", label: "Propuestas de Viaje", icon: FileText, match: ["/proposals"] },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {ITEMS.map((item) => {
            const isActive = item.match.some(
              (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
            );
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton isActive={isActive} tooltip={item.label} render={<Link href={item.href} />}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
