
'use client';

import { TotalUsersCard } from './predictions-chart';
import { ActiveLicensesCard, SuspendedAccountsCard } from './prediction-success-rate';


export function AnalyticsStats() {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <TotalUsersCard />
            <ActiveLicensesCard />
            <SuspendedAccountsCard />
        </div>
    )
}
