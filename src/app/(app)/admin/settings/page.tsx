'use client';

import { DataSeeder } from './DataSeeder';

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground">Manage core platform settings and data.</p>
            </div>
            <DataSeeder />
        </div>
    );
}
