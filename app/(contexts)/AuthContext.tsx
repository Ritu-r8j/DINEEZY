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
  const router = useRouter();

  const refreshUserData = async () => {
    if (user) {
      try {
        // Get user profile
        const userResult = await getUserProfile(user.uid);
        if (userResult.success && userResult.data) {
          setUserProfile(userResult.data);

          // Update user object with latest phone number from profile
          const updatedUser = {
            ...user,
            phoneNumber: userResult.data.phoneNumber || user.phoneNumber
          };
          setUser(updatedUser);
        }

        // Also refresh user type
        const userTypeResult = await getUserType(user.uid);
        if (userTypeResult) {
          setUserType(userTypeResult);
          (user as any).userType = userTypeResult;
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
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
            setLoading(false);
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
            // Get user profile
            const userResult = await getUserProfile(firebaseUser.uid);
            if (userResult.success && userResult.data) {
              setUserProfile(userResult.data);

              // Enhance Firebase user with phone number from profile
              const enhancedUser = {
                ...firebaseUser,
                phoneNumber: userResult.data.phoneNumber || firebaseUser.phoneNumber
              } as User & { userType?: 'user' | 'admin' };

              setUser(enhancedUser);
            } else {
              // If no profile data, use Firebase user as is
              setUser(firebaseUser);
            }
          } catch (error) {
            console.error('Error loading user data:', error);
            // Fallback to Firebase user if profile loading fails
            setUser(firebaseUser);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  // State for user type
  const [userType, setUserType] = useState<'user' | 'admin' | null>(null);

  // Fetch user type from database when user changes

  useEffect(() => {
    if (user && !loading && userProfile) {
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
  }, [user, userProfile, loading, router]);

  useEffect(() => {
    const fetchUserType = async () => {
      if (user) {
        try {
          const result = await getUserType(user.uid);
          if (result) {
            setUserType(result);
            // Also update the local user object
            (user as any).userType = result;
          } else {
            // Default to user if no userType is found
            setUserType('user');
            (user as any).userType = 'user';
          }
        } catch (error) {
          console.error('Error fetching user type:', error);
          setUserType('user');
          (user as any).userType = 'user';
        }
      } else {
        setUserType(null);
      }
    };

    fetchUserType();
  }, [user]);

  const isAdmin = userType === 'admin';
  const isUser = userType === 'user';

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
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
