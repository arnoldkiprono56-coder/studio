
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Wallet, User, MessageSquare, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/context/profile-context";

const userNavItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/games", icon: LayoutGrid, label: "Games" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/support", icon: MessageSquare, label: "Support" },
  { href: "/profile", icon: User, label: "Profile" },
];

const adminNavItems = [
  { href: "/admin", icon: Shield, label: "Admin" },
  { href: "/support", icon: MessageSquare, label: "Support" },
  { href: "/profile", icon: User, label: "Profile" },
];


export function MobileNav() {
  const pathname = usePathname();
  const { userProfile } = useProfile();

  const isAdmin = userProfile && ['SuperAdmin', 'Admin', 'Assistant'].includes(userProfile.role);
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className={`grid h-full max-w-lg mx-auto grid-cols-${navItems.length}`}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex flex-col items-center justify-center px-5 hover:bg-accent group",
              pathname.startsWith(item.href)
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
