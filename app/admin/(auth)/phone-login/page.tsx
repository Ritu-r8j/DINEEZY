'use client';

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  MessageCircle,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthPageLayout from "@/app/(components)/auth/AuthPageLayout";
import { useAuth } from "@/app/(contexts)/AuthContext";
import { createUserProfile, getUserProfile } from "@/app/(utils)/firebaseOperations";
import { generateOTP, sendOTP, verifyOTP } from "@/app/(utils)/whatsappApi";

const inputClasses = (hasError?: boolean) =>
  [
    "w-full rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2",
    hasError
      ? "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-500/60"
      : "border-black/10 bg-white/80 focus:border-[#141414] focus:ring-[#141414] dark:border-white/10 dark:bg-white/5",
    "placeholder:text-black/40 text-[#141414] dark:text-white",
  ].join(" ");

const stepCopy = {
  phone: {
    title: "Sign in with WhatsApp",
    subtitle: "Send a secure OTP to your phone number to access the admin tools.",
    emblem: <Phone className="h-6 w-6" />,
  },
  otp: {
    title: "Enter your verification code",
    subtitle: "We just sent a 6-digit code to your WhatsApp. It expires in 60 seconds.",
    emblem: <MessageCircle className="h-6 w-6" />,
  },
  profile: {
    title: "Complete your profile",
    subtitle: "Help us personalise your dashboard with a few quick details.",
    emblem: <User className="h-6 w-6" />,
  },
} as const;

type Step = keyof typeof stepCopy;

