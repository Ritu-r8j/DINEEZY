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
import {toast} from 'sonner';
import { OctagonXIcon } from 'lucide-react';

interface AuthContextType {
  user: (User & { isPhoneAuth?: boolean; userType?: 'user' | 'admin' }) | null;
  userProfile: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  handlePhoneAuth: (phoneNumber: string, userData: any) => Promise<void>;
  isAdmin: boolean;
  isUser: boolean;
  setUser : (user: (User & { isPhoneAuth?: boolean }) | null) => void;
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
  const [user, setUser] = useState<(User & { isPhoneAuth?: boolean }) | null>(null);
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
          console.log(userResult.data);
          
          // If it's a phone auth user, update localStorage
          if (user.isPhoneAuth) {
            localStorage.setItem('phoneAuth', JSON.stringify({
              user: user,
              userProfile: userResult.data,
              timestamp: Date.now()
            }));
          }
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
      // Clear phone authentication data
      localStorage.removeItem('phoneAuth');
      
      // If it's a Firebase user, use Firebase logout
      if (user && !user.isPhoneAuth) {
        await logout();
      }
      
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check if phone session is still valid
  const isPhoneSessionValid = (timestamp: number) => {
    // Session valid for 24 hours
    return Date.now() - timestamp < 24 * 60 * 60 * 1000;
  };

  // Restore phone authentication from localStorage
  const restorePhoneAuth = () => {
    try {
      const phoneAuthData = localStorage.getItem('phoneAuth');
      if (phoneAuthData) {
        const { user: phoneUser, userProfile: phoneUserProfile, timestamp } = JSON.parse(phoneAuthData);
        
        // Check if the session is still valid
        if (isPhoneSessionValid(timestamp)) {
          setUser(phoneUser);
          setUserProfile(phoneUserProfile);
          setLoading(false);
          return true;
        } else {
          // Clear expired session
          localStorage.removeItem('phoneAuth');
        }
      }
    } catch (error) {
      console.error('Error restoring phone auth:', error);
      localStorage.removeItem('phoneAuth');
    }
    return false;
  };

  useEffect(() => {
    // First check for phone authentication
    const phoneAuthRestored = restorePhoneAuth();
    
    if (!phoneAuthRestored) {
      // If no phone auth, check Firebase authentication
      const unsubscribe = onAuthStateChange(async (user) => {
        setUser(user);
        setLoading(false);

        if (user) {
          try {
            // Get user profile
            const userResult = await getUserProfile(user.uid);
            if (userResult.success && userResult.data) {
              setUserProfile(userResult.data);
            }
          } catch (error) {
            console.error('Error loading user data:', error);
          }
        } else {
          setUserProfile(null);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  // Extend phone session when user is active
  const extendPhoneSession = () => {
    if (user && user.isPhoneAuth) {
      try {
        const phoneAuthData = localStorage.getItem('phoneAuth');
        if (phoneAuthData) {
          const { user: phoneUser, userProfile: phoneUserProfile } = JSON.parse(phoneAuthData);
          localStorage.setItem('phoneAuth', JSON.stringify({
            user: phoneUser,
            userProfile: phoneUserProfile,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('Error extending phone session:', error);
      }
    }
  };

  // Handle phone authentication (without Firebase Auth)
  const handlePhoneAuth = async (phoneNumber: string, userData: any) => {
    try {
      const phoneUser = { 
        uid: phoneNumber, 
        email: userData.email, 
        displayName: userData.displayName,
        phoneNumber: phoneNumber,
        isPhoneAuth: true,
        userType: userData.userType || 'user' // Set user type
      } as any;
      
      setUser(phoneUser);
      setUserProfile(userData);
      setLoading(false);
      
      // Store phone authentication data in localStorage for persistence
      localStorage.setItem('phoneAuth', JSON.stringify({
        user: phoneUser,
        userProfile: userData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error handling phone auth:', error);
    }
  };

  // Check session validity on page focus
  useEffect(() => {
    const handleFocus = () => {
      if (user && user.isPhoneAuth) {
        const phoneAuthData = localStorage.getItem('phoneAuth');
        if (phoneAuthData) {
          try {
            const { timestamp } = JSON.parse(phoneAuthData);
            if (!isPhoneSessionValid(timestamp)) {
              // Session expired, sign out
              signOut();
            }
          } catch (error) {
            console.error('Error checking session validity:', error);
            signOut();
          }
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  // Extend phone session every 30 minutes
  useEffect(() => {
    if (user && user.isPhoneAuth) {
      const interval = setInterval(extendPhoneSession, 30 * 60 * 1000); // 30 minutes
      return () => clearInterval(interval);
    }
  }, [user]);

  // State for user type
  const [userType, setUserType] = useState<'user' | 'admin' | null>(null);

  // Fetch user type from database when user changes

  useEffect(() => {
    if (user && !loading) {
      console.log(user)
      // Add a small delay to ensure userProfile is fully loaded
      const timeoutId = setTimeout(() => {
        // Check both user.phoneNumber and userProfile.phoneNumber
        const hasPhoneNumber = user.phoneNumber || userProfile?.phoneNumber;
        
        if (!hasPhoneNumber) {
          toast.error("Please add your phone number", {
            icon: <OctagonXIcon color="red" className="size-5" />,
            position: "top-right"
          });
        }
      }, 2500); // 500ms delay to ensure data is loaded

      return () => clearTimeout(timeoutId);
    }
  }, [user, userProfile, loading]);

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
    handlePhoneAuth,
    isAdmin,
    isUser,
    setUser
    
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
