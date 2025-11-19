import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { Header } from '@/components/header';
import { MobileNav } from '@/components/mobile-nav';
import { ProfileProvider } from '@/context/profile-context';

const APP_NAME = "PredictPro";
const APP_DESCRIPTION = "Advanced predictive analytics for popular games.";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1A2F",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-sans antialiased", process.env.NODE_ENV === "development" ? "debug-screens" : "")}>
        <FirebaseClientProvider>
          <ProfileProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 container py-8 flex flex-col">{children}</main>
              <MobileNav />
              <div className="h-16 md:hidden" /> {/* Spacer for mobile nav */}
            </div>
          </ProfileProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
