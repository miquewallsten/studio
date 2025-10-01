
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
import { useAuthRole } from '@/hooks/use-auth-role';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { useLanguage } from '@/contexts/language-context';

export function DashboardNav() {
  const pathname = usePathname();
  const { role } = useAuthRole();
  const { t } = useLanguage();

  const navItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: t('nav.dashboard'),
    },
    {
      href: '/dashboard/tickets',
      icon: Ticket,
      label: t('nav.tickets'),
    },
    {
      href: '/dashboard/forms',
      icon: FileText,
      label: t('nav.forms'),
    },
    {
      href: '/dashboard/fields',
      icon: Library,
      label: t('nav.fields'),
    },
  ];
  
  const adminNavItems = [
    {
      href: '/dashboard/admin/tenants',
      icon: Building,
      label: t('nav.tenants'),
    },
    {
      href: '/dashboard/admin/users',
      icon: Users,
      label: t('nav.user_management'),
      requiredRole: 'Super Admin',
    },
    {
      href: '/dashboard/admin/settings',
      icon: Settings,
      label: t('nav.system_settings'),
    },
    {
      href: '/dashboard/testing/impersonate',
      icon: TestTube,
      label: t('nav.testing'),
    }
  ];

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              tooltip={item.label}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      <SidebarGroup className="p-0 pt-4">
        <SidebarGroupLabel className="px-2">{t('nav.admin')}</SidebarGroupLabel>
        {adminNavItems.map((item) => {
          if (item.requiredRole && item.requiredRole !== role) {
            return null;
          }
          return (
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
          );
        })}
      </SidebarGroup>
    </SidebarMenu>
  );
}
