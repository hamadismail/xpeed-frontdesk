"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import {
  Hotel,
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  ChevronRight,
  Clock,
  Calendar,
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader } from "../ui/sidebar";

const navLinks = [
  { label: "All Rooms", href: "/", icon: <Hotel className="h-5 w-5" /> },
  {
    label: "Calendar",
    href: "/calendar",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  { label: "Guests", href: "/guests", icon: <Users className="h-5 w-5" /> },
  {
    label: "Payments",
    href: "/payments",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    label: "Reservation",
    href: "/reservation",
    icon: <Clock className="h-5 w-5" />,
  },
];

const secondaryLinks = [
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Hotel className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold">Hotel Manager</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className="text-muted-foreground">{link.icon}</span>
                <span>{link.label}</span>
                {pathname === link.href && (
                  <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                )}
              </Link>
            ))}
          </div>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Management
          </h3>
          <div className="space-y-1">
            {secondaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className="text-muted-foreground">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </SidebarGroup>
      </SidebarContent>

      {/* <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/avatars/admin.png" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">
              admin@hotel.com
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter> */}
    </Sidebar>
  );
}