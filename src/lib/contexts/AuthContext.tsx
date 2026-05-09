import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole } from '../../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check for existing demo session in session storage
    const savedDemo = sessionStorage.getItem('pe_demo_session');
    if (savedDemo) {
      const demoData = JSON.parse(savedDemo);
      setProfile(demoData.profile);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (isDemo) return; // Don't let Firebase Auth overwrite demo session

      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              id: user.uid,
              email: user.email || 'user@example.com',
              role: UserRole.ANALYST,
              displayName: user.displayName || 'User',
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemo]);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setIsDemo(false);
      sessionStorage.removeItem('pe_demo_session');
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInGuest = async () => {
    // Create a virtual session for Demo mode to bypass Firebase restrictions
    const demoProfile: UserProfile = {
      id: 'demo-user-id',
      email: 'guest@demo.local',
      role: UserRole.ANALYST,
      displayName: 'Гость (Demo)',
    };
    
    setIsDemo(true);
    setProfile(demoProfile);
    sessionStorage.setItem('pe_demo_session', JSON.stringify({ profile: demoProfile }));
  };

  const logout = async () => {
    setIsDemo(false);
    sessionStorage.removeItem('pe_demo_session');
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user: isDemo ? null : user, profile, loading, signIn, signInGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
