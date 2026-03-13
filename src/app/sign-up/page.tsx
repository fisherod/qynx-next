'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import { clientSignUp } from '@/lib/auth-api'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    confirmPassword?: string
    form?: string
  }>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const refParam = params.get('ref')
    if (refParam && refParam.trim() !== '') {
      setReferralCode(refParam.trim())
    }
  }, [])

  const validate = () => {
    const next: {
      email?: string
      password?: string
      confirmPassword?: string
    } = {}
    if (!email.trim()) {
      next.email = 'Email is required'
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = 'Please enter a valid email address'
    }
    if (!password) {
      next.password = 'Password is required'
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    }
    if (!confirmPassword) {
      next.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors((prev) => ({ ...prev, form: undefined }))
    if (!validate()) return
    setSubmitting(true)
    try {
      const error = await clientSignUp(email.trim().toLowerCase(), password, referralCode)
      if (error) {
        setErrors((prev) => ({ ...prev, form: error }))
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/sign-in/?registered=1'), 2000)
    } catch {
      setErrors((prev) => ({ ...prev, form: 'Something went wrong. Try again.' }))
    } finally {
      setSubmitting(false)
    }
  }

  const inputBase = 'w-full px-4 py-3 rounded-xl bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/50 focus:border-[#A78BFA]/50 transition-colors'
  const inputError = 'border-red-500/70 focus:ring-red-500/50'

  return (
    <PageLayout showFooter={false}>
      <section className="relative z-40 pt-40 sm:pt-48 pb-16 sm:pb-24 px-4 sm:px-6 min-h-[60vh] flex items-start justify-center">
        <div className="w-full max-w-[480px] rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 p-8 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">Sign up</h1>
          <p className="text-[#C8C8C8] text-sm mb-8">Create your Qynx account</p>
          {referralCode && (
            <p className="text-yellow-500 text-sm mb-4">Referral code: <span className="font-medium text-white/90">{referralCode}</span></p>
          )}
          {success && (
            <div className="mb-6 py-3 px-4 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-sm text-center">
              Account created successfully. Redirecting to sign in…
            </div>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className={`${inputBase} border ${errors.email ? inputError : 'border-white/10'}`}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`${inputBase} border ${errors.password ? inputError : 'border-white/10'}`}
              />
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-white/90 mb-2">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`${inputBase} border ${errors.confirmPassword ? inputError : 'border-white/10'}`}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>
            {errors.form && (
              <p className="text-sm text-red-400">{errors.form}</p>
            )}
            <button
              type="submit"
              disabled={submitting || success}
              className="w-full py-3.5 rounded-xl text-white font-medium transition-opacity hover:opacity-90 active:opacity-100 disabled:opacity-70"
              style={{ background: 'linear-gradient(90deg, #6B46C1 0%, #A78BFA 100%)' }}
            >
              {submitting ? 'Creating account…' : success ? 'Success! Redirecting…' : 'Create account'}
            </button>
          </form>
          <p className="text-[#C8C8C8] text-sm mt-6 text-center">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-[#E4B5FF] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </PageLayout>
  )
}
