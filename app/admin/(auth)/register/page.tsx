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
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthPageLayout from "@/app/(components)/auth/AuthPageLayout";
import { useAuth } from "@/app/(contexts)/AuthContext";
import { signUpWithEmail, signInWithGoogle } from "@/app/(utils)/firebase";
import { completeUserRegistration, getUserProfile, updateUserType } from "@/app/(utils)/firebaseOperations";

const inputClasses = (hasError?: boolean) =>
  [
    "w-full rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2",
    hasError
      ? "border-black/25 focus:ring-[#4b5563] focus:border-[#4b5563] dark:border-white/40"
      : "border-black/10 bg-white/80 focus:border-[#141414] focus:ring-[#141414] dark:border-white/10 dark:bg-white/5",
    "placeholder:text-black/40 text-[#141414] dark:text-white",
  ].join(" ");

export default function AdminRegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && !loading) {
      // Check if user is already logged in as regular user
      if ((user as any).userType === 'user') {
        router.push("/user");
        return;
      }
      
      // Set user type in database and redirect
      updateUserType(user.uid, 'admin');
      (user as any).userType = 'admin';
      router.push("/admin");
    }
  }, [user, loading, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s()-]{7,}$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
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
      const authResult = await signUpWithEmail(formData.email, formData.password);

      if (authResult.success && authResult.user) {
        const registrationResult = await completeUserRegistration(authResult.user, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        });

        if (!registrationResult.success) {
          setErrors({ general: registrationResult.error || "Failed to create user profile. Please try again." });
        }
      } else {
        setErrors({ general: authResult.error || "Registration failed. Please try again." });
      }
    } catch (error) {
      console.error("Registration failed:", error);
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
        setErrors({ general: result.error || "Google registration failed. Please try again." });
      }
    } catch (error) {
      console.error("Google registration failed:", error);
      setErrors({ general: "Google registration failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const subtitle = (
    <>
      Create an admin workspace for your restaurant. Already onboarded?{" "}
      <Link
        href="/admin/login"
        className="font-semibold text-[#141414] underline-offset-4 transition hover:underline dark:text-white"
      >
        Sign in instead
      </Link>
      .
      <br />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Looking to order food?{" "}
        <Link
          href="/user/register"
          className="font-semibold text-[#141414] underline-offset-4 transition hover:underline dark:text-white"
        >
          Customer registration
        </Link>
      </span>
    </>
  );

  const footer = (
    <div className="space-y-1">
      <p>
        By creating an account you agree to our Terms & Policies.
      </p>
      <p>
        Prefer a quick OTP setup?{" "}
        <Link
          href="/admin/phone-login"
          className="font-semibold text-[#141414] underline-offset-4 transition hover:underline dark:text-white"
        >
          Use phone login
        </Link>
        .
      </p>
    </div>
  );

  const renderError = (field: string) =>
    errors[field] && (
      <p className="flex items-center gap-1 text-xs font-medium text-[#4b5563] dark:text-white/70">
        <AlertCircle className="h-3 w-3" />
        {errors[field]}
      </p>
    );

  return (
    <AuthPageLayout title="Create your admin account" subtitle={subtitle} footer={footer}>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {errors.general && (
        <div className="flex items-start gap-2 rounded-xl border border-black/10 bg-black/5 p-4 text-sm text-[#4b5563] dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#141414] dark:text-white" htmlFor="firstName">
              First name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Ayesha"
                className={`${inputClasses(Boolean(errors.firstName))} pl-11`}
                autoComplete="given-name"
              />
            </div>
            {renderError("firstName")}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#141414] dark:text-white" htmlFor="lastName">
              Last name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Sharma"
                className={`${inputClasses(Boolean(errors.lastName))} pl-11`}
                autoComplete="family-name"
              />
            </div>
            {renderError("lastName")}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-[#141414] dark:text-white" htmlFor="email">
            Work email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@restaurant.com"
              className={`${inputClasses(Boolean(errors.email))} pl-11`}
              autoComplete="email"
            />
          </div>
          {renderError("email")}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-[#141414] dark:text-white" htmlFor="phone">
            Contact number
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+91 98765 43210"
              className={`${inputClasses(Boolean(errors.phone))} pl-11`}
              autoComplete="tel"
            />
          </div>
          {renderError("phone")}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#141414] dark:text-white" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                className={`${inputClasses(Boolean(errors.password))} pl-11 pr-12`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 transition hover:text-black/70 dark:text-white/50 dark:hover:text-white/80"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {renderError("password")}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#141414] dark:text-white" htmlFor="confirmPassword">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter password"
                className={`${inputClasses(Boolean(errors.confirmPassword))} pl-11 pr-12`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 transition hover:text-black/70 dark:text-white/50 dark:hover:text-white/80"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {renderError("confirmPassword")}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-[#141414]/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80">
          <div className="flex items-start gap-3">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className="mt-1 h-4 w-4 rounded-sm border border-transparent bg-white text-[#141414] accent-[#141414] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]/30 dark:border-transparent dark:bg-transparent dark:text-white dark:accent-white dark:focus-visible:ring-2 dark:focus-visible:ring-white/30"
            />
            <label htmlFor="agreeToTerms" className="block text-left text-sm">
              I agree to receive onboarding emails and product updates. I understand I can opt out anytime.
            </label>
          </div>
          {renderError("agreeToTerms")}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#141414] py-3 text-sm font-semibold text-white shadow-lg shadow-[#141414]/20 transition hover:bg-[#141414]/90 focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-[#141414] dark:shadow-black/20"
        >
          {isLoading ? (
            <>
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white dark:border-[#141414]/40 dark:border-t-[#141414]" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#141414]/40 dark:text-white/30">
          <span className="h-px flex-1 bg-[#141414]/10 dark:bg-white/10" aria-hidden />
          <span className="font-semibold text-[#141414]/60 dark:text-white/60">Or sign up with</span>
          <span className="h-px flex-1 bg-[#141414]/10 dark:bg-white/10" aria-hidden />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#141414]/15 bg-white/80 py-3 text-base font-semibold tracking-wide text-[#141414] transition hover:border-[#141414]/30 hover:shadow-lg hover:shadow-[#141414]/10 focus:outline-none focus:ring-2 focus:ring-[#141414]/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:border-white/30"
        >
          <svg className="h-5 w-5 text-[#141414] dark:text-white" viewBox="0 0 256 262" aria-hidden>
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
          {isLoading ? "Setting things up..." : "Continue with Google"}
        </button>
      </form>

      <div className="mt-6 hidden items-center gap-3 rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-700 opacity-0 dark:text-green-300">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        Account created! Redirecting...
      </div>
    </AuthPageLayout>
  );
}
