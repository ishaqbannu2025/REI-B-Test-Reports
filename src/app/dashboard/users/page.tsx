'use client';
import { useEffect, useState } from 'react';
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import type { UserProfile } from '@/lib/types';
import { useFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';

export default function UsersPage() {
  const { firestore, user: authUser } = useFirebase();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!authUser || !firestore) {
        setIsLoading(true);
        return;
      }
      
      setIsLoading(true);

      try {
        const idTokenResult = await authUser.getIdTokenResult(true);
        if (idTokenResult.claims.role !== 'Admin') {
            setIsAllowed(false);
            console.warn("User is not an admin. Access to users page denied.");
            const contextualError = new FirestorePermissionError({
              operation: 'list',
              path: 'users',
            });
            errorEmitter.emit('permission-error', contextualError);
        } else {
            setIsAllowed(true);
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
        }
      } catch (error) {
         setIsAllowed(false);
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
