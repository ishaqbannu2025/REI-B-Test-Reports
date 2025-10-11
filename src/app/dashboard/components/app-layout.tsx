'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  BookCopy,
  PlusCircle,
  BarChart2,
  Users,
  Settings,
  LogOut,
  PanelLeft,
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import type { NavItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';

const navItems: NavItem[] = [
  { href: '/dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/reports/new', title: 'Add Test Report', icon: PlusCircle },
  { href: '/dashboard/reports', title: 'View Reports', icon: BookCopy },
  { href: '/dashboard/analytics', title: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/users', title: 'User Management', icon: Users, adminOnly: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  // Mock role for demo, replace with actual role from user object
  const userRole = user ? 'Admin' : 'Data Entry User';

  const handleLogout = () => {
    getAuth().signOut();
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="relative min-h-screen w-full bg-background text-foreground">
        <Sidebar className="border-r bg-card" collapsible="icon">
          <SidebarHeader className="p-4">
            <Link href="/dashboard" className={cn(
              "flex items-center gap-2 font-semibold text-lg",
              "group-data-[collapsible=icon]:justify-center"
            )}>
              <Logo className="h-8 w-8" />
              <span className="group-data-[collapsible=icon]:hidden">REI-B Reports</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.adminOnly && userRole !== 'Admin') {
                  return null;
                }
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      variant="ghost"
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/settings')} tooltip="Settings"
                variant="ghost">
                  <Link href="/dashboard/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} asChild tooltip="Logout"
                variant="ghost">
                  <Link href="/">
                    <LogOut />
                    <span>Logout</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="group-data-[sidebar-state=expanded]:md:ml-64 md:ml-12 transition-all">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6">
             <SidebarTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <PanelLeft />
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
            </SidebarTrigger>
            <div className="w-full flex-1">
              {/* Optional: Add a search bar or other header content here */}
            </div>
            <div className="flex items-center gap-4 md:ml-auto">
              <UserNav />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}