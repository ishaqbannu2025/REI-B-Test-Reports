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
  const [processingMessage, setProcessingMessage] = useState('Please wait...');
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // This effect will run when the user is authenticated and the setup is complete.
  useEffect(() => {
    if (user && !isUserLoading && isSetupComplete) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, isSetupComplete, router]);

  // This effect handles the case where a user is already logged in (e.g., page refresh).
  useEffect(() => {
    if (user && !isUserLoading && !isProcessing) {
      handleLogin(undefined, true); // Trigger the setup process for an existing session.
    }
  }, [user, isUserLoading]);

  const setAdminClaim = async (uid: string): Promise<void> => {
    const response = await fetch('/api/set-admin-claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set admin claim on the server.');
    }
  };
  
  const handleUserSetup = async (firebaseUser: FirebaseUser): Promise<void> => {
    if (!firestore) throw new Error("Firestore is not initialized.");
  
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const adminEmails = ['admin@example.gov', 'm.ishaqbannu@gmail.com'];
    const shouldBeAdmin = adminEmails.includes(firebaseUser.email || '');
    
    setProcessingMessage("Checking user profile...");
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      setProcessingMessage("Creating user profile...");
      const newUserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        photoURL: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.email}`,
        role: shouldBeAdmin ? 'Admin' : 'Data Entry User',
        createdAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newUserProfile);
    }
  
    if (shouldBeAdmin) {
        setProcessingMessage("Verifying Admin Role...");
        // This forces a refresh of the token to get the latest claims.
        const initialToken = await firebaseUser.getIdTokenResult();
        // Only set the claim if it's not already present.
        if (initialToken.claims.role !== 'Admin') {
            setProcessingMessage("Setting Admin Role...");
            await setAdminClaim(firebaseUser.uid);
            // CRITICAL: Force refresh the token *after* setting the claim.
            await firebaseUser.getIdToken(true); 
            setProcessingMessage("Admin Role Confirmed.");
        }
    }
  };
  
  const handleLogin = async (e?: React.FormEvent, isRefresh: boolean = false) => {
    if (e) e.preventDefault();
    // If it's a manual login attempt, ensure we are not already processing.
    if (!isRefresh && isProcessing) return;

    setIsProcessing(true);
    let currentUser: FirebaseUser | null = user;

    if (!isRefresh) {
        setProcessingMessage('Logging in...');
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          currentUser = userCredential.user;
        } catch (error: any) {
          if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            try {
              toast({ title: "User not found. Creating new account...", description: "This may take a moment..." });
              setProcessingMessage('Creating Account...');
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              currentUser = userCredential.user;
            } catch (createError: any) {
              toast({ variant: "destructive", title: "Sign-Up Error", description: createError.message });
              setIsProcessing(false);
              return;
            }
          } else {
            toast({ variant: "destructive", title: "Login Error", description: error.message });
            setIsProcessing(false);
            return;
          }
        }
    }

    if (currentUser) {
        try {
            setProcessingMessage("Finalizing setup...");
            // Await the entire setup process, including token refresh.
            await handleUserSetup(currentUser);
            // Only set setup complete after all async operations in handleUserSetup are done.
            setIsSetupComplete(true);
            toast({ title: "Setup Complete", description: "Redirecting to dashboard..." });
        } catch(setupError: any) {
            toast({
              variant: "destructive",
              title: "Setup Error",
              description: setupError.message,
            });
            setIsProcessing(false); // Stop processing on error.
        }
    } else {
        // This case handles a page load where the user isn't logged in yet.
        setIsProcessing(false);
    }
  };
  
  // This is the primary loading/blocking UI.
  // It shows when the user is being loaded OR when they are logged in but setup is not yet complete.
  if (isUserLoading || (user && !isSetupComplete)) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p>{processingMessage}</p>
        </div>
      )
  }
  
  // This state is hit when a user is logged in, and setup is complete, just before the useEffect redirects them.
  if (user && isSetupComplete) {
      return <div className="flex min-h-screen items-center justify-center"><p>Redirecting to dashboard...</p></div>;
  }

  // This is the default state: user is not logged in.
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
              {isProcessing ? processingMessage : 'Login or Sign Up'}
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
