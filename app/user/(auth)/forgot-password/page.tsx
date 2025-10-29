'use client';

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Mail,
} from "lucide-react";
import Link from "next/link";
import AuthPageLayout from "@/app/(components)/auth/AuthPageLayout";
// import { sendPasswordResetEmail } from "@/app/(utils)/firebase";

const inputClasses = (hasError?: boolean) =>
  [
    "relative block w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1",
    hasError
      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200 dark:border-red-600 dark:bg-red-900/20 dark:focus:border-red-400 dark:focus:ring-red-800"
      : "border-gray-200 bg-white focus:border-gray-900 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-gray-300 dark:focus:ring-gray-700",
    "placeholder:text-gray-400 text-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500",
  ].join(" ");

export default function UserForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // const result = await sendPasswordResetEmail(email);
      const result = { success: true, error: "" };
      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || "Failed to send reset email. Please try again.");
      }
    } catch (err) {
      console.error("Password reset failed:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const subtitle = (
    <>
      Enter your email address and we'll send you a link to reset your password.{" "}
      <Link
        href="/user/login"
        className="font-semibold text-gray-900 underline-offset-4 transition hover:underline dark:text-gray-100"
      >
        Back to login
      </Link>
      .
    </>
  );

  const footer = (
    <div className="space-y-1">
      <p>
        Remember your password?{" "}
        <Link
          href="/user/login"
          className="font-semibold text-gray-900 underline-offset-4 transition hover:underline dark:text-gray-100"
        >
          Sign in instead
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

  if (isSuccess) {
    return (
      <AuthPageLayout title="Check your email" subtitle={subtitle} footer={footer}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Password reset email sent successfully!</span>
          </div>

          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Check your inbox
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>

            <div className="space-y-3 text-xs text-gray-500 dark:text-gray-400">
              <p>• Check your spam folder if you don't see the email</p>
              <p>• The link will expire in 1 hour</p>
              <p>• You can request a new link if needed</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setIsSuccess(false);
                setEmail("");
              }}
              className="w-full rounded-lg border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              Send another email
            </button>
            
            <Link
              href="/user/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout title="Reset your password" subtitle={subtitle} footer={footer}>
      <form className="space-y-6" onSubmit={() => {}}>
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className={`${inputClasses(Boolean(error))} pl-11`}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition-all duration-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-100 dark:text-gray-900 dark:shadow-gray-100/20 dark:hover:bg-gray-200 dark:focus:ring-gray-400"
        >
          {isLoading ? (
            <>
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white dark:border-gray-900/40 dark:border-t-gray-900" />
              Sending reset link...
            </>
          ) : (
            "Send reset link"
          )}
        </button>
      </form>
    </AuthPageLayout>
  );
}