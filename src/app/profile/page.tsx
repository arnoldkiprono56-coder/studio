'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, Copy, Shield } from "lucide-react";
import { useProfile } from "@/context/profile-context";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
    const { userProfile, updateUserProfile } = useProfile();
    const [oneXBetId, setOneXBetId] = useState(userProfile?.oneXBetId || '');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await updateUserProfile({ oneXBetId });
            toast({
                title: "Profile Updated",
                description: "Your 1xBet ID has been saved.",
            });
        } catch (error) {
            console.error("Failed to save profile:", error);
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: "Could not update your profile. Please try again.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyReferral = () => {
        if(userProfile?.id) {
            const referralCode = `PRO-${userProfile.id.substring(0, 6).toUpperCase()}`;
            navigator.clipboard.writeText(referralCode);
            toast({ title: "Copied!", description: "Referral code copied to clipboard." });
        }
    };

    if (!userProfile) {
        return <div>Loading profile...</div>;
    }

    const { name, email, avatar, plan, mpesaNumber, role } = {
        name: userProfile.email?.split('@')[0] || "Player",
        email: userProfile.email,
        avatar: `https://i.pravatar.cc/150?u=${userProfile.id}`,
        plan: "Pro Plus", // This seems to be mock data
        mpesaNumber: "0712345678", // This seems to be mock data
        role: userProfile.role || 'User',
    };
    
    const referralCode = `PRO-${userProfile.id.substring(0, 6).toUpperCase()}`;


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
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <h3 className="font-semibold">{name}</h3>
              <p className="text-sm text-muted-foreground">{email}</p>
              <Badge variant="secondary" className="mt-1">
                <Shield className="mr-1.5 h-3 w-3"/>
                {role}
              </Badge>
            </div>
            <Button variant="outline" size="sm" disabled>Change Picture</Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mpesa">MPESA Number</Label>
              <Input id="mpesa" defaultValue={mpesaNumber} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="1xbet-id">1xBet ID</Label>
              <Input 
                id="1xbet-id" 
                value={oneXBetId}
                onChange={(e) => setOneXBetId(e.target.value)}
                placeholder="Enter your 1xBet ID"
               />
            </div>
          </div>

          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
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
                        {plan}
                    </Badge>
                </div>
                <Button variant="secondary">Upgrade</Button>
           </div>
           <div className="space-y-2">
            <Label htmlFor="referral">Your Referral Code</Label>
            <div className="flex items-center gap-2">
              <Input id="referral" readOnly value={referralCode} className="font-code"/>
              <Button variant="outline" size="icon" onClick={handleCopyReferral}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
