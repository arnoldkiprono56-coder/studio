import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const transactions = [
    { type: "commission", description: "Referral: user@test.com", amount: 150.00, date: "2023-10-26" },
    { type: "withdrawal", description: "Withdrawal to 07...678", amount: -300.00, date: "2023-10-25" },
    { type: "reward", description: "Task: Daily Login", amount: 10.00, date: "2023-10-25" },
    { type: "commission", description: "Referral: another@test.com", amount: 150.00, date: "2023-10-24" },
]

export default function WalletPage() {
    const balance = 1250.50;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground">Manage your funds and view transaction history.</p>
      </div>

      <Card className="bg-gradient-to-br from-primary/80 to-primary">
        <CardHeader>
            <CardTitle className="text-primary-foreground">Current Balance</CardTitle>
            <CardDescription className="text-primary-foreground/80">Available for withdrawal</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-end justify-between">
                <p className="text-5xl font-bold text-primary-foreground">{formatCurrency(balance)}</p>
                <Button variant="secondary">Request Withdrawal</Button>
            </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Transaction History</h2>
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-success/20' : 'bg-error/20'}`}>
                                       {tx.amount > 0 ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownLeft className="w-4 h-4 text-error" />}
                                    </div>
                                    <div>
                                        <p className="font-medium">{tx.description}</p>
                                        <Badge variant="outline" className="md:hidden">{new Date(tx.date).toLocaleDateString()}</Badge>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${tx.amount > 0 ? 'text-success' : 'text-error'}`}>
                                {formatCurrency(tx.amount)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{new Date(tx.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
      </div>
    </div>
  );
}
