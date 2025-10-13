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
  
  useEffect(() => {
    // If the user is loaded, and setup is complete, navigate to dashboard
    if (user && !isUserLoading && isSetupComplete) {
      router.push('/dashboard');
    }
    // If user is already logged in (e.g. page refresh), kick off setup process
    else if (user && !isUserLoading && !isProcessing) {
       handleLogin(undefined, true); // Pass a flag to indicate it's a refresh
    }
  }, [user, isUserLoading, isSetupComplete, router]);


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
        const initialToken = await firebaseUser.getIdTokenResult();
        if (initialToken.claims.role !== 'Admin') {
            setProcessingMessage("Verifying Admin Role...");
            await setAdminClaim(firebaseUser.uid);
            // CRITICAL: Force a refresh of the token on the client to get the new claim.
            // This is the blocking step that ensures the role is present before proceeding.
            await firebaseUser.getIdToken(true); 
        }
    }
  };
  
  const handleLogin = async (e?: React.FormEvent, isRefresh: boolean = false) => {
    if (e) e.preventDefault();
    if (!auth) return;
    
    setIsProcessing(true);
    let userCredential;

    // On a refresh, the user is already available from the hook.
    if(isRefresh && user) {
        userCredential = { user };
    } else {
        setProcessingMessage('Logging in...');
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            try {
              toast({ title: "User not found. Creating new account...", description: "This may take a moment..." });
              setProcessingMessage('Creating Account...');
              userCredential = await createUserWithEmailAndPassword(auth, email, password);
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

    try {
        setProcessingMessage("Finalizing setup...");
        // Await the entire setup process. Navigation will not happen until this is done.
        if (userCredential?.user) {
            await handleUserSetup(userCredential.user);
            toast({ title: "Setup Complete", description: "Redirecting to dashboard..." });
            // Signal that setup is complete, allowing the useEffect to navigate.
            setIsSetupComplete(true);
        }
    } catch(setupError: any) {
        toast({
          variant: "destructive",
          title: "Setup Error",
          description: setupError.message,
        });
        setIsProcessing(false);
    }
  };
  
  // This state is for when the user is not logged in yet, and we're waiting for the hook to confirm that.
  if (isUserLoading || (user && !isSetupComplete)) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p>{processingMessage}</p>
        </div>
      )
  }
  
  if (user && isSetupComplete) {
      // The useEffect will handle the redirect, show a message while it happens.
      return <div className="flex min-h-screen items-center justify-center"><p>Redirecting to dashboard...</p></div>;
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
