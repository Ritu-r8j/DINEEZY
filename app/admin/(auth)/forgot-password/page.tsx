'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import AuthPageLayout from '@/app/(components)/auth/AuthPageLayout';
import Link from 'next/link';

const inputClasses = (hasError?: boolean) =>
  [
    'relative block w-full rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2',
    hasError
      ? 'border-black/25 focus:ring-[#4b5563] focus:border-[#4b5563] dark:border-white/40'
      : 'border-black/10 bg-white/80 focus:border-[#141414] focus:ring-[#141414] dark:border-white/10 dark:bg-white/5',
    'placeholder:text-black/40 text-[#141414] dark:text-white',
  ].join(' ');

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState({
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Password reset request failed:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const baseSubtitle = (
    <>
      Enter the email associated with your admin account and we’ll send password reset instructions. Need to jump
      back?{' '}
      <Link
        href="/admin/login"
        className="font-semibold text-[#141414] underline-offset-4 transition hover:underline dark:text-white"
      >
        Return to sign in
      </Link>
      .
    </>
  );

  if (isSubmitted) {
    return (
      <AuthPageLayout
        title="Check your inbox"
        subtitle={
          <>
            We’ve sent a secure link to{' '}
            <span className="font-semibold text-[#141414] dark:text-white">{formData.email}</span>. Follow the
            instructions inside to finish resetting your password.
          </>
        }
        helperLink={{ label: 'Back to sign in', href: '/admin/login' }}
        showHeader={false}
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:bg-green-500/15 dark:text-green-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-3 text-sm text-[#4b5563] dark:text-white/70">
            <p>Didn’t get the email within a few minutes? Check your spam folder or request another link.</p>
            <p>
              Still stuck? Contact support at{' '}
              <a
                href="mailto:support@dineease.com"
                className="font-semibold text-[#141414] underline-offset-4 transition hover:underline dark:text-white"
              >
                support@dineease.com
              </a>
              .
            </p>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title="Reset your password"
      subtitle={baseSubtitle}
      helperLink={{ label: 'Prefer SMS? Continue with WhatsApp OTP', href: '/admin/phone-login' }}
      showHeader={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="flex items-start gap-2 rounded-xl border border-black/10 bg-black/5 p-4 text-sm text-[#4b5563] dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-semibold text-[#141414] dark:text-white" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@dineease.com"
              className={`${inputClasses(Boolean(errors.email))} pl-11`}
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1 text-xs font-medium text-[#4b5563] dark:text-white/70">
              <AlertCircle className="h-3 w-3" />
              {errors.email}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#141414] py-3 text-sm font-semibold text-white shadow-lg shadow-[#141414]/20 transition hover:bg-[#141414]/90 focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-[#141414] dark:shadow-black/20"
        >
          {isLoading ? (
            <>
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white dark:border-[#141414]/40 dark:border-t-[#141414]" />
              Sending reset link...
            </>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>
    </AuthPageLayout>
  );
}
