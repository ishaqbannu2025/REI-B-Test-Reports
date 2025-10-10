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
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import type { NavItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';


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
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen w-full bg-background">
        <Sidebar className="border-r bg-sidebar text-sidebar-foreground" collapsible="icon">
          <SidebarHeader className="p-2">
            <Link href="/dashboard" className={cn(
              "flex items-center gap-2 font-semibold text-sidebar-primary-foreground",
              "group-data-[collapsible=icon]:justify-center"
            )}>
              <Logo className="h-7 w-7" />
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
                      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
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
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground">
                  <Link href="/dashboard/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} asChild tooltip="Logout"
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <Link href="/">
                    <LogOut />
                    <span>Logout</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="md:ml-12 group-data-[sidebar-state=expanded]:md:ml-64 transition-all">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden md:block">
              <h1 className="font-semibold text-lg">Regional Electric Inspectorate, Bannu</h1>
              <p className="text-xs text-muted-foreground">
                Energy & Power Department, Government of Khyber Pakhtunkhwa
              </p>
            </div>
            <div className="flex w-full items-center gap-4 md:ml-auto md:flex-initial">
              <div className="ml-auto flex-1 sm:flex-initial">
                <UserNav />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
