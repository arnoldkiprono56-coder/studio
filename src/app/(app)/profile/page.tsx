import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export default function ProfilePage() {
    const user = {
        name: "PlayerOne",
        email: "playerone@example.com",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        plan: "Pro Plus",
        mpesaNumber: "0712345678",
        referralCode: "PRO-1A2B3C"
    }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your account details and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <h3 className="font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm">Change Picture</Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mpesa">MPESA Number</Label>
            <Input id="mpesa" defaultValue={user.mpesaNumber} />
          </div>

          <Button>Save Changes</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plan</CardTitle>
          <CardDescription>Your current plan and referral information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <div>
                    <h3 className="font-semibold">Current Plan</h3>
                    <Badge variant="outline" className="text-base border-accent-pro text-accent-pro">
                        <Star className="w-4 h-4 mr-2 fill-accent-pro" />
                        {user.plan}
                    </Badge>
                </div>
                <Button variant="secondary">Upgrade</Button>
           </div>
           <div className="space-y-2">
            <Label htmlFor="referral">Your Referral Code</Label>
            <div className="flex items-center gap-2">
              <Input id="referral" readOnly defaultValue={user.referralCode} className="font-code"/>
              <Button variant="outline">Copy</Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
