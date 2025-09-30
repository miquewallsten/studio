'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  LayoutDashboard,
  ClipboardList,
  Users,
  CreditCard,
  Settings,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';

const navItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    href: '/dashboard/tickets',
    icon: ClipboardList,
    label: 'Tickets',
  },
  {
    href: '/dashboard/reports',
    icon: FileText,
    label: 'Reports',
  },
  {
    href: '/dashboard/billing',
    icon: CreditCard,
    label: 'Billing',
  },
];

const adminNavItems = [
  {
    href: '/dashboard/admin/users',
    icon: Users,
    label: 'User Management',
  },
  {
    href: '/dashboard/admin/settings',
    icon: Settings,
    label: 'System Settings',
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      <SidebarGroup className="p-0 pt-4">
        <SidebarGroupLabel className="px-2">Admin</SidebarGroupLabel>
        {adminNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarGroup>
    </SidebarMenu>
  );
}
