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
import { useFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [email, setEmail] = useState('admin@example.gov');
  const [password, setPassword] = useState('Innovation123');

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const setAdminClaim = async (uid: string) => {
    // This function will call our API route to set a custom claim.
    await fetch('/api/set-admin-claim', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ uid }),
    });
  };

  const handleUserSetup = async (firebaseUser: FirebaseUser) => {
    if (!firestore) return;
  
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
  
    try {
      const userDoc = await getDoc(userDocRef);
      let shouldSetAdminClaim = false;
      let isNewUser = !userDoc.exists();
  
      if (isNewUser) {
        const adminEmails = ['admin@example.gov', 'm.ishaqbannu@gmail.com'];
        const isInitialAdmin = adminEmails.includes(firebaseUser.email || '');
  
        const newUserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          photoURL: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.email}`,
          role: isInitialAdmin ? 'Admin' : 'Data Entry User',
        };
  
        await setDoc(userDocRef, newUserProfile).catch(error => {
          const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: userDocRef.path,
            requestResourceData: newUserProfile,
          });
          errorEmitter.emit('permission-error', contextualError);
          throw contextualError;
        });
  
        if (isInitialAdmin) {
          shouldSetAdminClaim = true;
        }
      } else {
        // Existing user. Check if they should be an admin but don't have the claim.
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const userData = userDoc.data();
        if (userData.role === 'Admin' && idTokenResult.claims.role !== 'Admin') {
          shouldSetAdminClaim = true;
        }
      }
  
      // If an admin claim needs to be set (for new or existing user)
      if (shouldSetAdminClaim) {
        await setAdminClaim(firebaseUser.uid);
        // CRITICAL: Force a refresh of the token to get the new claim immediately.
        await firebaseUser.getIdToken(true);
      }
  
    } catch(error) {
      if (error instanceof FirestorePermissionError) {
        throw error;
      }
      const contextualError = new FirestorePermissionError({
        operation: 'get',
        path: userDocRef.path,
      });
      errorEmitter.emit('permission-error', contextualError);
      throw contextualError;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleUserSetup(userCredential.user);
    } catch (error: any) {
      if (error instanceof FirestorePermissionError) {
        return;
      }

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        try {
          const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
          await handleUserSetup(newUserCredential.user);
        } catch (createError: any) {
          if (createError instanceof FirestorePermissionError) {
            return;
          }
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
              Login
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
