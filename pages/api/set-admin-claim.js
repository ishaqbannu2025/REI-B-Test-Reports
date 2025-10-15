import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    });
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

export default async function handler(req, res) {
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
      const userRecord = await admin.auth().getUserByEmail(email);
      const uid = userRecord.uid;
      await admin.auth().setCustomUserClaims(uid, { role: 'Admin' });
      await admin.auth().revokeRefreshTokens(uid);
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
