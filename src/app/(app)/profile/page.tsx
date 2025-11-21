
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, Copy, Shield, Loader2 } from "lucide-react";
import { useProfile } from "@/context/profile-context";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type UserRole = 'User' | 'Assistant' | 'Admin' | 'SuperAdmin';

const roleConfig: Record<UserRole, { icon: string; className: string }> = {
    SuperAdmin: {
        icon: '👑',
        className: 'bg-gold text-black hover:bg-gold/90',
    },
    Admin: {
        icon: '🛡️',
        className: 'bg-purple text-white hover:bg-purple/90',
    },
    Assistant: {
        icon: '🤖',
        className: 'bg-sky-blue text-black hover:bg-sky-blue/90',
    },
    User: {
        icon: '👤',
        className: 'bg-gray text-black hover:bg-gray/90',
    },
};

const RoleBadge = ({ role }: { role: UserRole }) => {
    const config = roleConfig[role] || roleConfig.User;
    return (
        <Badge className={cn('gap-2 text-base', config.className)}>
            <span>{config.icon}</span>
            <span>{role.toUpperCase()}</span>
        </Badge>
    );
};


export default function ProfilePage() {
    const { userProfile, isProfileLoading, updateUserProfile } = useProfile();
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

    if (isProfileLoading || !userProfile) {
        return (
            <div className="space-y-8 max-w-3xl mx-auto">
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-5 w-80" />
                <Card>
                    <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-16 h-16 rounded-full" />
                            <div className="flex-grow space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-32" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { name, email, avatar, role } = {
        name: userProfile.email?.split('@')[0] || "Player",
        email: userProfile.email,
        avatar: `https://i.pravatar.cc/150?u=${userProfile.id}`,
        role: userProfile.role as UserRole || 'User',
    };
    
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
              <div className="mt-1">
                <RoleBadge role={role}/>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
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
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}

    