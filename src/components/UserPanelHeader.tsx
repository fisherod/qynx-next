'use client'

import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ToastMessage from '@/components/ToastMessage'

const NAV = [
  { href: '/user/dashboard', label: 'Dashboard' },
  // { href: '/user/trading', label: 'Trading' },
  { href: '/user/referral', label: 'Referral' },
  { href: '/user/investment', label: 'Investment' },
  { href: '/user/withdrawal', label: 'Withdrawal' },
] as const

interface UserPanelHeaderProps {
  onLogout: () => void
}

export default function UserPanelHeader({
  onLogout
}: UserPanelHeaderProps) {
  const pathname = usePathname()
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)
  const [mobileDropdownPosition, setMobileDropdownPosition] = useState({ top: 0 })
  const [networkSuccess, setNetworkSuccess] = useState<string | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Position mobile dropdown below header (for portal)
  useEffect(() => {
    if (!mobileNavOpen || !headerRef.current) return
    const updatePosition = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect()
        setMobileDropdownPosition({ top: rect.bottom })
      }
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [mobileNavOpen])

  useEffect(() => {
    if (!mobileNavOpen) return
    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (mobileNavRef.current?.contains(target) || mobileDropdownRef.current?.contains(target)) return
      setMobileNavOpen(false)
    }
    const id = setTimeout(() => {
      document.addEventListener('click', close)
    }, 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('click', close)
    }
  }, [mobileNavOpen])

  useEffect(() => {
    if (!networkSuccess) return
    const t = setTimeout(() => setNetworkSuccess(null), 5000)
    return () => clearTimeout(t)
  }, [networkSuccess])

  return (
    <header ref={headerRef} className="relative px-5 xs:px-6 sm:px-6 py-4 sm:py-6 border-b border-white/10 max-w-[100vw] overflow-x-hidden overflow-y-visible">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3 min-w-0">
        <Link href="/" className="group flex items-center gap-2.5 text-white no-underline transition-opacity shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/logo.png" alt="" width={48} height={48} className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
          </div>
          <span className="text-xl sm:text-2xl font-semibold tracking-tight group-hover:opacity-90">Qynx</span>
        </Link>

        <div ref={mobileNavRef} className="flex-1 min-w-0 flex justify-center -mx-1 px-1 relative">
          <div className="flex items-center gap-1.5 sm:gap-3 min-h-[44px] overflow-x-auto scrollbar-hide w-full sm:w-auto">
            {/* Mobile: hamburger on the right */}
            <div className="flex sm:hidden items-center gap-2 min-w-0 flex-1 justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setMobileNavOpen((o) => !o)
                }}
                className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                aria-label="Toggle menu"
                aria-expanded={mobileNavOpen}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileNavOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            {/* Desktop: full nav pill */}
            <nav className="hidden sm:flex gap-1.5 p-1 bg-white/5 rounded-xl shrink-0">
              {NAV.map(({ href, label }) => {
                const active = pathname === href || pathname === href + '/'
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`py-2.5 px-3 sm:px-4 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      active ? 'text-white font-semibold' : 'text-[#C8C8C8] hover:bg-white/5 hover:text-white'
                    }`}
                    style={active ? { background: 'linear-gradient(90deg, #6B46C1 0%, #A78BFA 100%)' } : undefined}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="flex sm:hidden items-center gap-1.5 shrink-0 border-l border-white/10 pl-2">
              <button
                type="button"
                onClick={onLogout}
                className="px-3 sm:px-4 py-2 rounded-lg text-[#C8C8C8] text-sm font-medium border border-white/10 hover:bg-white/5 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            className="px-3 sm:px-4 py-2 rounded-lg text-[#C8C8C8] text-sm font-medium border border-white/10 hover:bg-white/5 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown: portaled to body so it's not clipped by header */}
      {mobileNavOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={mobileDropdownRef}
            className="sm:hidden fixed left-0 right-0 border-t border-white/10 bg-[#1a1a24] backdrop-blur-sm z-[60] shadow-xl max-h-[70vh] overflow-y-auto"
            style={{ top: mobileDropdownPosition.top, maxHeight: mobileDropdownPosition.top ? `calc(100vh - ${mobileDropdownPosition.top}px)` : undefined }}
          >
            <div className="max-w-[1200px] mx-auto px-5 xs:px-6 py-3 flex flex-col gap-0.5">
              {NAV.map(({ href, label }) => {
                const active = pathname === href || pathname === href + '/'
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'text-white font-semibold' : 'text-[#C8C8C8] hover:bg-white/5 hover:text-white'
                    }`}
                    style={active ? { background: 'linear-gradient(90deg, #6B46C1 0%, #A78BFA 100%)' } : undefined}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>,
          document.body
        )}
      {networkSuccess && <ToastMessage variant="success" title={networkSuccess} className="fixed top-24 right-4 z-[70]" />}
    </header>
  )
}
