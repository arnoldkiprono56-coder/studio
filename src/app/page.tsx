'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/icons';

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 2500); // 2.5 second delay to simulate loading

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="flex items-center gap-4 mb-4">
        <Logo className="w-12 h-12 text-primary animate-pulse" />
        <h1 className="text-3xl font-bold">PredictPro</h1>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <p>Connecting to PredictPro servers...</p>
      </div>
    </div>
  );
}
