
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";


export default function PreVerifiedPaymentsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Feature Deprecated</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 bg-muted/50 p-6 rounded-lg">
                    <ShieldAlert className="h-12 w-12 text-muted-foreground" />
                    <div>
                        <h3 className="font-semibold">This feature has been removed.</h3>
                        <p className="text-muted-foreground text-sm">The pre-verified payment system has been replaced with a simpler, direct verification flow for admins on the main Payments page.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
