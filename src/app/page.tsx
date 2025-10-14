
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

  // Effect to redirect the user if they are logged in and setup is complete.
  useEffect(() => {
    if (user && !isUserLoading && isSetupComplete) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, isSetupComplete, router]);

  // Effect to handle users who are already logged in (e.g., on page refresh).
  // It triggers the setup and role verification process.
  useEffect(() => {
    if (user && !isUserLoading && !isProcessing && !isSetupComplete) {
      // Don't use a loading screen message, just process in the background.
      setIsProcessing(true);
      handleUserSetup(user).then(() => {
        setIsSetupComplete(true);
        setIsProcessing(false);
      });
    }
  }, [user, isUserLoading, isSetupComplete, isProcessing]);
  
  const handleUserSetup = async (firebaseUser: FirebaseUser): Promise<void> => {
    if (!firestore) throw new Error("Firestore is not initialized.");
  
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const adminEmails = ['admin@example.gov', 'm.ishaqbannu@gmail.com'];
    const shouldBeAdmin = adminEmails.includes(firebaseUser.email || '');
    
    setProcessingMessage("Checking user profile...");
    const userDoc = await getDoc(userDocRef);
    
    // Create user profile if it doesn't exist
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

    // Force a token refresh to get the latest claims from the user profile,
    // which might have been set by a backend process after creation.
    setProcessingMessage("Verifying user role...");
    await firebaseUser.getIdToken(true);
    
    setProcessingMessage("Setup Complete.");
  };
  
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    setProcessingMessage('Logging in...');

    let currentUser: FirebaseUser | null = null;
    
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

    if (currentUser) {
        try {
            await handleUserSetup(currentUser);
            setIsSetupComplete(true); // This will trigger the useEffect to redirect.
        } catch(setupError: any) {
            toast({
              variant: "destructive",
              title: "Setup Error",
              description: setupError.message,
            });
            setIsProcessing(false); // Stop processing on error.
        }
    } else {
       setIsProcessing(false);
    }
  };
  
  // Display a loading message if Firebase is still determining the initial user state,
  // or if we are actively processing a login/setup.
  if (isUserLoading || isProcessing) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p>{processingMessage}</p>
        </div>
      )
  }
  
  // If the user is logged in and setup is complete, the useEffect will handle the redirect.
  // We can show a redirecting message in the meantime.
  if (user && isSetupComplete) {
      return <div className="flex min-h-screen items-center justify-center"><p>Redirecting to dashboard...</p></div>;
  }

  // Default state: user is not logged in, show the login form.
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