export default function PhoneLoginPage() {
  const router = useRouter();
  const { user, loading, handlePhoneAuth } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [formData, setFormData] = useState({
    phoneNumber: "",
    countryCode: "+91",
    otp: "",
    firstName: "",
    lastName: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpId, setOtpId] = useState<string>("");
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string>("");

  useEffect(() => {
    if (user && !loading) {
      router.push("/admin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(current => current - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      const formatted = value.replace(/\D/g, "");
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone.trim()) {
      setErrors(prev => ({ ...prev, phoneNumber: "Phone number is required" }));
      return false;
    }

    if (phone.length < 7 || phone.length > 15) {
      setErrors(prev => ({ ...prev, phoneNumber: "Please enter a valid phone number" }));
      return false;
    }

    if (!/^\d+$/.test(phone)) {
      setErrors(prev => ({ ...prev, phoneNumber: "Phone number should contain only digits" }));
      return false;
    }

    return true;
  };

  const validateOTP = (otp: string) => {
    if (!otp.trim()) {
      setErrors(prev => ({ ...prev, otp: "OTP is required" }));
      return false;
    }

    if (otp.length !== 6) {
      setErrors(prev => ({ ...prev, otp: "Please enter a 6-digit OTP" }));
      return false;
    }

    return true;
  };

  const validateProfile = () => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFullPhoneNumber = () => `${formData.countryCode}${formData.phoneNumber}`;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhoneNumber(formData.phoneNumber)) return;

    setIsLoading(true);
    setErrors({});

    try {
      const fullPhoneNumber = getFullPhoneNumber();
      const otp = generateOTP();
      const result = await sendOTP(fullPhoneNumber, otp);

      if (result.success) {
        setOtpId(result.data?.otpId || "");
        setStep("otp");
        setCountdown(60);
      } else {
        setErrors({ general: result.error || "Failed to send OTP. Please try again." });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateOTP(formData.otp)) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await verifyOTP(otpId, formData.otp);

      if (result.success && result.data) {
        const phoneNumber = result.data.phoneNumber;
        setVerifiedPhone(phoneNumber);

        const userProfileResult = await getUserProfile(phoneNumber);

        if (userProfileResult.success) {
          await handlePhoneAuth(phoneNumber, userProfileResult.data);
          setSuccess(true);
          setTimeout(() => {
            router.push("/admin");
          }, 1500);
        } else {
          setStep("profile");
        }
      } else {
        setErrors({ general: result.error || "Invalid OTP. Please try again." });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfile()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const userProfile = {
        uid: verifiedPhone,
        email: formData.email,
        displayName: `${formData.firstName} ${formData.lastName}`,
        phoneNumber: verifiedPhone,
        photoURL: "",
      };

      const result = await createUserProfile(userProfile);

      if (result.success) {
        await handlePhoneAuth(verifiedPhone, userProfile);
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin");
        }, 1500);
      } else {
        setErrors({ general: result.error || "Failed to create profile. Please try again." });
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setErrors({});

    try {
      const fullPhoneNumber = getFullPhoneNumber();
      const otp = generateOTP();
      const result = await sendOTP(fullPhoneNumber, otp);

      if (result.success) {
        setOtpId(result.data?.otpId || "");
        setCountdown(60);
      } else {
        setErrors({ general: result.error || "Failed to resend OTP. Please try again." });
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      setErrors({ general: "Failed to resend OTP. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setFormData(prev => ({ ...prev, otp: "" }));
    setErrors({});
    setCountdown(0);
  };

  const handleBackToOTP = () => {
    setStep("otp");
    setFormData(prev => ({ ...prev, firstName: "", lastName: "", email: "" }));
    setErrors({});
  };

  const { title, subtitle, emblem } = stepCopy[step];

  const footer = (
    <div className="space-y-1">
      <p>
        Prefer email access?{" "}
        <Link
          href="/admin/login"
          className="font-semibold text-[#141414] underline-offset-4 transition hover:underline dark:text-white"
        >
          Switch to password login
        </Link>
        .
      </p>
      <p>
        Secured by WhatsApp OTP infrastructure. Problems? Email{" "}
        <a
          href="mailto:support@dineease.com"
          className="font-semibold text-[#141414] underline-offset-4 transition hover:underline dark:text-white"
        >
          support@dineease.com
        </a>
        .
      </p>
    </div>
  );

  return (
    <AuthPageLayout
      title={title}
      subtitle={subtitle}
      helperLink={{ label: "Use password instead", href: "/admin/login" }}
      footer={footer}
      emblem={emblem}
      showHeader={false}
    >
      {errors.general && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50/80 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      {step === "phone" && (
        <form className="space-y-6" onSubmit={handleSendOTP}>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#141414] dark:text-white" htmlFor="phoneNumber">
              Phone number
            </label>
            <div className="flex gap-3">
              <div className="w-28">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  className="h-full w-full rounded-xl border border-black/10 bg-white/80 px-3 py-3 text-sm font-medium text-[#141414] transition focus:outline-none focus:ring-2 focus:ring-[#141414] dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <option value="+91">India +91</option>
                  <option value="+1">USA +1</option>
                  <option value="+44">UK +44</option>
                  <option value="+971">UAE +971</option>
                  <option value="+61">Australia +61</option>
                  <option value="+65">Singapore +65</option>
                  <option value="+81">Japan +81</option>
                  <option value="+33">France +33</option>
                  <option value="+49">Germany +49</option>
                  <option value="+55">Brazil +55</option>
                </select>
              </div>
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                  maxLength={15}
                  className={`${inputClasses(Boolean(errors.phoneNumber))} pl-11`}
                  autoComplete="tel"
                />
              </div>
            </div>
            {errors.phoneNumber && (
              <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="h-3 w-3" />
                {errors.phoneNumber}
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

      {step === "otp" && (
        <form className="space-y-6" onSubmit={handleVerifyOTP}>
          <button
            type="button"
            onClick={handleBackToPhone}
            className="flex items-center gap-2 text-sm font-semibold text-[#141414] underline-offset-4 transition hover:underline dark:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Edit phone number
          </button>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#141414] dark:text-white" htmlFor="otp">
              6-digit code
            </label>
            <div className="relative">
              <MessageCircle className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                value={formData.otp}
                onChange={handleInputChange}
                placeholder="Enter the code"
                maxLength={6}
                className={`${inputClasses(Boolean(errors.otp))} pl-11 tracking-[0.6em] text-center text-lg font-semibold`}
              />
            </div>
            {errors.otp && (
              <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="h-3 w-3" />
                {errors.otp}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-[#141414]/80 dark:text-white/80">
            <span>
              Didn't get it?{' '}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading || countdown > 0}
                className="font-semibold text-[#141414] underline-offset-4 transition hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
              >
                Resend code
              </button>
            </span>
            <span className="font-medium text-[#141414] dark:text-white">
              {countdown > 0 ? `00:${countdown.toString().padStart(2, "0")}` : "Ready"}
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#141414] py-3 text-sm font-semibold text-white shadow-lg shadow-[#141414]/20 transition hover:bg-[#141414]/90 focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-[#141414] dark:shadow-black/20"
          >
            {isLoading ? (
              <>
                <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white dark:border-[#141414]/40 dark:border-t-[#141414]" />
                Verifying...
              </>
            ) : (
              <>
                Verify code
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}

      {step === "profile" && (
        <form className="space-y-6" onSubmit={handleCreateProfile}>
          <button
            type="button"
            onClick={handleBackToOTP}
            className="flex items-center gap-2 text-sm font-semibold text-[#141414] underline-offset-4 transition hover:underline dark:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to verification
          </button>

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
                />
              </div>
              {errors.firstName && (
                <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {errors.firstName}
                </p>
              )}
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
                />
              </div>
              {errors.lastName && (
                <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {errors.lastName}
                </p>
              )}
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
              />
            </div>
            {errors.email && (
              <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
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
                Saving profile...
              </>
            ) : (
              <>
                Save & continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}

      {success && (
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Success! Redirecting to your dashboard...
        </div>
      )}
    </AuthPageLayout>
  );
}
