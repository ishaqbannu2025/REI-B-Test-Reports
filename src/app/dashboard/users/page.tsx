
'use client';
import { useEffect, useState } from 'react';
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import type { UserProfile } from '@/lib/types';
import { useFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';

export default function UsersPage() {
  const { firestore } = useFirebase();
  const { user: authUser } = useUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false);

  useEffect(() => {
    if (!authUser || !firestore) return;

    const checkAdminStatus = async () => {
        try {
            const idTokenResult = await authUser.getIdTokenResult();
            setIsAllowed(idTokenResult.claims.role === 'Admin');
        } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAllowed(false);
        } finally {
            setAuthCheckCompleted(true);
        }
    };

    checkAdminStatus();
  }, [authUser, firestore]);

  useEffect(() => {
    if (!authCheckCompleted || !firestore) {
        setIsLoading(false);
        return;
    };
    
    if(!isAllowed) {
        setUsers([]);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
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
      setIsLoading(false);
    }, (error) => {
      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path: usersCollectionRef.path,
      });
      errorEmitter.emit('permission-error', contextualError);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, isAllowed, authCheckCompleted]);


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
