'use client';
import { useEffect, useState } from 'react';
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { AddUserDialog } from './components/add-user-dialog';
import type { User } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function UsersPage() {
  const { firestore } = useFirebase();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    setIsLoading(true);
    const usersCollectionRef = collection(firestore, 'users');
    const q = query(usersCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.displayName || data.email, // fallback to email
          email: data.email,
          role: data.role || 'Data Entry User',
          avatarUrl: data.photoURL || `https://i.pravatar.cc/150?u=${data.email}`,
        }
      });
      setUsers(fetchedUsers);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);


  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div>
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">User Management</h1>
            <AddUserDialog />
        </div>
        <DataTable columns={columns} data={users} />
    </div>
  );
}
