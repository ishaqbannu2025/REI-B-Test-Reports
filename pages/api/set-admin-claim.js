
import { getAdminApp } from './admin-init'; // Use the centralized admin app initializer

export default async function handler(req, res) {
  const adminApp = getAdminApp(); // Get the initialized admin app
  if (!adminApp) {
    console.error('CRITICAL: Firebase Admin App is not initialized in set-admin-claim.');
    return res.status(500).json({ error: 'Firebase Admin not initialized.' });
  }

  const adminAuth = adminApp.auth();

  const SECRET_API_KEY = process.env.YOUR_CUSTOM_ADMIN_SECRET;
  if (!SECRET_API_KEY || req.headers['x-api-key'] !== SECRET_API_KEY) {
    console.warn('Unauthorized attempt to set admin claim.');
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key.' });
  }

  if (req.method === 'POST') {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required in the request body.' });
    }
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      const uid = userRecord.uid;
      await adminAuth.setCustomUserClaims(uid, { role: 'Admin' });
      await adminAuth.revokeRefreshTokens(uid);
      res.status(200).json({
        message: `Successfully set 'Admin' role for user ${email} (UID: ${uid}).`,
        note: "User's token revoked to apply claims immediately. They might need to re-authenticate.",
      });
    } catch (error) {
      console.error('Error setting custom claim:', error.message);
      res.status(500).json({
        error: 'Failed to set custom claim.',
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
