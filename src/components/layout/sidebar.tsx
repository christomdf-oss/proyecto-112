'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  History,
  Settings,
  FileText,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import Logo from '@/components/logo';

const AppSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Panel de Control', icon: LayoutDashboard },
    { href: '/students', label: 'Alumnos', icon: Users },
    { href: '/attendance', label: 'Asistencia', icon: History },
    { href: '/reports', label: 'Reportes', icon: FileText },
  ];

  return (
    <Sidebar
      className="border-r"
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="h-16 flex items-center justify-center">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              COBACAM
            </span>
              <span className="text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
              Plantel 10 Chicbul
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label, side: 'right' }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <Separator />
      <SidebarFooter className='h-16'>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: 'Configuración', side: 'right' }}>
                    <Settings />
                    <span>Configuración</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
