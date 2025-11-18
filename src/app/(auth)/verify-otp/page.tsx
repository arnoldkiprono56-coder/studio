"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CardTitle, CardDescription } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import { useToast } from "@/hooks/use-toast"

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const { toast } = useToast()

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);


  function handleVerify() {
    setIsLoading(true);
    console.log("Verifying OTP:", otp)
    // Simulate API call
    setTimeout(() => {
        setIsLoading(false);
        if (otp === '123456') {
             toast({ title: "Success", description: "Account verified successfully." })
            // On success, you would redirect, e.g., router.push('/dashboard')
        } else {
            toast({ variant: "destructive", title: "Error", description: "Invalid OTP. Please try again." })
        }
    }, 2000);
  }

  function handleResend() {
    console.log("Resending OTP")
    setResendCooldown(60);
    toast({ title: "OTP Resent", description: "A new OTP has been sent to your email." })
  }

  return (
    <>
      <div className="text-center space-y-1">
        <CardTitle className="text-2xl">Verify Your Account</CardTitle>
        <CardDescription>Enter the 6-digit code sent to your email.</CardDescription>
      </div>
      <div className="space-y-6 flex flex-col items-center">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
            </InputOTPGroup>
        </InputOTP>

        <Button type="button" className="w-full" disabled={isLoading || otp.length < 6} onClick={handleVerify}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
        </Button>
      </div>
      <div className="text-center text-sm">
        Didn&apos;t receive the code?{" "}
        <Button variant="link" className="p-0 h-auto font-semibold text-primary hover:underline" disabled={resendCooldown > 0} onClick={handleResend}>
          Resend {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
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
