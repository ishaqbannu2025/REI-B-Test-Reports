import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminApp } from './admin-init';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const adminApp = getAdminApp();
    if (!adminApp) return res.status(200).json({ admin: false, note: 'firebase-admin not initialized' });
    const projectId = adminApp?.options?.projectId || null;
    return res.status(200).json({ admin: true, projectId });
  } catch (err: any) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
