import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  customerSession?: {
    uid: string;
    email: string;
    role: string;
    name?: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Support session token for email/password accounts in addition to Firebase ID tokens
  if (token.startsWith('dxn_sess_')) {
    try {
      const decoded = Buffer.from(token.replace('dxn_sess_', ''), 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      if (parsed && parsed.uid && parsed.email) {
        req.customerSession = parsed;
        req.user = {
          uid: parsed.uid,
          email: parsed.email,
          name: parsed.name || parsed.email.split('@')[0],
        } as unknown as DecodedIdToken;
        return next();
      }
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized: Malformed session token' });
    }
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
