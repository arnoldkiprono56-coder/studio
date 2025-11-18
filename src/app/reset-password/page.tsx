"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { useState } from "react"
import { Loader2, CheckCircle } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CardTitle, CardDescription } from "@/components/ui/card"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Logo } from "@/components/icons"


const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
})

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    console.log(values)
    // Simulate API call
    setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
    }, 2000);
  }
  
  const bgImage = PlaceHolderImages.find(img => img.id === 'auth-background');


  const renderContent = () => {
    if (isSuccess) {
      return (
          <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-success" />
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription>We&apos;ve sent a password reset link to your email address.</CardDescription>
              <Button variant="ghost" asChild>
                  <Link href="/login">Back to Login</Link>
              </Button>
          </div>
      )
    }

    return (
      <>
        <div className="text-center space-y-1">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link.</CardDescription>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
          </form>
        </Form>
        <div className="text-center text-sm">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Login
          </Link>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          className="object-cover"
          data-ai-hint={bgImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <Logo className="w-10 h-10 text-primary" />
            <span className="text-2xl font-bold">PredictPro</span>
          </Link>
        </div>
        <div className="p-8 space-y-6 bg-card/70 border border-border/50 rounded-2xl shadow-2xl backdrop-blur-lg">
            {renderContent()}
        </div>
      </div>
    </div>
  )
}
