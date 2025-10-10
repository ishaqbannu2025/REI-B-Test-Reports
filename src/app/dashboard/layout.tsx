import React from 'react';
import AppLayout from './components/app-layout';

export const metadata = {
  title: 'Dashboard - REI-B Reports',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
