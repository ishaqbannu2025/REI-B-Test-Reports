
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    // Only redirect when the entire user setup process is confirmed to be complete.
    if (isSetupComplete && user) {
      router.push('/dashboard');
    }
  }, [isSetupComplete, user, router]);

  const setAdminClaim = async (uid: string): Promise<void> => {
    try {
        const response = await fetch('/api/set-admin-claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to set admin claim on the server.');
        }
        console.log(`Admin claim set request sent for UID: ${uid}`);
    } catch (error) {
        console.error("Error in setAdminClaim:", error);
        throw error; // Re-throw to be caught by the calling function
    }
  };
  
  const handleUserSetup = async (firebaseUser: FirebaseUser): Promise<void> => {
    if (!firestore) throw new Error("Firestore is not initialized.");
  
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const adminEmails = ['admin@example.gov', 'm.ishaqbannu@gmail.com'];
    const shouldBeAdmin = adminEmails.includes(firebaseUser.email || '');
    
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
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
      const initialToken = await firebaseUser.getIdTokenResult();
      if (initialToken.claims.role !== 'Admin') {
        console.log(`User ${firebaseUser.uid} requires 'Admin' claim. Setting now...`);
        // 1. Call the server-side function and wait for it to complete.
        await setAdminClaim(firebaseUser.uid);
        // 2. CRITICAL: Force a refresh of the token to get the new claim immediately and wait for it.
        await firebaseUser.getIdToken(true);
        console.log("Token refreshed to apply new 'Admin' claim on the client.");
      }
    }
    // This promise resolves only after all setup, including claim setting and token refresh, is complete.
  };
  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsProcessing(true);
    
    let userCredential;

    try {
      // First, try to sign in
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        // If sign-in fails because the user doesn't exist, create a new account
        try {
          toast({ title: "Creating Account", description: "This may take a moment..." });
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } catch (createError: any) {
          toast({ variant: "destructive", title: "Sign-Up Error", description: createError.message });
          setIsProcessing(false);
          return;
        }
      } else {
        // Handle other login errors
        toast({ variant: "destructive", title: "Login Error", description: error.message });
        setIsProcessing(false);
        return;
      }
    }

    // Now that we have a user, run the setup process and wait for it to complete.
    try {
        toast({ title: "Login Successful", description: "Finalizing setup..." });
        await handleUserSetup(userCredential.user);
        // Only set setup to complete after everything, including claims, is done.
        setIsSetupComplete(true);
    } catch(setupError: any) {
        toast({
          variant: "destructive",
          title: "Setup Error",
          description: setupError.message,
        });
    } finally {
        // We no longer set isProcessing to false here, as the useEffect will handle the redirect.
        // If the setup fails, the user remains on the login page but can try again.
        setIsProcessing(false);
    }
  };
  
  // This state is for the initial auth check on page load, not for the login process itself.
  if (isUserLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      )
  }

  // If a user is already logged in, but the setup process hasn't been confirmed as complete,
  // we redirect them to the dashboard, which will then handle the data fetching correctly.
  if(user && !isUserLoading) {
    router.push('/dashboard');
    return null;
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
                disabled={isProcessing}
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
                disabled={isProcessing}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? 'Please wait...' : 'Login or Sign Up'}
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
