'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Welcome, Admin!</CardTitle>
                <CardDescription>Select a tab to manage different parts of the application.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>This is the main dashboard overview. Key metrics and reports will be displayed here in the future.</p>
            </CardContent>
        </Card>
    );
}
