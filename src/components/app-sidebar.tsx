
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { useProfile } from '@/context/profile-context';
import {
  Ticket,
  History,
  Gamepad2,
  LifeBuoy,
  Settings,
  Users2,
  LayoutDashboard,
  Search,
  User,
  Megaphone,
  Bot,
} from 'lucide-react';
import { Skeleton } from './ui/skeleton';

const superAdminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/user-lookup', label: 'User Lookup', icon: Search },
  { href: '/admin/assistant', label: 'AI Assistant', icon: Bot },
  { href: '/admin/licenses', label: 'Licenses', icon: Ticket },
  { href: '/admin/predictions', label: 'Prediction Logs', icon: History },
  { href: '/admin/games', label: 'Games Control', icon: Gamepad2 },
  { href: '/admin/broadcasts', label: 'Broadcasts', icon: Megaphone },
  { href: '/admin/support', label: 'Support Center', icon: LifeBuoy },
  { href: '/admin/settings', label: 'System Settings', icon: Settings },
  { href: '/admin/staff', label: 'Staff Management', icon: Users2 },
];

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/user-lookup', label: 'User Lookup', icon: Search },
  { href: '/admin/assistant', label: 'AI Assistant', icon: Bot },
  { href: '/admin/licenses', label: 'Licenses', icon: Ticket },
  { href: '/admin/predictions', label: 'Prediction Logs', icon: History },
  { href: '/admin/games', label: 'Games Control', icon: Gamepad2 },
  { href: '/admin/broadcasts', label: 'Broadcasts', icon: Megaphone },
  { href: '/admin/support', label: 'Support Center', icon: LifeBuoy },
];

const assistantNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/user-lookup', label: 'User Lookup', icon: Search },
  { href: '/admin/assistant', label: 'AI Assistant', icon: Bot },
  { href: '/admin/licenses', label: 'Licenses', icon: Ticket },
  { href: '/admin/support', label: 'Support Center', icon: LifeBuoy },
];

const userNav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/games', label: 'Games', icon: Gamepad2 },
    { href: '/licenses', label: 'My Licenses', icon: Ticket },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/support', label: 'Support', icon: LifeBuoy },
];


export function AppSidebar() {
  const { userProfile, isProfileLoading } = useProfile();
  const pathname = usePathname();

  const getNavItems = () => {
    if (!userProfile) return [];
    switch (userProfile.role) {
      case 'SuperAdmin':
        return superAdminNav;
      case 'Admin':
        return adminNav;
      case 'Assistant':
        return assistantNav;
      default:
        return userNav;
    }
  };

  const navItems = getNavItems();

  const renderSkeleton = () => (
    <div className="p-4 space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      ))}
    </div>
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Logo className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold">PredictPro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isProfileLoading || !userProfile ? renderSkeleton() : (
            <SidebarMenu>
            {navItems.map((item) => {
                const Icon = item.icon;
                
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin' && item.href !== '/dashboard');

                return (
                <SidebarMenuItem key={item.label}>
                    <Link href={item.href}>
                    <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                    >
                        <Icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                );
            })}
            </SidebarMenu>
        )}
      </SidebarContent>
      <SidebarFooter>
         {/* Can add items to the footer later */}
      </SidebarFooter>
    </Sidebar>
  );
}
