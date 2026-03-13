import Link from 'next/link'
import Image from 'next/image'
import PageLayout from '@/components/PageLayout'
import ListWithCircles from '@/components/ListWithCircles'
import InvestNowLink from '@/components/InvestNowLink'

/** QYNX per 1 USD (e.g. 1 USDT = RATE QYNX). Same source as PurchaseQynxModal. */
const QYNX_PER_USD = Math.max(0.0001, Number(process.env.NEXT_PUBLIC_QYNX_PER_USD) || Number(process.env.QYNX_PER_USD) || 65)
const QYNX_PRICE_USD = (1 / QYNX_PER_USD).toFixed(4)

const listItems = [
  { id: 'participate', title: 'How Investors Participate', desc: 'Investors acquire the platform token during the active participation phase. Token holders gain access to performance-based monthly distributions on top of the guaranteed returns, revenue-backed buyback mechanisms, governance participation, staking incentives, ecosystem growth exposure, and guaranteed ROI 11%. The token is designed to align platform success with investor value.' },
  { id: 'performance', title: 'Performance Model', desc: 'The AI trading engine deploys capital across diversified strategies targeting structured monthly performance. Target distribution model: starting from 11% monthly, based on trading results and market conditions. Profit distributions are generated from actual trading profits and depend on performance.' },
  { id: 'capital', title: 'Capital & Risk Framework', desc: 'We prioritize sustainability and disciplined risk management. Our structure includes diversified multi-strategy deployment, hedging across market cycles, exposure limits per asset, dynamic volatility controls, and performance monitoring systems. The objective is long-term scalability, not speculative overexposure.' },
  { id: 'buyback', title: 'Token Buyback Mechanism', desc: 'A portion of trading revenue is allocated to periodic open-market token buybacks. This mechanism supports token liquidity, may reduce circulating supply, aligns ecosystem performance with token value, and reinforces long-term sustainability. Buybacks are performance-based and transparently disclosed.' },
  { id: 'funds', title: 'Use of Funds', desc: 'Capital allocation supports trading liquidity expansion, infrastructure and server scaling, AI model enhancement, risk management development, and strategic reserves. Every phase of capital deployment is designed to strengthen ecosystem resilience.' },
  { id: 'tiers', title: 'Participation Tiers', desc: 'Investor participation tiers provide additional ecosystem benefits based on allocation size, including enhanced distribution weighting, reduced performance fees, early access to new strategies, staking bonuses, and governance influence. Details are outlined in the Tokenomics section.' },
  { id: 'transparency', title: 'Transparency & Reporting', desc: 'We provide monthly performance summaries, token supply transparency, buyback disclosures, and roadmap updates. Structured reporting builds long-term investor confidence.' },
]

export default function InvestmentPage() {
  return (
    <PageLayout>
      {/* Hero: text left, investment.webp right (browser-style layout) */}
      <section className="relative z-40 pt-40 sm:pt-48 pb-16 sm:pb-24 px-6 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left: text content */}
            <div className="lg:col-span-6 text-left">
              <p className="text-[#E4B5FF] text-lg sm:text-xl font-medium uppercase tracking-wider mb-3">Investment</p>
              <h1
                className="font-bold leading-tight text-white mb-6 sm:mb-8"
                style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3.25rem)' }}
              >
                Participate in AI-Driven Crypto Asset Infrastructure
              </h1>
              <div className="text-white/90 text-base sm:text-lg leading-relaxed space-y-4 mb-8 sm:mb-10">
                <p>
                  Our ecosystem allows investors to participate in the performance of a proprietary AI-powered trading engine through a structured token model.
                </p>
                <p>
                  Capital raised supports expanded trading capacity, advanced hedging strategies, infrastructure scaling, and continuous AI development. As capital scales, execution depth and risk distribution improve.
                </p>
              </div>
              <InvestNowLink
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-white text-lg font-medium border-2 border-white bg-transparent hover:bg-white/10 transition-colors"
              >
                Invest Now
              </InvestNowLink>
            </div>
            {/* Right: investment image — right edge fades; no solid overlay so page texture shows through */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end items-center">
              <div className="relative w-full max-w-[400px] sm:max-w-[480px] lg:max-w-[48vw] xl:max-w-[560px] overflow-hidden">
                <div
                  className="opacity-90 min-h-[220px] sm:min-h-[260px] lg:min-h-[300px]"
                  style={{
                    WebkitMaskImage: 'linear-gradient(to right, black 55%, transparent 100%)',
                    maskImage: 'linear-gradient(to right, black 55%, transparent 100%)',
                  }}
                >
                  <Image
                    src="/investment.png"
                    alt="Investment — AI-driven crypto asset infrastructure"
                    width={560}
                    height={400}
                    className="w-full h-auto min-h-[220px] sm:min-h-[260px] lg:min-h-[300px] object-contain object-center"
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 1023px) 480px, 48vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-40 px-6 sm:px-6 pb-16 sm:pb-24">
        <ListWithCircles items={listItems} />
      </section>

      <section className="relative z-40 px-6 sm:px-6 pb-20 sm:pb-28">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="rounded-2xl bg-[#0f0f1a]/90 border-2 border-white/20 p-8 sm:p-10 md:p-12">
            <p className="text-xl sm:text-2xl text-white font-semibold leading-relaxed mb-2">Position Yourself at the Infrastructure Level</p>
            <p className="text-[#C8C8C8] text-lg leading-relaxed mb-4">This is not a short-term yield program. It is a scalable AI-driven asset management ecosystem designed for long-term performance, capital discipline, and technological innovation.</p>
            <p className="text-[#E4B5FF] text-xl font-semibold mb-8">Current token price: ${QYNX_PRICE_USD}</p>
            <InvestNowLink className="inline-flex items-center justify-center gap-2 px-8 py-4 sm:px-10 sm:py-5 rounded-full text-white text-lg font-medium transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(90deg, #6B46C1 0%, #A78BFA 100%)' }}>
              <span>Invest Now</span>
              <span>&gt;</span>
            </InvestNowLink>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
