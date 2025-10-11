'use client';
import { useEffect, useState } from 'react';
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import type { UserProfile } from '@/lib/types';
import { useFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import type { User } from 'firebase/auth';

// Helper function to check for admin role using custom claims
const isAdminUser = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  try {
    const idTokenResult = await user.getIdTokenResult();
    // The 'admin' custom claim is set on the backend, not in client-side code.
    // This check will return true if the claim is present.
    return idTokenResult.claims.admin === true;
  } catch (error) {
    console.error("Error getting user token claims:", error);
    return false;
  }
};


export default function UsersPage() {
  const { firestore } = useFirebase();
  const { user: authUser } = useUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (!authUser) return;

    // Step 1: Check if the user is an admin based on their auth token claims.
    const checkAdminStatus = async () => {
        setIsLoading(true);
        const isAdmin = await isAdminUser(authUser);
        setIsAllowed(isAdmin);
        // We will stop loading here if user is not admin.
        if (!isAdmin) {
          setIsLoading(false);
        }
    };

    checkAdminStatus();
  }, [authUser]);

  useEffect(() => {
    // Step 2: If the user is not allowed, or services aren't ready, do nothing.
    if (!firestore || !isAllowed) {
        return;
    };

    // Step 3: If user is an admin, fetch all users from the 'users' collection.
    const usersCollectionRef = collection(firestore, 'users');
    const q = query(usersCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: doc.id,
          displayName: data.displayName || data.email,
          email: data.email,
          role: data.role || 'Data Entry User',
          photoURL: data.photoURL || `https://i.pravatar.cc/150?u=${data.email}`,
        }
      });
      setUsers(fetchedUsers as UserProfile[]);
      setIsLoading(false); // Done loading once data is fetched.
    }, (error) => {
      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path: usersCollectionRef.path,
      });
      errorEmitter.emit('permission-error', contextualError);
      setIsLoading(false);
    });

    return () => unsubscribe();
    // This effect depends on 'isAllowed'. It will only run AFTER the admin check is complete.
  }, [firestore, isAllowed]);


  if (isLoading) {
    return <div>Loading user data...</div>;
  }
  
  if (!isAllowed) {
      return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">User Management</h1>
            <p className="text-destructive">You do not have permission to view this page.</p>
        </div>
      )
  }

  return (
    <div>
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">User Management</h1>
        </div>
        <DataTable columns={columns} data={users} />
    </div>
  );
}
