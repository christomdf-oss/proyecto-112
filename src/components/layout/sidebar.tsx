'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  History,
  Wifi,
  FileText,
  PenSquare,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Separator } from '../ui/separator';

const AppSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Panel de Control', icon: LayoutDashboard },
    { href: '/students', label: 'Alumnos', icon: Users },
    { href: '/attendance', label: 'Asistencia', icon: History },
    { href: '/reports', label: 'Reportes', icon: FileText },
    { href: '/manual-entry', label: 'Registro Manual', icon: PenSquare },
    { href: '/whatsapp', label: 'Estado de WhatsApp', icon: Wifi },
  ];

  return (
    <Sidebar
      className="border-r"
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="h-16 flex items-center justify-center">
        <Link href="/" className="flex items-center px-4">
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
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label, side: 'right' }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
