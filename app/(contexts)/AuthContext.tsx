'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, logout } from '@/app/(utils)/firebase';
import {
  getUserProfile,
  UserData,
  getUserType
} from '@/app/(utils)/firebaseOperations';
import { useRouter } from 'next/navigation';
// import toast from 'react-hot-toast';
import { toast } from 'sonner';
import { OctagonXIcon } from 'lucide-react';

interface AuthContextType {
  user: (User & { userType?: 'user' | 'admin' }) | null;
  userProfile: UserData | null;
  loading: boolean;
  authReady: boolean; // New flag to indicate when all auth data is loaded
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  isAdmin: boolean;
  isUser: boolean;
  setUser: (user: (User & { userType?: 'user' | 'admin' }) | null) => void;
  loginWithPhone: (userData: UserData) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<(User & { userType?: 'user' | 'admin' }) | null>(null);
  const [userProfile, setUserProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false); // New state to track when all auth data is ready
  const [userType, setUserType] = useState<'user' | 'admin' | null>(null);
  const router = useRouter();

  const refreshUserData = async () => {
    if (user) {
      try {
        setAuthReady(false); // Reset auth ready state during refresh
        
        // Get user profile and user type in parallel
        const [userResult, userTypeResult] = await Promise.all([
          getUserProfile(user.uid),
          getUserType(user.uid)
        ]);

        if (userResult.success && userResult.data) {
          setUserProfile(userResult.data);

          // Update user object with latest data
          const updatedUser = {
            ...user,
            phoneNumber: userResult.data.phoneNumber || user.phoneNumber,
            userType: userTypeResult || 'user'
          };
          setUser(updatedUser);
        }

        // Set user type
        if (userTypeResult) {
          setUserType(userTypeResult);
        } else {
          setUserType('user'); // Default to user
        }

        setAuthReady(true); // Mark auth as ready after all data is loaded
      } catch (error) {
        console.error('Error refreshing user data:', error);
        setAuthReady(true); // Still mark as ready even if there's an error
      }
    }
  };

  const signOut = async () => {
    try {
      // Clear phone auth session if exists
      localStorage.removeItem('phoneAuthSession');

      // Only call Firebase logout if user is not a phone auth user
      if (user && !user.uid.startsWith('phone_')) {
        await logout();
      }

      setUser(null);
      setUserProfile(null);
      setUserType(null);
      setAuthReady(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Phone authentication login
  const loginWithPhone = (userData: UserData) => {
    const phoneUser = {
      uid: userData.uid,
      email: userData.email || '',
      displayName: userData.displayName || '',
      phoneNumber: userData.phoneNumber || '',
      photoURL: userData.photoURL || '',
      userType: userData.userType || 'user'
    } as User & { userType?: 'user' | 'admin' };

    setUser(phoneUser);
    setUserProfile(userData);
    setUserType(userData.userType || 'user');
    setAuthReady(true); // Mark as ready since we have all data

    // Store phone auth session
    localStorage.setItem('phoneAuthSession', JSON.stringify({
      user: phoneUser,
      userProfile: userData,
      timestamp: Date.now()
    }));
  };

  useEffect(() => {
    // Check for phone auth session first
    const checkPhoneAuthSession = () => {
      try {
        const phoneAuthData = localStorage.getItem('phoneAuthSession');
        if (phoneAuthData) {
          const { user: phoneUser, userProfile: phoneUserProfile, timestamp } = JSON.parse(phoneAuthData);

          // Check if session is still valid (24 hours)
          const isValid = Date.now() - timestamp < 24 * 60 * 60 * 1000;

          if (isValid) {
            setUser(phoneUser);
            setUserProfile(phoneUserProfile);
            setUserType(phoneUser.userType || 'user');
            setLoading(false);
            setAuthReady(true);
            return true;
          } else {
            // Clear expired session
            localStorage.removeItem('phoneAuthSession');
          }
        }
      } catch (error) {
        console.error('Error restoring phone auth session:', error);
        localStorage.removeItem('phoneAuthSession');
      }
      return false;
    };

    // Try to restore phone auth session first
    const phoneAuthRestored = checkPhoneAuthSession();

    if (!phoneAuthRestored) {
      // If no phone auth session, check Firebase auth
      const unsubscribe = onAuthStateChange(async (firebaseUser) => {
        setLoading(false);

        if (firebaseUser) {
          try {
            setAuthReady(false); // Reset auth ready state
            
            // Get user profile and user type in parallel
            const [userResult, userTypeResult] = await Promise.all([
              getUserProfile(firebaseUser.uid),
              getUserType(firebaseUser.uid)
            ]);

            let enhancedUser = firebaseUser as User & { userType?: 'user' | 'admin' };
            
            if (userResult.success && userResult.data) {
              setUserProfile(userResult.data);
              // Enhance Firebase user with phone number from profile
              enhancedUser = {
                ...firebaseUser,
                phoneNumber: userResult.data.phoneNumber || firebaseUser.phoneNumber,
                userType: userTypeResult || 'user'
              } as User & { userType?: 'user' | 'admin' };
            } else {
              // If no profile data, set default user type
              enhancedUser.userType = userTypeResult || 'user';
            }

            setUser(enhancedUser);
            setUserType(userTypeResult || 'user');
            setAuthReady(true); // Mark as ready after all data is loaded
          } catch (error) {
            console.error('Error loading user data:', error);
            // Fallback to Firebase user if profile loading fails
            const fallbackUser = {
              ...firebaseUser,
              userType: 'user'
            } as User & { userType?: 'user' | 'admin' };
            setUser(fallbackUser);
            setUserType('user');
            setAuthReady(true);
          }
        } else {
          setUser(null);
          setUserProfile(null);
          setUserType(null);
          setAuthReady(true); // Mark as ready even when no user
        }
      });

      return () => unsubscribe();
    }
  }, []);

  // State for user type
  // Removed separate userType state and useEffect since it's now handled in the main auth flow

  useEffect(() => {
    if (user && !loading && userProfile && authReady) {
      // Add a small delay to ensure userProfile is fully loaded
      const timeoutId = setTimeout(() => {
        // Check phone number from enhanced user object (which includes Firestore phone number)
        const hasPhoneNumber = user.phoneNumber;

        if (!hasPhoneNumber) {
          toast.error("Please add your phone number", {
            icon: <OctagonXIcon color="red" className="size-5" />,
            position: "top-right"
          });
          router.push('/user/profile');
        }
      }, 2500); // 2.5s delay to ensure data is loaded

      return () => clearTimeout(timeoutId);
    }
  }, [user, userProfile, loading, authReady, router]);

  const isAdmin = userType === 'admin';
  const isUser = userType === 'user';

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    authReady,
    signOut,
    refreshUserData,
    isAdmin,
    isUser,
    setUser,
    loginWithPhone
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
