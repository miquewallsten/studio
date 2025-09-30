'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  LayoutDashboard,
  Users,
  Settings,
  Library,
  Building,
  Ticket,
  TestTube,
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
    icon: Ticket,
    label: 'Tickets',
  },
  {
    href: '/dashboard/forms',
    icon: FileText,
    label: 'Forms',
  },
  {
    href: '/dashboard/fields',
    icon: Library,
    label: 'Fields',
  },
];

const adminNavItems = [
  {
    href: '/dashboard/admin/tenants',
    icon: Building,
    label: 'Tenants',
  },
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
  {
    href: '/dashboard/testing/impersonate',
    icon: TestTube,
    label: 'Testing',
  }
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              isActive={pathname.startsWith(item.href)}
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
                isActive={pathname.startsWith(item.href)}
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
