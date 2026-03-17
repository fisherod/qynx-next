"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import PageLayout from "@/components/PageLayout";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");
    if (refParam && refParam.trim() !== "") {
      setReferralCode(refParam.trim());
    }
  }, []);

  const validate = () => {
    const next: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Please enter a valid email address";
    }
    if (!password) {
      next.password = "Password is required";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, form: undefined }));
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          referer: referralCode?.trim() || "",
          name: name.trim() || undefined
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(prev => ({ ...prev, form: data.error ?? "Registration failed" }));
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/sign-in?registered=1"), 2000);
    } catch {
      setErrors(prev => ({
        ...prev,
        form: "Something went wrong. Try again."
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/user/dashboard" });
    } finally {
      setOauthLoading(null);
    }
  };

  const inputBase =
    "w-full px-4 py-3 rounded-xl bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/50 focus:border-[#A78BFA]/50 transition-colors border border-white/10";
  const inputError = "border-red-500/70 focus:ring-red-500/50";

  return (
    <PageLayout showFooter={false}>
      <section className="relative z-40 pt-40 sm:pt-48 pb-16 sm:pb-24 px-4 sm:px-6 min-h-[60vh] flex items-start justify-center">
        <div className="w-full max-w-[480px] rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 p-8 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">Sign up</h1>
          <p className="text-[#C8C8C8] text-sm mb-8">Create your Qynx account</p>
          {referralCode && (
            <p className="text-yellow-500 text-sm mb-4">
              Referral code: <span className="font-medium text-white/90">{referralCode}</span>
            </p>
          )}
          {success && (
            <div className="mb-6 py-3 px-4 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-sm text-center">
              Account created successfully. Redirecting to sign in…
            </div>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                placeholder="Your name"
                className={inputBase}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className={`${inputBase} ${errors.email ? inputError : ""}`}
              />
              {errors.email && <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                Password *
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`${inputBase} ${errors.password ? inputError : ""}`}
              />
              {errors.password && <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-white/90 mb-2">
                Confirm password *
              </label>
              <input
                id="confirm-password"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`${inputBase} ${errors.confirmPassword ? inputError : ""}`}
              />
              {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-400">{errors.confirmPassword}</p>}
            </div>
            {errors.form && <p className="text-sm text-red-400">{errors.form}</p>}
            <button
              type="submit"
              disabled={submitting || success}
              className="w-full py-3.5 rounded-xl text-white font-medium transition-opacity hover:opacity-90 active:opacity-100 disabled:opacity-70"
              style={{
                background: "linear-gradient(90deg, #6B46C1 0%, #A78BFA 100%)"
              }}
            >
              {submitting ? "Creating account…" : success ? "Success! Redirecting…" : "Create account"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white/60">Or sign up with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {oauthLoading === "google" ? (
                <span className="text-sm">Loading…</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.18H12v4.16h6.01c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("apple")}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {oauthLoading === "apple" ? (
                <span className="text-sm">Loading…</span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-1.18 1.62-2.38 3.23-4.07 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </>
              )}
            </button>
          </div>

          <p className="text-[#C8C8C8] text-sm mt-6 text-center">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-[#E4B5FF] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
