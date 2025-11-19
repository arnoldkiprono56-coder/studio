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
  Shield,
  Ticket,
  CreditCard,
  History,
  Tag,
  Gamepad2,
  LifeBuoy,
  Settings,
  Users2,
  LayoutDashboard,
  Users,
  Wallet,
  Gift,
  User,
} from 'lucide-react';
import { Skeleton } from './ui/skeleton';

const superAdminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/licenses', label: 'Licenses', icon: Ticket },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/predictions', label: 'Prediction Logs', icon: History },
  { href: '/admin/pricing', label: 'Plans & Pricing', icon: Tag },
  { href: '/admin/games', label: 'Games Control', icon: Gamepad2 },
  { href: '/admin/support', label: 'Support Center', icon: LifeBuoy },
  { href: '/admin/settings', label: 'System Settings', icon: Settings },
  { href: '/admin/staff', label: 'Staff Management', icon: Users2 },
];

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/licenses', label: 'Licenses', icon: Ticket },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/predictions', label: 'Prediction Logs', icon: History },
  { href: '/admin/games', label: 'Games Control', icon: Gamepad2 },
  { href: '/admin/support', label: 'Support Center', icon: LifeBuoy },
];

const assistantNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/licenses', label: 'Licenses (Read)', icon: Ticket },
  { href: '/admin/payments', label: 'Payments (Read)', icon: CreditCard },
  { href: '/admin/support', label: 'Support Center', icon: LifeBuoy },
];

const userNav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/games', label: 'Games', icon: Gamepad2 },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/licenses', label: 'My Licenses', icon: Ticket },
    { href: '/referrals', label: 'Referrals', icon: Gift },
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
                
                const isActive = item.href === '/' 
                    ? pathname === item.href 
                    : pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');


                return (
                <SidebarMenuItem key={item.label}>
                    <Link href={item.href} legacyBehavior passHref>
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
