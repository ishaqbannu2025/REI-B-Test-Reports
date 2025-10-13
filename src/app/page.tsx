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
  
  // This effect will run when the user object is available after a successful login.
  // It redirects a fully authenticated and set-up user to the dashboard.
  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);


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
    
    // Create user profile in Firestore if it doesn't exist
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
    }
  
    // If the user should be an admin, ensure the claim is set and the token is refreshed.
    if (shouldBeAdmin) {
        const initialToken = await firebaseUser.getIdTokenResult();
        // Only set the claim if it's not already present.
        if (initialToken.claims.role !== 'Admin') {
            setProcessingMessage("Verifying Admin Role..."); // Update UI message
            await setAdminClaim(firebaseUser.uid);
            
            // CRITICAL: Force a refresh of the token on the client to get the new claim.
            // This ensures subsequent requests and security rules see the 'Admin' role.
            await firebaseUser.getIdToken(true); 
        }
    }
  };
  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsProcessing(true);
    setProcessingMessage('Logging in...');
    
    let userCredential;

    try {
      // First, try to sign in.
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // If sign-in fails because the user doesn't exist, create a new account.
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
        // Handle other login errors (e.g., network issues).
        toast({ variant: "destructive", title: "Login Error", description: error.message });
        setIsProcessing(false);
        return;
      }
    }

    // After a successful login/signup, run the setup process.
    try {
        toast({ title: "Login Successful", description: "Finalizing setup..." });
        await handleUserSetup(userCredential.user);
        // The useEffect hook will handle the redirect once the user state is updated.
        // No need to manually redirect here.
    } catch(setupError: any) {
        toast({
          variant: "destructive",
          title: "Setup Error",
          description: setupError.message,
        });
    } finally {
        // After setup is complete (or has failed), allow the user to try again if needed.
        setIsProcessing(false);
    }
  };
  
  if (isUserLoading && !user) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading Authentication...</p>
        </div>
      )
  }
  
  // While the user is logged in but the page is transitioning, show nothing to avoid flicker.
  if(user && !isUserLoading) {
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
