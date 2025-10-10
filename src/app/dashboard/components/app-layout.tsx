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
  SidebarInset,
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

import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import type { NavItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { users } from '@/lib/data';

const navItems: NavItem[] = [
  { href: '/dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/reports/new', title: 'Add Test Report', icon: PlusCircle },
  { href: '/dashboard/reports', title: 'View Reports', icon: BookCopy },
  { href: '/dashboard/analytics', title: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/users', title: 'User Management', icon: Users, adminOnly: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentUser = users[0]; // Assuming admin is logged in for demo

  return (
    <SidebarProvider>
      <div className={cn('min-h-screen w-full bg-muted/40')}>
        <Sidebar className="border-r" collapsible="icon">
          <SidebarHeader className="p-2">
            <Link href="/dashboard" className={cn(
              "flex items-center gap-2 font-semibold text-primary",
              "group-data-[collapsible=icon]:justify-center"
            )}>
              <Logo className="h-7 w-7" />
              <span className="group-data-[collapsible=icon]:hidden">REI-B Reports</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.adminOnly && currentUser.role !== 'Admin') {
                  return null;
                }
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
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
                <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/settings')} tooltip="Settings">
                  <Link href="/dashboard/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Logout">
                  <Link href="/">
                    <LogOut />
                    <span>Logout</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
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
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
