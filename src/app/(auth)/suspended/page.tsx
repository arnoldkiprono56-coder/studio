
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ShieldAlert, LifeBuoy, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function SuspendedPage() {
    const auth = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
        }
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center border-destructive">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 p-3 rounded-full mb-4">
                        <ShieldAlert className="w-12 h-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl text-destructive">Account Suspended</CardTitle>
                    <CardDescription>
                        Your access to PredictPro has been temporarily suspended due to a violation of our terms of service.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm">
                        If you believe this is an error or wish to appeal this decision, please contact our support team.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button asChild variant="secondary">
                            <Link href="/support">
                                <LifeBuoy className="mr-2 h-4 w-4" />
                                Contact Support
                            </Link>
                        </Button>
                    </div>
                </CardContent>
                 <CardFooter className="flex-col gap-4 border-t pt-6">
                    <div className="flex w-full items-center justify-center gap-4">
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go Back
                        </Button>
                        <Button variant="destructive" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
