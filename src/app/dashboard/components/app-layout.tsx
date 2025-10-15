
'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookCopy,
  PlusCircle,
  BarChart2,
  Users,
  Settings,
  LogOut,
  Menu,
  LayoutDashboard,
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import type { NavItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname } from 'next/navigation';

const navItems: NavItem[] = [
  { href: '/dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/reports/new', title: 'Add Test Report', icon: PlusCircle },
  { href: '/dashboard/reports', title: 'View Reports', icon: BookCopy },
  { href: '/dashboard/analytics', title: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/users', title: 'User Management', icon: Users, adminOnly: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { user } = useUser();
  // `user` shape may be flexible; avoid strict typing assumptions here.
  const userAny = user as any;
  const isAdmin = (userAny?.role === 'Admin') || userAny?.email === 'm.ishaqbannu@gmail.com';

  const handleLogout = () => {
    getAuth().signOut();
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Navigation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) {
                return null;
              }
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <DropdownMenuItem key={item.title} asChild>
                  <Link href={item.href} className={cn(isActive && 'bg-muted')}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </DropdownMenuItem>
              );
            })}
             <DropdownMenuSeparator />
             <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4"/>
                    <span>Settings</span>
                </Link>
             </DropdownMenuItem>
             <DropdownMenuItem onClick={handleLogout} asChild>
                  <Link href="/">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </Link>
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 font-semibold">
           <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
             <Logo className="h-8 w-8" />
             <span className="">REI-B Reports</span>
           </Link>
        </div>


        <div className="ml-auto flex items-center gap-4">
          <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
