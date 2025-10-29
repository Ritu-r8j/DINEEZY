'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isReset, setIsReset] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      // In a real application, this would call your password reset API
      // For now, we'll simulate a successful reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsReset(true);
    } catch (error) {
      console.error('Password reset failed:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isReset) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-primary dark:text-background-light flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="flex justify-center items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center bg-primary text-background-light rounded-full">
                <span className="material-symbols-outlined text-2xl">
                  ramen_dining
                </span>
              </div>
              <h1 className="text-primary dark:text-white text-3xl font-bold">DineEase</h1>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-primary dark:text-white">
              Password Reset Successfully
            </h2>
          </div>
          
          <div className="mt-8 space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your password has been successfully reset.
              </p>
            </div>
            
            <div className="text-center">
              <Link href="/admin/login" className="font-medium text-primary dark:text-white hover:text-primary/80 dark:hover:text-white/80">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-primary dark:text-background-light flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center bg-primary text-background-light rounded-full">
              <span className="material-symbols-outlined text-2xl">
                ramen_dining
              </span>
            </div>
            <h1 className="text-primary dark:text-white text-3xl font-bold">DineEase</h1>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-primary dark:text-white">
            Create new password
          </h2>
          <p className="mt-2 text-center text-sm text-primary/70 dark:text-white/70">
            Your new password must be different from previous passwords
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Error Display */}
          {errors.general && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{errors.general}</p>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px flex flex-col gap-y-4">
            <div>
              <label className="sr-only" htmlFor="newPassword">New Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="New password"
                  className={`relative block w-full appearance-none rounded-md border border-gray-300 dark:border-primary/20 px-3 py-3 bg-transparent text-primary dark:text-white placeholder-primary/50 dark:placeholder-white/50 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm font-semibold pl-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label className="sr-only" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  className={`relative block w-full appearance-none rounded-md border border-gray-300 dark:border-primary/20 px-3 py-3 bg-transparent text-primary dark:text-white placeholder-primary/50 dark:placeholder-white/50 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm font-semibold pl-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary py-3 px-4 text-sm font-bold text-background-light hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-white dark:text-primary dark:hover:bg-white/90 dark:focus:ring-offset-background-dark shadow-md dark:shadow-sm shadow-primary/20 dark:shadow-white/10 transition-all duration-200 ease-in-out"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-background-light dark:border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <Link href="/admin/login" className="font-medium text-primary dark:text-white hover:text-primary/80 dark:hover:text-white/80">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}