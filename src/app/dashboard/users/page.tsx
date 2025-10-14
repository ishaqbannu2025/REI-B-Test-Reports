'use client';
import { useEffect, useState } from 'react';
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import type { UserProfile } from '@/lib/types';
import { useFirebase, errorEmitter, FirestorePermissionError, useUser } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

export default function UsersPage() {
  const { firestore } = useFirebase();
  const { user: authUser } = useUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!authUser || !firestore) {
        setIsLoading(true);
        return;
      }
      
      setIsLoading(true);
      setError(null);

      try {
        const usersCollectionRef = collection(firestore, 'users');
        const q = query(usersCollectionRef);
        const querySnapshot = await getDocs(q);

        const fetchedUsers = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              uid: doc.id,
              displayName: data.displayName || data.email,
              email: data.email,
              role: data.role || 'Data Entry User',
              photoURL: data.photoURL || `https://i.pravatar.cc/150?u=${data.email}`,
            } as UserProfile;
          });
        setUsers(fetchedUsers);
      } catch (e: any) {
         setError("You don't have permission to view users.");
         const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: 'users',
        });
        errorEmitter.emit('permission-error', contextualError);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

  }, [authUser, firestore]);

  if (isLoading) {
    return <div>Loading user data...</div>;
  }
  
  if (error) {
      return <div className="text-destructive">{error}</div>
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
