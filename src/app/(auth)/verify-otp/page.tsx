"use client"

import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth, useUser } from "@/firebase"
import { sendEmailVerification } from "firebase/auth"

import { Button } from "@/components/ui/button"
import { CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

function VerifyOtpContent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const { toast } = useToast();

  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user && user.emailVerified) {
      toast({ title: "Success", description: "Account verified successfully." });
      router.push('/dashboard');
    }

    const interval = setInterval(async () => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(interval);
          toast({ title: "Success", description: "Account verified successfully." });
          router.push('/dashboard');
        }
      }
    }, 3000);

    return () => clearInterval(interval);

  }, [user, router, toast]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You are not logged in." });
      return;
    }
    try {
      await sendEmailVerification(user);
      setResendCooldown(60);
      toast({ title: "Email Sent", description: "A new verification email has been sent." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  if (isUserLoading) {
    return <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;
  }

  return (
    <>
      <div className="text-center space-y-2">
        <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        <CardDescription>
          A verification link has been sent to <span className="font-semibold text-primary">{email || (user ? user.email : 'your email')}</span>. Please check your inbox and click the link to continue.
        </CardDescription>
      </div>
      <div className="space-y-4 flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Waiting for verification...</p>

        <Button variant="link" className="p-0 h-auto font-semibold text-primary hover:underline" disabled={resendCooldown > 0} onClick={handleResend}>
          Resend email {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
        </Button>
      </div>

      <div className="text-center text-sm">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </>
  )
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}>
            <VerifyOtpContent />
        </Suspense>
    )
}
