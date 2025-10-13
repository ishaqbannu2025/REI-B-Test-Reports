'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useFirebase, useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [email, setEmail] = useState('m.ishaqbannu@gmail.com');
  const [password, setPassword] = useState('Innovation123');

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const setAdminClaim = async (uid: string): Promise<void> => {
    try {
      const response = await fetch('/api/set-admin-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set admin claim.');
      }
      console.log(`Admin claim set request sent for UID: ${uid}`);
    } catch (error) {
      console.error("Error in setAdminClaim:", error);
      toast({
        variant: "destructive",
        title: "Admin Setup Error",
        description: "Could not set admin privileges on the server.",
      });
    }
  };

  const handleUserSetup = async (firebaseUser: FirebaseUser) => {
    if (!firestore) return;
  
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const adminEmails = ['admin@example.gov', 'm.ishaqbannu@gmail.com'];
    const shouldBeAdmin = adminEmails.includes(firebaseUser.email || '');
    
    // Check if the user document already exists.
    const userDoc = await getDoc(userDocRef);
    const isNewUser = !userDoc.exists();
  
    if (isNewUser) {
      const newUserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        photoURL: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.email}`,
        role: shouldBeAdmin ? 'Admin' : 'Data Entry User',
        createdAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newUserProfile);
      console.log(`New user profile created for ${firebaseUser.uid}`);
    }

    if (shouldBeAdmin) {
      // Get current claims by forcing a token refresh
      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      const isAlreadyAdmin = idTokenResult.claims.role === 'Admin';
      
      if (!isAlreadyAdmin) {
        console.log(`User ${firebaseUser.uid} requires admin claim. Setting now...`);
        // Call the server-side function to set the claim.
        await setAdminClaim(firebaseUser.uid);
        // CRITICAL: Force a refresh of the token again to get the new claim immediately.
        await firebaseUser.getIdToken(true);
        console.log("Token refreshed to apply new admin claim.");
      }
    }
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // After sign-in, run the setup which includes the admin check and claim logic.
      await handleUserSetup(userCredential.user);
      toast({ title: "Login Successful", description: "Redirecting to dashboard..." });
      // The useEffect will handle the redirect.
    } catch (error: any) {
      // If user doesn't exist, try creating a new account for them.
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        try {
          const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
          // After sign-up, run the setup.
          await handleUserSetup(newUserCredential.user);
          toast({ title: "Account Created", description: "Redirecting to dashboard..." });
          // The useEffect will handle the redirect.
        } catch (createError: any) {
          toast({
            variant: "destructive",
            title: "Sign-Up Error",
            description: createError.message,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Login Error",
          description: error.message,
        });
      }
    }
  };
  
  if (isUserLoading || user) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      )
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo className="h-12 w-12 mx-auto" />
            <h1 className="text-3xl font-bold">REI-B Reports Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your credentials to access the dashboard
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Login or Sign Up
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Want to verify a report?{' '}
            <Link href="/verify" className="underline">
              Public Verification
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://picsum.photos/seed/1/1200/1800"
          alt="Placeholder"
          data-ai-hint="office building"
          width="1200"
          height="1800"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
