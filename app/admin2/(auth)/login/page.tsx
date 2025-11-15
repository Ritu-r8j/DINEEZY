'use client';

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthPageLayout from "@/app/(components)/auth/AuthPageLayout";
import { useAuth } from "@/app/(contexts)/AuthContext";
import { signInWithEmail, signInWithGoogle } from "@/app/(utils)/firebase";
import { completeUserRegistration, getUserProfile, updateUserType } from "@/app/(utils)/firebaseOperations";

const inputClasses = (hasError?: boolean) =>
  [
    "relative block w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1",
    hasError
      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200 dark:border-red-600 dark:bg-red-900/20 dark:focus:border-red-400 dark:focus:ring-red-800"
      : "border-gray-200 bg-white focus:border-gray-900 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-gray-300 dark:focus:ring-gray-700",
    "placeholder:text-gray-400 text-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500",
  ].join(" ");

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && !loading) {
      // Check if user is already logged in as regular user
      if ((user as any).userType === 'user') {
        router.push("/user/menu");
        return;
      }
      
      // Set user type in database and redirect
      updateUserType(user.uid, 'admin');
      (user as any).userType = 'admin';
      router.push("/admin");
    }
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
      const result = await signInWithEmail(formData.email, formData.password);

      if (!result.success) {
        setErrors({ general: result.error || "Login failed. Please try again." });
      }
    } catch (error) {
      console.error("Login failed:", error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const result = await signInWithGoogle();

      if (result.success && result.user) {
        const userProfileResult = await getUserProfile(result.user.uid);

        if (!userProfileResult.success) {
          const displayName = result.user.displayName || "Google User";
          const nameParts = displayName.split(" ");
          const firstName = nameParts[0] || "Google";
          const lastName = nameParts.slice(1).join(" ") || "User";

          const registrationResult = await completeUserRegistration(result.user, {
            firstName,
            lastName,
            phone: result.user.phoneNumber || "",
          });

          if (!registrationResult.success) {
            setErrors({ general: "Failed to create user profile. Please try again." });
            return;
          }
        }
      } else {
        setErrors({ general: result.error || "Google login failed. Please try again." });
      }
    } catch (error) {
      console.error("Google login failed:", error);
      setErrors({ general: "Google login failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const subtitle = (
    <>
      Manage reservations, menus, and insights in minutes. New here?{" "}
      <Link
        href="/admin/register"
        className="font-semibold text-gray-900 underline-offset-4 transition hover:underline dark:text-gray-100"
      >
        Create an admin account
      </Link>
      .
      <br />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Looking to order food?{" "}
        <Link
          href="/user/login"
          className="font-semibold text-gray-900 underline-offset-4 transition hover:underline dark:text-gray-100"
        >
          Customer login
        </Link>
      </span>
    </>
  );

  const footer = (
    <div className="space-y-1">
      <p>
        Prefer phone access?{" "}
        <Link
          href="/admin/phone-login"
          className="font-semibold text-gray-900 underline-offset-4 transition hover:underline dark:text-gray-100"
        >
          Continue with WhatsApp OTP
        </Link>
        .
      </p>
      <p>
        Need help? Contact support at{" "}
        <a
          href="mailto:support@dineease.com"
          className="font-semibold text-gray-900 underline-offset-4 transition hover:underline dark:text-gray-100"
        >
          support@dineease.com
        </a>
        .
      </p>
    </div>
  );

  return (
    <AuthPageLayout title="Welcome back" subtitle={subtitle} footer={footer}>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {errors.general && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900 dark:text-gray-100" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" />
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
            <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
              <AlertCircle className="h-3 w-3" />
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900 dark:text-gray-100" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className={`${inputClasses(Boolean(errors.password))} pl-11 pr-12`}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
              <AlertCircle className="h-3 w-3" />
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-500 focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-gray-400"
            />
            Keep me signed in
          </label>
          <Link
            href="/admin/forgot-password"
            className="font-semibold text-gray-900 underline-offset-4 transition hover:underline dark:text-gray-100"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition-all duration-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-100 dark:text-gray-900 dark:shadow-gray-100/20 dark:hover:bg-gray-200 dark:focus:ring-gray-400"
        >
          {isLoading ? (
            <>
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white dark:border-gray-900/40 dark:border-t-gray-900" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500">
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" aria-hidden />
          <span className="font-semibold text-gray-500 dark:text-gray-400">Or continue with</span>
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" aria-hidden />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-900 transition-all duration-200 hover:border-gray-300 hover:shadow-md hover:shadow-gray-200/50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600 dark:hover:shadow-gray-800/50 dark:focus:ring-gray-400"
        >
          <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" viewBox="0 0 256 262" aria-hidden>
            <path
              fill="currentColor"
              d="M255.92 133.52c0-8.4-.74-16.52-2.14-24.34H130.5v46.1h70.44c-3.05 16.47-12.23 30.38-26.18 39.77v33.15h42.64c24.93-22.98 38.52-56.9 38.52-94.68"
            />
            <path
              fill="currentColor"
              d="M130.5 261.01c35.62 0 65.56-11.87 87.41-31.82l-42.64-33.15c-11.85 7.94-26.92 12.63-44.77 12.63-34.37 0-63.5-23.21-73.77-54.52H13.74v34.26c21.03 41.73 65.3 72.6 116.76 72.6"
            />
            <path
              fill="currentColor"
              d="M56.73 155.15c-2.67-7.93-4.17-16.42-4.17-25.15 0-8.72 1.5-17.21 4.17-25.15V70.29H13.74C4.89 87.7 0 107.66 0 130c0 22.34 4.89 42.3 13.74 59.71l43-34.56"
            />
            <path
              fill="currentColor"
              d="M130.5 50.59c19.37 0 36.77 6.65 50.6 19.71l37.83-37.83C195.85 12.11 166.12 0 130.5 0 79.04 0 34.77 30.86 13.74 72.59l43 34.56C67 73.8 96.13 50.59 130.5 50.59"
            />
          </svg>
          {isLoading ? "Signing in..." : "Continue with Google"}
        </button>
      </form>

      <div className="mt-6 hidden items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 opacity-0 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        Login successful! Redirecting...
      </div>
    </AuthPageLayout>
  );
}
