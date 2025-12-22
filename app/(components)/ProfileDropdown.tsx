'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { User, LogOut, ShoppingBag, Calendar, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

interface ProfileDropdownProps {
  className?: string;
}

export default function ProfileDropdown({ className = "" }: ProfileDropdownProps) {
  const { user, userProfile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!user) return null;

  const getUserInitials = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName.charAt(0).toUpperCase();
    }
    if (user.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (userProfile?.email) {
      return userProfile.email.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserName = () => {
    if (userProfile?.displayName) return userProfile.displayName;
    if (user.displayName) return user.displayName;
    if (userProfile?.email) return userProfile.email;
    if (user.email) return user.email;
    return 'User';
  };

  const getProfileImage = () => {
    // First check if user has a profile image from database (photoURL field)
    if (userProfile?.photoURL) {
      return userProfile.photoURL;
    }
    
    // Then check Firebase user's photoURL (for Google users)
    if (user.photoURL) {
      return user.photoURL;
    }
    
    return null;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 items-center justify-center cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-primary/20"
        aria-label="Open profile menu"
      >
        <span className="text-xs sm:text-sm font-medium text-primary">
          {getUserInitials()}
        </span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-72 z-50"
          >
            <div className="bg-white/95 dark:bg-background/70 rounded-xl shadow-lg border border-gray-200 dark:border-foreground/5 backdrop-blur-md py-2 dark:hover:border-primary/20 transition-all duration-300">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {getUserInitials()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {getUserName()}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {userProfile?.email || user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <motion.div
                className="py-2"
                initial="closed"
                animate="open"
                exit="closed"
                variants={{
                  open: {
                    transition: {
                      staggerChildren: 0.08,
                      delayChildren: 0.05
                    }
                  },
                  closed: {
                    transition: {
                      staggerChildren: 0.05,
                      staggerDirection: -1
                    }
                  }
                }}
              >
                <motion.div variants={{
                  open: { opacity: 1, y: 0, scale: 1 },
                  closed: { opacity: 0, y: -10, scale: 0.95 }
                }} transition={{ duration: 0.3, ease: "easeOut" }}>
                  <Link
                    href="/user/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200  text-muted-foreground hover:text-foreground"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </motion.div>

                <motion.div variants={{
                  open: { opacity: 1, y: 0, scale: 1 },
                  closed: { opacity: 0, y: -10, scale: 0.95 }
                }} transition={{ duration: 0.3, ease: "easeOut" }}>
                  <Link
                    href="/user/orders"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200  text-muted-foreground hover:text-foreground"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    My Orders
                  </Link>
                </motion.div>

                <motion.div variants={{
                  open: { opacity: 1, y: 0, scale: 1 },
                  closed: { opacity: 0, y: -10, scale: 0.95 }
                }} transition={{ duration: 0.3, ease: "easeOut" }}>
                  <Link
                    href="/user/my-reservations"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200  text-muted-foreground hover:text-foreground"
                  >
                    <Calendar className="w-4 h-4" />
                    Reservations
                  </Link>
                </motion.div>

                <motion.div variants={{
                  open: { opacity: 1, y: 0, scale: 1 },
                  closed: { opacity: 0, y: -10, scale: 0.95 }
                }} transition={{ duration: 0.3, ease: "easeOut" }}>
                  <div className="cursor-pointer flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200  text-muted-foreground  hover:text-foreground">
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4" />
                      <span>Theme</span>
                    </div>
                    <ThemeToggle
                        size="sm"
                        onClick={() => setIsOpen(false)}
                    />
                  </div>
                </motion.div>

                <motion.div variants={{
                  open: { opacity: 1, y: 0, scale: 1 },
                  closed: { opacity: 0, y: -10, scale: 0.95 }
                }} transition={{ duration: 0.3, ease: "easeOut" }}>
                  <Link
                    href="/user/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200  text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </motion.div>
              </motion.div>

              {/* Logout Button */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: 0.35 }}
                >
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200  text-destructive cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}