import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

const games = [
    { name: "Aviator", href: "/games/aviator", status: "active" },
    { name: "Crash", href: "/games/crash", status: "active" },
    { name: "Gems & Mines", href: "/games/gems-mines", status: "locked" },
]

const recentPredictions = [
    { game: "Aviator", prediction: "1.8x - 2.0x", result: "Won" },
    { game: "Crash", prediction: "3.5x - 4.2x", result: "Lost" },
    { game: "Aviator", prediction: "1.5x - 1.7x", result: "Won" },
]

export default function DashboardPage() {
  const userName = "PlayerOne";
  const userPlan = "Pro Plus";
  const planExpires = "in 25 days";
  const walletBalance = 1250.50;
  const activeLicenses = 2;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {userName}!</h1>
          <p className="text-muted-foreground">Here&apos;s your gaming analytics overview.</p>
        </div>
        <Badge variant="outline" className="text-base border-accent-pro text-accent-pro py-1 px-3">
          <Star className="w-4 h-4 mr-2 fill-accent-pro" />
          {userPlan} Plan
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>{planExpires}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/upgrade">
              <Button className="w-full">Upgrade Plan</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
            <CardDescription>Your current account balance.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(walletBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Licenses</CardTitle>
            <CardDescription>Licenses currently in use.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeLicenses}</p>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Game Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {games.map(game => (
                 <Card key={game.name} className="hover:bg-accent/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">{game.name}</CardTitle>
                        <Badge variant={game.status === 'active' ? 'default' : 'secondary'} className={game.status === 'active' ? 'bg-success' : ''}>{game.status}</Badge>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            {game.status === 'active' ? 'Predictions available' : 'License required'}
                        </p>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={game.href}>Go to game <ArrowRight className="w-4 h-4 ml-2" /></Link>
                        </Button>
                    </CardContent>
                 </Card>
            ))}
        </div>
      </div>

       <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Recent Predictions</h2>
        <Card>
            <CardContent className="pt-6">
                <ul className="space-y-4">
                {recentPredictions.map((p, i) => (
                    <li key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                             <Badge variant="secondary">{p.game}</Badge>
                            <span className="font-mono text-sm">{p.prediction}</span>
                        </div>
                        <Badge variant={p.result === 'Won' ? 'default' : 'destructive'} className={p.result === 'Won' ? 'bg-success' : ''}>
                            {p.result}
                        </Badge>
                    </li>
                ))}
                </ul>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
