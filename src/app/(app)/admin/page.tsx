
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users2,
  Gamepad2,
  Megaphone,
  LifeBuoy,
  Settings,
  Search,
  Bot,
  Ticket,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/context/profile-context';

const adminFeatures = [
  {
    href: '/admin/user-lookup',
    label: 'User Lookup',
    icon: Search,
    description: "Find a user's profile and activity.",
    roles: ['SuperAdmin', 'Admin', 'Assistant'],
  },
  {
    href: '/admin/assistant',
    label: 'AI Assistant',
    icon: Bot,
    description: 'Use the AI to manage the platform.',
    roles: ['SuperAdmin', 'Admin', 'Assistant'],
  },
   {
    href: '/admin/staff',
    label: 'Staff Management',
    icon: Users2,
    description: 'Promote, ban, and manage all users.',
    roles: ['SuperAdmin'],
  },
  {
    href: '/admin/games',
    label: 'Games Control',
    icon: Gamepad2,
    description: 'Enable or disable games for all users.',
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    href: '/admin/broadcasts',
    label: 'Broadcasts',
    icon: Megaphone,
    description: 'Send messages to user groups.',
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    href: '/admin/licenses',
    label: 'Licenses',
    icon: Ticket,
    description: 'View and manage all user licenses.',
    roles: ['SuperAdmin', 'Admin', 'Assistant'],
  },
  {
    href: '/admin/predictions',
    label: 'Prediction Logs',
    icon: History,
    description: 'View all predictions generated.',
    roles: ['SuperAdmin', 'Admin'],
  },
  {
    href: '/admin/support',
    label: 'Support Center',
    icon: LifeBuoy,
    description: 'Manage user support tickets.',
    roles: ['SuperAdmin', 'Admin', 'Assistant'],
  },
  {
    href: '/admin/settings',
    label: 'System Settings',
    icon: Settings,
    description: 'Manage core platform settings.',
    roles: ['SuperAdmin'],
  },
];

export default function AdminDashboardPage() {
  const { userProfile } = useProfile();
  const userRole = userProfile?.role;

  const accessibleFeatures = adminFeatures.filter(
    (feature) => userRole && feature.roles.includes(userRole)
  );

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Platform overview and management tools for PredictPro.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {accessibleFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link href={feature.href} key={feature.label}>
              <Card className="hover:bg-accent/50 hover:border-primary transition-all h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{feature.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
