import Link from 'next/link'

const footerLinks = {
  company: ['About', 'Careers', 'Blog', 'Press'],
  platform: ['AI Analytics', 'Strategies', 'Portfolio', 'Security'],
  legal: ['Terms of Service', 'Privacy Policy', 'Risk Disclosure', 'Compliance'],
  support: ['Help Center', 'Technical Support', 'Service Status'],
}

const socialIcons = [
  {
    name: 'X (Twitter)',
    href: 'https://x.com/QYNXaiTrading',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@qynxaitrading',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61587761993621 ',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M16.9265 8.02734H13.9816C12.9378 8.02734 12.0894 8.86944 12.0817 9.91326L11.9964 21.4278M10.082 14.0027H14.8847" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="relative z-40 overflow-x-hidden max-w-[100vw] w-full box-border">
      <div className="relative w-full min-w-0 max-w-[1400px] mx-auto px-14 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-10 sm:py-16 md:py-20">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 sm:gap-10 lg:gap-8 min-w-0">
          {/* Branding column - same mobile margin as other sections */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 min-w-0">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <img
                src="/logo.png"
                alt="Qynx"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
              <span className="text-white font-semibold text-xl sm:text-2xl md:text-3xl tracking-tight break-words">Qynx</span>
            </Link>
            <p className="text-gray-400 text-xs text-white sm:text-fluid-sm md:text-fluid-base leading-relaxed w-full mb-6 break-words min-w-0">
              We build intelligent tools that help investors navigate crypto markets with confidence. Our
              platform combines advanced AI analytics, real-time data, and powerful automation.
            </p>
            <div className="flex items-center gap-10">
              {socialIcons.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation columns */}
          <div className="min-w-0">
          <h2 className="text-white text-lg sm:text-xl md:text-2xl uppercase tracking-wider mb-4 sm:mb-8 break-words">Company</h2>
            <ul className="space-y-5">
              {footerLinks.company.map((link) => (
                <li key={link}>
                  <Link href="#" className="text-gray-400 text-sm sm:text-fluid-sm md:text-fluid-base hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
          <h2 className="text-white text-lg sm:text-xl md:text-2xl uppercase tracking-wider mb-4 sm:mb-8 break-words">Platform</h2>
            <ul className="space-y-5">
              {footerLinks.platform.map((link) => (
                <li key={link}>
                  <Link href="#" className="text-gray-400 text-sm sm:text-fluid-sm md:text-fluid-base hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <h2 className="text-white text-lg sm:text-xl md:text-2xl uppercase tracking-wider mb-4 sm:mb-8 break-words">Legal</h2>
            <ul className="space-y-5">
              {footerLinks.legal.map((link) => {
                const href =
                  link === 'Terms of Service'
                    ? '/terms'
                    : '#'
                const target = link === 'Terms of Service' ? '_blank' : undefined
                const rel = link === 'Terms of Service' ? 'noopener noreferrer' : undefined
                return (
                  <li key={link}>
                    <Link
                      href={href}
                      target={target}
                      rel={rel}
                      className="text-gray-400 text-sm sm:text-fluid-sm md:text-fluid-base hover:text-white transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="min-w-0">
          <h2 className="text-white text-lg sm:text-xl md:text-2xl uppercase tracking-wider mb-4 sm:mb-8 break-words">Support</h2>
            <ul className="space-y-5">
              {footerLinks.support.map((link) => (
                <li key={link}>
                  <Link href="#" className="text-gray-400 text-sm sm:text-fluid-sm md:text-fluid-base hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Separator */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-gray-700/50 text-center sm:text-left min-w-0">
          <p className="font-josefin text-white text-fluid-xs sm:text-fluid-sm break-words">© 2026 All Rights Reserved Crypto.com™</p>
        </div>
      </div>
    </footer>
  )
}
