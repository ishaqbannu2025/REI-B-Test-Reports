import { TestReport, UserProfile as User } from './types';

// This data is now used as a fallback or for type reference, 
// as live data is fetched from Firebase.
export const users: User[] = [
  // Removed admin@example.gov user
  {
    id: '2',
    displayName: 'Data Entry User',
    email: 'data@example.gov',
    role: 'Data Entry User',
    photoURL: 'https://i.pravatar.cc/150?u=data@example.gov',
  },
];

export const testReports: TestReport[] = [];
