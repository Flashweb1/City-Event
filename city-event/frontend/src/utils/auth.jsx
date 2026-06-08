import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from './firebase';
import { authAPI } from './api';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Fetch the real user data (including role) from Postgres database
          const dbUser = await authAPI.getCurrentUser();
          setUser({
            id: dbUser.id,
            email: dbUser.email,
            fullName: dbUser.fullName || dbUser.full_name,
            role: dbUser.role,
            createdAt: dbUser.createdAt,
            emailVerified: currentUser.emailVerified
          });
        } catch (error) {
          // Fallback: use Firebase user data if backend is unreachable
          console.warn('Could not fetch user profile from backend:', error.message);
          setUser({
            id: currentUser.uid,
            email: currentUser.email,
            fullName: currentUser.displayName || currentUser.email.split('@')[0],
            role: 'student',
            emailVerified: currentUser.emailVerified
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (credentials) => {
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const setOrganizerRole = async () => {
    // Wait for auth state to propagate, then retry a few times
    const maxRetries = 5;
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        const { getAuth } = await import('firebase/auth');
        const currentUser = getAuth().currentUser;
        if (!currentUser) continue;
        const token = await currentUser.getIdToken(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role: 'organizer' })
        });
        if (res.ok) return;
      } catch (err) {
        console.warn(`Organizer role retry ${i + 1}/${maxRetries}:`, err.message);
      }
    }
  };

  const register = async (userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      await updateProfile(userCredential.user, { displayName: userData.fullName });
      sendEmailVerification(userCredential.user).catch(err => console.warn('Verification email error:', err));

      if (userData.role === 'organizer') {
        setOrganizerRole().catch(err => console.warn('Could not set organizer role:', err));
      }
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      throw new Error(error.message || 'Google sign-in failed');
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading }}>
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
