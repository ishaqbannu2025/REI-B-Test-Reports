import { TestReport, User } from './types';

// This data is now used as a fallback or for type reference, 
// as live data is fetched from Firebase.
export const users: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.gov',
    role: 'Admin',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin@example.gov',
  },
  {
    id: '2',
    name: 'Data Entry User',
    email: 'data@example.gov',
    role: 'Data Entry User',
    avatarUrl: 'https://i.pravatar.cc/150?u=data@example.gov',
  },
];

export const testReports: TestReport[] = [];
