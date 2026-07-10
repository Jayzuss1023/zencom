"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import {
  Inbox,
  Users,
  BookOpen,
  Palette,
  UsersRound,
  CreditCard,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BrandMark } from "../hero-section/brand-mark";
import { api } from "@/convex/_generated/api";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { title: "Inbox", href: "/dashboard", icon: Inbox, exact: true },
  { title: "Leads", href: "/dashboard/leads", icon: Users },
  { title: "Knowledge", href: "/dashboard/knowledge", icon: BookOpen },
  { title: "Customizer", href: "/dashboard/customizer", icon: Palette },
  { title: "Team", href: "/dashboard/team", icon: CreditCard },
];

const SECONDARY_NAV: NavItem[] = [
  { title: "Setup", href: "/dashboard/setup", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-0 border-b border-sidebar-border p-0">
        <div className="flex h-14 items-center px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link
            href="/dashboard"
            aria-label="MyChat dashboard"
            className="flex items-center rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <BrandMark
              showWord
              className="gap-2.5 group-data-[collapsible=icon]:gap-0"
              wordClassName="group-data-[collapsible=icon]:hidden"
            />
          </Link>
        </div>
        <div className="flex items-center px-2 pb-2 group-data-[collapsible=icon]:hidden">
          <OrganizationSwitcher
            hidePersonal
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
            afterLeaveOrganizationUrl="/onboarding"
            appearance={{
              elements: {
                rootBox: "w-full",
                organizationSwitcherTrigger:
                  "w-full justify-start rounded-lg border border-sidebar-border bg-sidebar px-2.5 py-2 hover:bg-sidebar-accent",
              },
            }}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-1 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wide text-sidebar-foreground/60"></SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-9 gap-2.5 rounded-lg font-medium text-sidebar-foreground/80 transition-colors data-[active=true]:bg-brand/10 data-[active=true]:text-brand data-[active=true]:[&>svg]:text-brand"
                    >
                      <Link href={item.href} className="flex gap-2">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wide text-sidebar-foreground/60">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {SECONDARY_NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="h-9 gap-2.5 rounded-lg font-medium text-sidebar-foreground/80 transition-colors data-[active=true]:bg-brand/10 data-[active=true]:text-brand data-[active=true]:[&>svg]:text-brand"
                  >
                    <Link href={item.href} className="flex gap-2">
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2.5 p-1.5 group-data[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <UserButton appearance={{ elements: { rootBox: "shrink-0" } }} />
          <span className="truncate text-sm font-medium text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
            Account
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
