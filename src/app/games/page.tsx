import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Gem, Bomb } from "lucide-react";

const games = [
    { 
        name: "Aviator", 
        href: "/games/aviator", 
        status: "active", 
        description: "Predict the best time to cash out before the plane flies away.",
        icon: Zap,
        accent: "hsl(var(--accent-basic))"
    },
    { 
        name: "Crash", 
        href: "/games/crash", 
        status: "active", 
        description: "Anticipate the crash point of the rising multiplier.",
        icon: Shield,
        accent: "hsl(var(--accent-standard))"

    },
    { 
        name: "Mines", 
        href: "/games/mines", 
        status: "locked", 
        description: "Navigate the grid safely by avoiding hidden mines.",
        icon: Bomb,
        accent: "hsl(var(--error))"
    },
    { 
        name: "Gems", 
        href: "/games/gems", 
        status: "locked", 
        description: "Uncover valuable gems and maximize your winnings.",
        icon: Gem,
        accent: "hsl(var(--accent-pro))"
    },
]

export default function GamesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Games Hub</h1>
        <p className="text-muted-foreground">Select a game to view predictions and analytics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {games.map(game => {
            const Icon = game.icon;
            return (
                <Card key={game.name} className="flex flex-col hover:border-primary transition-all">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg" style={{backgroundColor: game.accent + '20'}}>
                                    <Icon className="w-6 h-6" style={{color: game.accent}} />
                                </div>
                                <CardTitle className="text-2xl">{game.name}</CardTitle>
                            </div>
                            <Badge variant={game.status === 'active' ? 'default' : 'secondary'} className={game.status === 'active' ? 'bg-success/80' : ''}>
                                {game.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col">
                        <CardDescription className="flex-grow">{game.description}</CardDescription>
                        <div className="mt-6">
                            {game.status === 'active' ? (
                                <Button asChild className="w-full">
                                    <Link href={game.href}>
                                        Access Predictions <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href={`/purchase/${game.name.toLowerCase()}`}>
                                        Buy License <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )
        })}
      </div>
    </div>
  );
}
