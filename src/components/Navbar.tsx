'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AUTH_SESSION_KEY } from '@/lib/constants'
import { ADMIN_TOKEN_KEY } from '@/lib/constants'
const ADMIN_USERNAME_KEY = 'adminUsername'

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return (
    !!sessionStorage.getItem(AUTH_SESSION_KEY) ||
    !!localStorage.getItem(ADMIN_TOKEN_KEY)
  )
}

function isAdmin(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(ADMIN_TOKEN_KEY)
}

const navLinks = [
  'Technology',
  'AI Trading Bot',
  'Investment',
  'Token & ICO',
  'Quantum Lab',
  'Whitepaper',
  'Contact Us',
] as const

const navLinkHref: Record<(typeof navLinks)[number], string> = {
  'Technology': '/technology',
  'AI Trading Bot': '/ai-trading-bot',
  'Investment': '/investment',
  'Token & ICO': '/token-ico',
  'Quantum Lab': '/quantum-lab',
  'Whitepaper': '/whitepaper',
  'Contact Us': '/contact-us',
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  // Initialize from storage on client so we never flash "Get Started" when logged in (e.g. on menu open)
  const [loggedIn, setLoggedIn] = useState(() => (typeof window !== 'undefined' && isLoggedIn()))
  const [authChecked, setAuthChecked] = useState(false)

  // Sync auth once on mount and when pathname changes (e.g. after sign-in); not on menu toggle
  useEffect(() => {
    setLoggedIn(isLoggedIn())
    setAuthChecked(true)
  }, [pathname])

  const handleSignOut = () => {
    sessionStorage.removeItem(AUTH_SESSION_KEY)
    sessionStorage.removeItem('qynx_auth_token')
    sessionStorage.removeItem('qynx_auth_username')
    sessionStorage.removeItem('qynx_auth_role')
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_USERNAME_KEY)
    setLoggedIn(false)
    setMobileOpen(false)
    router.replace('/')
  }

  const isActive = (link: (typeof navLinks)[number]) => {
    const href = navLinkHref[link]
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isAuthPage = pathname?.startsWith('/sign-in') === true || pathname?.startsWith('/sign-up') === true

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 px-3 xs:px-4 sm:px-6 py-4 sm:py-8 md:py-10">
      <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-2 sm:gap-4 md:gap-8 w-full min-w-0">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-1.5 sm:gap-2 shrink-0 rounded-lg transition-colors duration-200 active:opacity-75 min-w-0">
          <img
            src="/logo.png"
            alt="Qynx"
            width={48}
            height={48}
            className="w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 object-contain shrink-0"
          />
          <span className="text-white font-semibold text-base xs:text-lg sm:text-xl md:text-2xl tracking-tight truncate group-hover:opacity-90 transition-opacity">Qynx</span>
        </Link>

        {/* Center nav links - pill container: only on xl+ so it never overflows; no visible scrollbar */}
        <div className="hidden xl:flex flex-1 justify-center min-w-0 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-[#1a1a24] border border-white/10 shadow-inner">
            {navLinks.map((link) => {
              const active = isActive(link)
              return (
                <Link
                  key={link}
                  href={navLinkHref[link] ?? '#'}
                  className={`px-3 py-2 text-base font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                    active
                      ? 'text-white bg-white/20 border border-white/20'
                      : 'text-white/90 hover:text-white hover:bg-white/10 active:bg-white/15 active:scale-[0.98]'
                  }`}
                >
                  {link}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Hamburger: shown below xl so nav pill only appears when it fits */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden p-2 rounded-lg text-white/90 transition-all duration-200 hover:text-white hover:bg-white/10 active:bg-white/15 active:scale-95"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          {/* Fixed width so layout never shifts when auth state loads or changes */}
          {!isAuthPage && (
            <div className="hidden sm:flex items-center gap-1.5 w-[260px] justify-start shrink-0">
              {authChecked ? (
                loggedIn ? (
                  <>
                    {!isAdmin() && (
                      <Link
                        href="/user/dashboard"
                        className="px-2.5 py-1.5 rounded-lg text-[#c44dbf] text-sm font-medium border border-[#c44dbf] hover:bg-white/5 hover:text-[#E866E7] transition-colors whitespace-nowrap"
                      >
                        To Dashboard
                      </Link>
                    )}
                    {isAdmin() && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white/90 text-sm font-medium transition-all duration-200 hover:text-white hover:bg-white/10 active:bg-white/15 active:scale-[0.98]"
                      >
                        Admin Panel
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white/90 text-sm font-medium transition-all duration-200 hover:text-white hover:bg-white/10 active:bg-white/15 active:scale-[0.98]"
                    >
                      Sign out
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white/90 text-sm font-medium transition-all duration-200 hover:text-white hover:bg-white/10 active:bg-white/15 active:scale-[0.98]"
                    >
                      Sign in
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <Link
                      href="/sign-up"
                      className="flex flex-row justify-center items-center px-4 sm:px-5 py-2.5 sm:py-3 gap-1.5 rounded-[35px] flex-none text-white text-sm font-medium transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] active:opacity-100"
                      style={{ background: 'linear-gradient(99.75deg, #40429F 3.51%, #E866E7 138.39%), #FFFFFF' }}
                    >
                      Get Started
                    </Link>
                  </>
                )
              ) : (
                <span className="w-full" aria-hidden />
              )}
            </div>
          )}
          {/* Mobile: fixed width while loading to avoid shift */}
          {!isAuthPage && (
            <div className={`flex sm:hidden justify-end shrink-0 ${!authChecked ? 'w-[120px]' : ''}`}>
              {authChecked ? (
                !loggedIn && (
                  <Link
                    href="/sign-up"
                    className="flex flex-row justify-center items-center px-5 py-3 gap-2 rounded-[35px] flex-none text-white text-fluid-sm font-medium transition-all duration-200 hover:opacity-90"
                    style={{ background: 'linear-gradient(99.75deg, #40429F 3.51%, #E866E7 138.39%), #FFFFFF' }}
                  >
                    Get Started
                  </Link>
                )
              ) : (
                <span className="invisible py-3 px-5 text-fluid-sm font-medium" aria-hidden>Get Started</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dropdown menu (tablet + mobile) */}
      {mobileOpen && (
        <div className="xl:hidden absolute top-full left-0 right-0 mt-1 mx-3 xs:mx-4 py-4 rounded-xl bg-[#1a1a24] border border-white/10">
          <div className="flex flex-col gap-1 px-4">
            {navLinks.map((link) => {
              const active = isActive(link)
              return (
                <Link
                  key={link}
                  href={navLinkHref[link] ?? '#'}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 text-fluid-base font-medium rounded-lg transition-all duration-200 ${
                    active
                      ? 'text-white bg-white/20 border border-white/20'
                      : 'text-white/90 hover:text-white hover:bg-white/10 active:bg-white/15 active:scale-[0.99]'
                  }`}
                >
                  {link}
                </Link>
              )
            })}
            {authChecked && !isAuthPage && (
              loggedIn ? (
                <>
                  {!isAdmin() && (
                    <Link
                      href="/user/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex flex-row justify-center items-center gap-2 px-5 py-3 rounded-[35px] text-white text-fluid-base font-medium transition-all duration-200 hover:opacity-90 border-t border-white/10 mt-2 pt-4"
                      style={{ background: 'linear-gradient(99.75deg, #40429F 3.51%, #E866E7 138.39%), #FFFFFF' }}
                    >
                      User Dashboard
                    </Link>
                  )}
                  {isAdmin() && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-3 text-fluid-base font-medium rounded-lg text-white/90 hover:text-white hover:bg-white/10 w-full text-left"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="px-4 py-3 text-fluid-base font-medium rounded-lg text-white/90 hover:text-white hover:bg-white/10 w-full text-left"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-fluid-base font-medium rounded-lg text-white/90 hover:text-white hover:bg-white/10 border-t border-white/10 mt-2"
                >
                  Sign in
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
