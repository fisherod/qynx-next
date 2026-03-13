'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import {
  AUTH_SESSION_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USERNAME_KEY,
  AUTH_ROLE_KEY,
  AUTH_USER_ID_KEY,
  setAuthUserData,
} from '@/lib/auth-client'
// import { clientSignIn } from '@/lib/auth-api'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const fromRegistration = searchParams.get('registered') === '1'

  const validate = () => {
    const next: { email?: string; password?: string; form?: string } = {}
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
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors((prev) => ({ ...prev, form: undefined }))
    if (!validate()) return
    setSubmitting(true)
    try {
      // const result = await clientSignIn(email.trim().toLowerCase(), password)
      // if (result && !result.ok) {
      //   setErrors((prev) => ({ ...prev, form: result.message }))
      //   return
      // }
      // if (!result) {
      //   setErrors((prev) => ({ ...prev, form: 'The server is not responding' }))
      //   return
      // }
      // const user = result
      // if (typeof window !== 'undefined') {
      //   sessionStorage.setItem(AUTH_SESSION_KEY, '1')
      //   sessionStorage.setItem(AUTH_TOKEN_KEY, '1')
      //   sessionStorage.setItem(AUTH_USERNAME_KEY, user.username)
      //   sessionStorage.setItem(AUTH_ROLE_KEY, user.role)
      //   if (user.id) sessionStorage.setItem(AUTH_USER_ID_KEY, user.id)
      //   setAuthUserData(user)
      //   if (user.role === 'admin') {
      //     localStorage.setItem('adminToken', '1')
      //     localStorage.setItem('adminUsername', user.username)
      //     if (user.id) localStorage.setItem('adminUserId', user.id)
      //   }
      // }
      setSuccess(true)
      const redirectTo = searchParams.get('redirect')
      const allowedPaths = ['/user/dashboard', '/user/trading', '/user/referral', '/user/balance', '/user/withdrawal']
      const allowedRedirect = redirectTo && allowedPaths.includes(redirectTo) ? redirectTo : '/user/dashboard'
      const redirect = () => {
        // if (user.role === 'admin') router.push('/admin/')
        // else router.push(allowedRedirect)
        router.push('/user/dashboard')
      }
      setTimeout(redirect, 1500)
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
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">Sign in</h1>
          <p className="text-[#C8C8C8] text-sm mb-8">Access your Qynx account</p>
          {fromRegistration && (
            <div className="mb-6 py-3 px-4 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-sm text-center">
              Registration successful. You can sign in now.
            </div>
          )}
          {success && (
            <div className="mb-6 py-3 px-4 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-sm text-center">
              Signed in successfully! Redirecting…
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
                autoComplete="current-password"
                placeholder="••••••••"
                className={`${inputBase} border ${errors.password ? inputError : 'border-white/10'}`}
              />
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
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
              {submitting ? 'Signing in…' : success ? 'Signed in! Redirecting…' : 'Sign in'}
            </button>
          </form>
          <p className="text-[#C8C8C8] text-sm mt-6 text-center">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-[#E4B5FF] font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </PageLayout>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <PageLayout showFooter={false}>
          <section className="relative z-40 pt-40 sm:pt-48 pb-16 sm:pb-24 px-4 sm:px-6 min-h-[60vh] flex items-start justify-center">
            <div className="w-full max-w-[480px] rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 p-8 sm:p-10 animate-pulse">
              <div className="h-8 bg-white/10 rounded w-32 mb-2" />
              <div className="h-4 bg-white/10 rounded w-48 mb-8" />
              <div className="h-12 bg-white/10 rounded mb-5" />
              <div className="h-12 bg-white/10 rounded mb-5" />
              <div className="h-12 bg-white/10 rounded" />
            </div>
          </section>
        </PageLayout>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
