
'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode, applyActionCode } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDocs, query, where, collection, writeBatch } from 'firebase/firestore';


export default function OnboardingPage() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [oobCode, setOobCode] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('oobCode');
        if (!code) {
            setError('No onboarding code provided. Please use the link from your email.');
            setIsLoading(false);
            return;
        }

        setOobCode(code);

        verifyPasswordResetCode(auth, code)
            .then((userEmail) => {
                setEmail(userEmail);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError('Invalid or expired link. Please request a new one.');
                setIsLoading(false);
            });
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (password !== confirmPassword) {
            toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive'});
            setIsLoading(false);
            return;
        }
        if (!oobCode) {
             toast({ title: 'Error', description: 'Missing onboarding code.', variant: 'destructive'});
             setIsLoading(false);
             return;
        }

        try {
            // 1. Set the user's password
            await confirmPasswordReset(auth, oobCode, password);

            // 2. Mark the user's email as verified
            await applyActionCode(auth, oobCode);
            
            // 3. Update the status of the Tenant and associated User
            if (email) {
                const q = query(collection(db, "users"), where("email", "==", email), where("role", "==", "Tenant Admin"));
                const userQuerySnapshot = await getDocs(q);

                if (!userQuerySnapshot.empty) {
                    const userDoc = userQuerySnapshot.docs[0];
                    const tenantId = userDoc.data().tenantId;
                    
                    if (tenantId) {
                        const batch = writeBatch(db);
                        
                        // Update tenant status
                        const tenantRef = doc(db, "tenants", tenantId);
                        batch.update(tenantRef, { status: "ACTIVE" });

                        // Update user status (if you have a status field)
                        // For now, activating the tenant is enough.

                        await batch.commit();
                    }
                }
            }


            toast({
                title: 'Account Activated!',
                description: 'Your password has been set. You will be redirected to the login page.',
            });

            router.push('/client/login');

        } catch (err: any) {
            console.error(err);
            toast({
                title: 'Onboarding Failed',
                description: err.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
            setIsLoading(false);
        }
    }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center">
                <Icons.logo className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">
                Activate Your Account
            </CardTitle>
            <CardDescription>
                Welcome! Set your password to get started.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <p>Verifying invitation...</p>
            ) : error ? (
                <p className="text-destructive text-center">{error}</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email || ''} readOnly disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input id="confirm-password" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                        </div>
                         <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
                            {isLoading ? 'Activating...' : 'Set Password & Login'}
                         </Button>
                    </div>
                </form>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
