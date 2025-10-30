'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { sendPhoneOTP, verifyPhoneOTP, completePhoneUserProfile } from '@/app/(utils)/firebaseOperations';
import { toast } from 'sonner';
import { Loader2, Phone, MessageSquare, ArrowLeft, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import AuthPageLayout from '@/app/(components)/auth/AuthPageLayout';
import Link from 'next/link';

const inputClasses = (hasError?: boolean) =>
  [
    "relative block w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1",
    hasError
      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200 dark:border-red-600 dark:bg-red-900/20 dark:focus:border-red-400 dark:focus:ring-red-800"
      : "border-gray-200 bg-white focus:border-gray-900 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-gray-300 dark:focus:ring-gray-700",
    "placeholder:text-gray-400 text-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500",
  ].join(" ");

export default function PhoneLoginPage() {
  const router = useRouter();
  const { loginWithPhone } = useAuth();
  
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await sendPhoneOTP(phoneNumber);
      
      if (result.success) {
        toast.success('OTP sent successfully!');
        setStep('otp');
      } else {
        setError(result.error || 'Failed to send OTP');
        toast.error(result.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      setError('An error occurred. Please try again.');
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyPhoneOTP(phoneNumber, otp);
      
      if (result.success && result.user) {
        // Check if user profile is complete
        if (!result.user.displayName) {
          // New user, needs to complete profile
          setStep('profile');
        } else {
          // Existing user, login successful
          loginWithPhone(result.user);
          toast.success('Login successful!');
          router.push('/user/menu');
        }
      } else {
        setError(result.error || 'Invalid OTP');
        toast.error(result.error || 'Invalid OTP');
      }
    } catch (error: any) {
      setError('An error occurred. Please try again.');
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await completePhoneUserProfile(phoneNumber, {
        displayName: displayName.trim(),
        email: email.trim() || undefined
      });
      
      if (result.success && result.user) {
        loginWithPhone(result.user);
        toast.success('Profile completed successfully!');
        router.push('/user');
      } else {
        setError(result.error || 'Failed to complete profile');
        toast.error(result.error || 'Failed to complete profile');
      }
    } catch (error: any) {
      setError('An error occurred. Please try again.');
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
    } else if (step === 'profile') {
      setStep('otp');
      setDisplayName('');
      setEmail('');
    } else {
      router.push('/user/login');
    }
    setError('');
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,5})(\d{0,5})$/);
    if (match) {
      return !match[2] ? match[1] : `${match[1]} ${match[2]}`;
    }
    return value;
  };

  const getTitle = () => {
    switch (step) {
      case 'phone': return 'Phone Login';
      case 'otp': return 'Verify OTP';
      case 'profile': return 'Complete Profile';
      default: return 'Phone Login';
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'phone': return (
        <>
          Enter your phone number to get started. Already have an account?{" "}
          <Link
            href="/user/login"
            className="font-semibold text-gray-900 underline-offset-4 transition hover:underline dark:text-gray-100"
          >
            Sign in with email
          </Link>
          .
        </>
      );
      case 'otp': return `Enter the OTP sent to your WhatsApp (+91 ${formatPhoneNumber(phoneNumber)})`;
      case 'profile': return 'Complete your profile to continue';
      default: return '';
    }
  };

  const footer = (
    <div className="space-y-1">
      <p>
        Need help? Contact support at{" "}
        <a
          href="mailto:support@dineezy.com"
          className="font-semibold text-gray-900 underline-offset-4 transition hover:underline dark:text-gray-100"
        >
          support@dineezy.com
        </a>
        .
      </p>
    </div>
  );

  return (
    <AuthPageLayout 
      title={getTitle()} 
      subtitle={getSubtitle()} 
      footer={footer}
      emblem={<img src="/logo.png" alt="Logo" className="invert w-16 h-16 object-cover" />}
    >
      <div className="space-y-6">
        {/* Back Button */}
        {step !== 'phone' && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Phone Number Step */}
        {step === 'phone' && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 dark:text-gray-100" htmlFor="phone">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" />
                <div className="absolute left-11 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-gray-400 pointer-events-none z-10">
                  +91
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={formatPhoneNumber(phoneNumber)}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  className={`${inputClasses(Boolean(error))} pl-20`}
                  maxLength={11}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                We'll send an OTP to this number via WhatsApp
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || phoneNumber.replace(/\D/g, '').length !== 10}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition-all duration-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-100 dark:text-gray-900 dark:shadow-gray-100/20 dark:hover:bg-gray-200 dark:focus:ring-gray-400"
            >
              {loading ? (
                <>
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white dark:border-gray-900/40 dark:border-t-gray-900" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 dark:text-gray-100" htmlFor="otp">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className={`${inputClasses(Boolean(error))} text-center text-lg font-mono tracking-widest`}
                maxLength={6}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter the 6-digit code sent via WhatsApp
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition-all duration-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-100 dark:text-gray-900 dark:shadow-gray-100/20 dark:hover:bg-gray-200 dark:focus:ring-gray-400"
            >
              {loading ? (
                <>
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white dark:border-gray-900/40 dark:border-t-gray-900" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify OTP
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSendOTP({ preventDefault: () => {} } as any)}
              disabled={loading}
              className="w-full py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Resend OTP
            </button>
          </form>
        )}

        {/* Profile Completion Step */}
        {step === 'profile' && (
          <form onSubmit={handleCompleteProfile} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 dark:text-gray-100" htmlFor="name">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                className={inputClasses(Boolean(error && !displayName.trim()))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 dark:text-gray-100" htmlFor="email">
                Email (Optional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={inputClasses()}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition-all duration-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-100 dark:text-gray-900 dark:shadow-gray-100/20 dark:hover:bg-gray-200 dark:focus:ring-gray-400"
            >
              {loading ? (
                <>
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white dark:border-gray-900/40 dark:border-t-gray-900" />
                  Completing...
                </>
              ) : (
                <>
                  Complete Profile
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </AuthPageLayout>
  );
}