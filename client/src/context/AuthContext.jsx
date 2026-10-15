import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebase.js';
import { setAuthToken } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load existing session on boot
  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Check if real Firebase is configured
      if (isFirebaseConfigured && auth) {
        // Check for redirect sign-in result (if user was redirected from Google)
        try {
          const redirectResult = await getRedirectResult(auth);
          if (redirectResult && redirectResult.user) {
            const idToken = await redirectResult.user.getIdToken();
            setToken(idToken);
            setAuthToken(idToken);
            localStorage.setItem('progresspilot_token', idToken);
            localStorage.setItem('progresspilot_auth_type', 'firebase');

            setUser({
              uid: redirectResult.user.uid,
              email: redirectResult.user.email,
              displayName: redirectResult.user.displayName || 'Progress Pilot User',
              photoURL: redirectResult.user.photoURL || '',
            });
          }
        } catch (redirectErr) {
          console.warn('Redirect sign-in check notice:', redirectErr);
        }

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            try {
              const idToken = await fbUser.getIdToken();
              setToken(idToken);
              setAuthToken(idToken);
              localStorage.setItem('progresspilot_token', idToken);
              localStorage.setItem('progresspilot_auth_type', 'firebase');

              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName || 'Progress Pilot User',
                photoURL: fbUser.photoURL || '',
              });
            } catch (err) {
              console.error('Error obtaining Firebase token:', err);
              setUser(null);
              setToken(null);
            }
          } else {
            // Check if there was a dev token saved
            const savedType = localStorage.getItem('progresspilot_auth_type');
            const savedToken = localStorage.getItem('progresspilot_token');
            const savedUser = localStorage.getItem('progresspilot_dev_user');

            if (savedType === 'dev' && savedToken && savedUser) {
              try {
                const parsedUser = JSON.parse(savedUser);
                setToken(savedToken);
                setAuthToken(savedToken);
                setUser(parsedUser);
              } catch (e) {
                localStorage.removeItem('progresspilot_token');
              }
            } else {
              setUser(null);
              setToken(null);
              setAuthToken(null);
            }
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } else {
        // Firebase not configured: restore dev session if present
        const savedToken = localStorage.getItem('progresspilot_token');
        const savedUser = localStorage.getItem('progresspilot_dev_user');
        if (savedToken && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setToken(savedToken);
            setAuthToken(savedToken);
            setUser(parsedUser);
          } catch (e) {
            localStorage.removeItem('progresspilot_token');
          }
        }
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const loginWithGoogle = async (preferRedirect = false) => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error('Firebase configuration missing. Please add Firebase keys to client/.env');
    }

    setLoading(true);
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });

      // Direct redirect requested
      if (preferRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      try {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();

        setToken(idToken);
        setAuthToken(idToken);
        localStorage.setItem('progresspilot_token', idToken);
        localStorage.setItem('progresspilot_auth_type', 'firebase');

        const userData = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || 'Progress Pilot User',
          photoURL: result.user.photoURL || '',
        };

        setUser(userData);
        return userData;
      } catch (popupErr) {
        // If the browser blocks popup windows, automatically fall back to signInWithRedirect
        if (popupErr.code === 'auth/popup-blocked' || popupErr.message?.includes('popup-blocked')) {
          console.warn('Google sign-in popup blocked by browser. Attempting full page redirect...');
          try {
            await signInWithRedirect(auth, googleProvider);
            return;
          } catch (redirectErr) {
            throw popupErr; // throw original popup error if redirect also fails
          }
        }
        throw popupErr;
      }
    } catch (err) {
      console.error('Firebase Google sign-in failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithDevAccount = async (devProfile = {}) => {
    setLoading(true);
    try {
      const uid = devProfile.uid || 'dev_pilot_99';
      const email = devProfile.email || 'pilot@progresspilot.dev';
      const displayName = devProfile.displayName || 'Alex Mercer (Demo Pilot)';
      const photoURL = devProfile.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';

      const devToken = `dev-token-${uid}:::${email}:::${displayName}`;

      setToken(devToken);
      setAuthToken(devToken);
      localStorage.setItem('progresspilot_token', devToken);
      localStorage.setItem('progresspilot_auth_type', 'dev');

      const userData = { uid, email, displayName, photoURL };
      localStorage.setItem('progresspilot_dev_user', JSON.stringify(userData));

      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await fbSignOut(auth).catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      setAuthToken(null);
      localStorage.removeItem('progresspilot_token');
      localStorage.removeItem('progresspilot_auth_type');
      localStorage.removeItem('progresspilot_dev_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isFirebaseConfigured,
        loginWithGoogle,
        loginWithDevAccount,
        logout,
        isAuthenticated: Boolean(user && token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
