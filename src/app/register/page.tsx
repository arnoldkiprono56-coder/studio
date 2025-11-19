"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
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
import { Checkbox } from "@/components/ui/checkbox"
import { CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useFirestore } from "@/firebase"
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { doc, getDocs, query, collection, where, writeBatch } from "firebase/firestore"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Logo } from "@/components/icons"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
  terms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms of service."
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const { toast } = useToast();
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
            referralCode: "",
            terms: false,
        },
    });

    const calculateStrength = (password: string) => {
        let strength = 0;
        if (password.length > 7) strength += 25;
        if (password.match(/[A-Z]/)) strength += 25;
        if (password.match(/[0-9]/)) strength += 25;
        if (password.match(/[^A-Za-z0-9]/)) strength += 25;
        setPasswordStrength(strength);
    };

    const getReferrerId = async (referralCode: string): Promise<string | null> => {
        if (!firestore || !referralCode.startsWith('PRO-') || referralCode.length < 10) {
            return null;
        }

        const userIdPrefix = referralCode.replace('PRO-', '').toLowerCase();
        
        const usersRef = collection(firestore, 'users');
        // This is not a perfect query but it's the best we can do without more complex indexing/search
        const q = query(usersRef, where('id', '>=', userIdPrefix), where('id', '<=', userIdPrefix + '\uf8ff'));

        const querySnapshot = await getDocs(q);
        
        for (const doc of querySnapshot.docs) {
             // We have to double-check in the client because the query is case-sensitive
             if (doc.id.substring(0, 6).toUpperCase() === userIdPrefix.toUpperCase()) {
                return doc.id;
            }
        }

        return null;
    };


    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);

        if (!auth || !firestore) {
          toast({
              variant: "destructive",
              title: "Registration Failed",
              description: "Firebase service not available.",
          });
          setIsLoading(false);
          return;
        }
        
        let referrerId: string | null = null;
        if (values.referralCode) {
            referrerId = await getReferrerId(values.referralCode);
            if (!referrerId) {
                toast({
                    variant: "destructive",
                    title: "Invalid Referral Code",
                    description: "The referral code you entered is not valid.",
                });
                setIsLoading(false);
                return;
            }
        }


        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            await sendEmailVerification(user);

            const batch = writeBatch(firestore);

            const userRef = doc(firestore, "users", user.uid);
            const isSuperAdmin = values.email === 'shadowvybez001@gmail.com';
            const userRole = isSuperAdmin ? 'SuperAdmin' : 'User';

            const userData: any = {
                id: user.uid,
                email: user.email,
                role: userRole,
                isSuspended: false,
                createdAt: new Date().toISOString(),
                balance: 0,
            };

            if (referrerId) {
                userData.referredBy = referrerId;
            }
            
            batch.set(userRef, userData);

            // Correctly add SuperAdmin or Admin to the /admins collection
            if (isSuperAdmin || userRole === 'Admin') {
                const adminRef = doc(firestore, "admins", user.uid);
                batch.set(adminRef, { userId: user.uid, isAdmin: true });
            }

            await batch.commit();

            toast({
                title: "Registration Successful",
                description: "A verification email has been sent. Please check your inbox.",
            });
            router.push(`/verify-otp?email=${values.email}`);

        } catch (error: any) {
            console.error("Registration Error:", error);
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const bgImage = PlaceHolderImages.find(img => img.id === 'auth-background');


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
          <div className="text-center space-y-1">
            <CardTitle className="text-2xl">Create an Account</CardTitle>
            <CardDescription>Join PredictPro to get access to advanced analytics.</CardDescription>
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
                      <Input placeholder="name@example.com" {...field} autoComplete="email"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} onChange={(e) => {
                          field.onChange(e);
                          calculateStrength(e.target.value);
                      }}
                      autoComplete="new-password"
                      />
                    </FormControl>
                    <div className="flex items-center gap-2 pt-1">
                        <Progress value={passwordStrength} className="h-2" />
                        <span className="text-xs text-muted-foreground w-12 text-right">{passwordStrength}%</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="PRO-XXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                        <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                        </FormLabel>
                        <FormMessage />
                    </div>
                    </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register
              </Button>
            </form>
          </Form>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
