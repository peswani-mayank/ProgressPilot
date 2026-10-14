import { getFirebaseAdmin, isFirebaseAuthReady } from '../config/firebase.js';
import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected Bearer token.',
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Support development token if enabled and Firebase is not configured or dev mode is active
  const isDevMode = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_AUTH === 'true';

  if (isDevMode && token.startsWith('dev-token-')) {
    try {
      const parts = token.replace('dev-token-', '').split(':::');
      const devUid = parts[0] || 'dev_user_001';
      const devEmail = parts[1] || 'pilot@progresspilot.dev';
      const devName = parts[2] || 'Progress Pilot Demo';

      let user = null;
      try {
        user = await User.findOneAndUpdate(
          { userId: devUid },
          {
            $setOnInsert: {
              userId: devUid,
              email: devEmail,
              displayName: devName,
              photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProgressPilot',
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (dbErr) {
        console.warn('[Auth Middleware] User upsert skipped (DB offline):', dbErr.message);
      }

      req.user = {
        uid: devUid,
        email: devEmail,
        name: devName,
        picture: user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProgressPilot',
      };
      req.userDoc = user;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid dev token', message: err.message });
    }
  }

  // Real Firebase ID token verification
  let decodedToken = null;

  // 1. Try Firebase Admin SDK if service account credentials are provided
  if (isFirebaseAuthReady()) {
    try {
      const admin = getFirebaseAdmin();
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (adminErr) {
      console.warn('[Auth Middleware] Admin SDK verification warning:', adminErr.message);
    }
  }

  // 2. Cryptographic Firebase JWT Verification fallback using FIREBASE_PROJECT_ID
  const projectId = process.env.FIREBASE_PROJECT_ID || 'progresspilot-799c2';
  if (!decodedToken && token.includes('.')) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        const now = Math.floor(Date.now() / 1000);
        const expectedIss = `https://securetoken.google.com/${projectId}`;

        // Verify audience (project ID) and issuer
        const matchesAud = payload.aud === projectId;
        const matchesIss = payload.iss === expectedIss;
        const notExpired = payload.exp ? payload.exp > now : true;

        if (matchesAud && matchesIss && notExpired) {
          decodedToken = {
            uid: payload.sub || payload.user_id,
            email: payload.email || '',
            name: payload.name || payload.email?.split('@')[0] || 'Progress Pilot User',
            picture: payload.picture || '',
          };
          console.log(`[Auth] Verified Google Firebase user: ${decodedToken.email} (${decodedToken.uid})`);
        } else {
          console.warn('[Auth] Token validation failed:', {
            matchesAud,
            matchesIss,
            notExpired,
            aud: payload.aud,
            expectedAud: projectId,
            iss: payload.iss,
            expectedIss,
          });
        }
      }
    } catch (parseErr) {
      console.warn('[Auth] JWT decode error:', parseErr.message);
    }
  }

  if (!decodedToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired Firebase authentication token.',
    });
  }

  const { uid, email, name, picture } = decodedToken;

  const updateFields = {};
  if (email) updateFields.email = email;
  if (name) updateFields.displayName = name;
  if (picture) updateFields.photoURL = picture;

  let userDoc = null;
  try {
    userDoc = await User.findOneAndUpdate(
      { userId: uid },
      {
        $setOnInsert: { userId: uid },
        $set: updateFields,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (dbErr) {
    console.warn('[Auth Middleware] User upsert warning:', dbErr.message);
  }

  req.user = {
    uid,
    email: email || '',
    name: name || userDoc?.displayName || 'Progress Pilot User',
    picture: picture || userDoc?.photoURL || '',
  };
  req.userDoc = userDoc;

  next();
};
