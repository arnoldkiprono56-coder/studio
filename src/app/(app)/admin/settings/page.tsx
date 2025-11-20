'use client';

import { DataSeeder } from './DataSeeder';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            </div>
            <DataSeeder />
        </div>
    );
}
