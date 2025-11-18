import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LifeBuoy, Bot, UserCheck, ChevronRight } from "lucide-react";
import Link from "next/link";

const supportOptions = [
    {
        title: "System Help",
        description: "Get instant answers from our automated assistant.",
        icon: Bot,
        href: "/support/chat/system",
    },
    {
        title: "Customer Care",
        description: "Chat with an assistant for personalized help.",
        icon: UserCheck,
        href: "/support/chat/assistant",
    },
    {
        title: "Manager",
        description: "Escalate complex issues to a SuperAdmin.",
        icon: LifeBuoy,
        href: "/support/chat/manager",
    },
];

const recentTickets = [
    { id: "TKT-1234", subject: "Payment not verified", status: "In Progress" },
    { id: "TKT-1230", subject: "Aviator prediction query", status: "Resolved" },
    { id: "TKT-1225", subject: "Unable to login", status: "Resolved" },
]

export default function SupportPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
        <p className="text-muted-foreground">How can we help you today?</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {supportOptions.map(option => {
            const Icon = option.icon;
            return (
                <Card key={option.title} className="hover:bg-accent/50 transition-colors">
                    <Link href={option.href} className="flex flex-col h-full">
                        <CardHeader className="flex-grow">
                            <div className="flex items-center gap-4 mb-2">
                                <Icon className="w-8 h-8 text-primary"/>
                                <CardTitle>{option.title}</CardTitle>
                            </div>
                            <CardDescription>{option.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="secondary" className="w-full">
                                Get Started <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Link>
                </Card>
            );
        })}
      </div>

       <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Recent Support Tickets</h2>
        <Card>
            <CardContent className="pt-6">
                <ul className="divide-y divide-border">
                {recentTickets.map((ticket) => (
                    <li key={ticket.id} className="py-3 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{ticket.subject}</p>
                            <p className="text-sm text-muted-foreground font-code">{ticket.id}</p>
                        </div>
                         <Badge variant={ticket.status === 'Resolved' ? 'default' : 'secondary'} className={ticket.status === 'Resolved' ? 'bg-success' : 'bg-warning/80'}>
                            {ticket.status}
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
