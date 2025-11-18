import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">{children}</main>
      <MobileNav />
      <div className="h-16 md:hidden" /> {/* Spacer for mobile nav */}
    </div>
  );
}
