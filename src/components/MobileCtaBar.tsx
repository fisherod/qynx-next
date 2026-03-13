import Link from 'next/link'
import InvestNowLink from '@/components/InvestNowLink'

export default function MobileCtaBar() {
  return (
    <div className="flex sm:hidden w-full px-4 py-4 justify-center items-center gap-3">
      <Link
        href="/whitepaper.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-3 py-2.5 text-white text-sm font-medium hover:bg-white/5 rounded-lg transition-colors shrink-0"
      >
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v6M9 11l3 3 3-3" />
        </svg>
        Download Whitepaper
      </Link>
      <InvestNowLink
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90 shrink-0"
        style={{ background: 'linear-gradient(90deg, #6B46C1 0%, #A78BFA 100%)' }}
      >
        <span>Invest Now</span>
        <span>&gt;</span>
      </InvestNowLink>
    </div>
  )
}
