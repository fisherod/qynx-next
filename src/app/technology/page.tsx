import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ListWithCircles from '@/components/ListWithCircles'

const technologyListItems = [
  { id: 'engine', title: 'AI Trading Engine', desc: 'Our engine is powered by a custom-trained Large Language Model (LLM) optimized for financial market interpretation. It analyzes price action and order flow, market volatility patterns, on-chain activity, liquidity depth, derivatives data, and sentiment indicators. The AI continuously evaluates probabilities and dynamically allocates capital across strategies based on real-time conditions.' },
  { id: 'strategy', title: 'Multi-Strategy Deployment', desc: 'To reduce reliance on a single trading style, our system deploys multiple strategy layers: trend-following models, statistical arbitrage frameworks, mean reversion strategies, volatility capture mechanisms, and market-neutral hedging systems. This diversification aims to reduce exposure to any single market condition.' },
  { id: 'risk', title: 'Risk Management Architecture', desc: 'Risk control is embedded at every layer of the system. Our framework includes position-level exposure limits, dynamic stop-loss controls, capital allocation caps, cross-market hedging, and volatility monitoring algorithms. The objective is disciplined capital preservation while targeting structured growth.' },
  { id: 'execution', title: 'Automated Execution Layer', desc: 'The system integrates directly with major exchange APIs through secure infrastructure. Features include smart order routing, slippage control mechanisms, low-latency trade execution, and continuous system monitoring. All trades are executed without emotional bias or manual interference.' },
  { id: 'transparency', title: 'Transparency & Monitoring', desc: 'Investors benefit from structured performance reporting and token transparency. The ecosystem includes real-time dashboard access, monthly performance summaries, token supply monitoring, and buyback disclosures. We believe scalable growth requires measurable transparency.' },
  { id: 'scale', title: 'Scalable Capital Model', desc: 'Our trading architecture is built to scale with capital deployment. As capital increases, hedging depth improves, liquidity access expands, strategy diversification strengthens, and risk distribution becomes more efficient. Scale enhances stability.' },
  { id: 'quantum', title: 'Quantum Research Initiative', desc: 'In parallel, we are exploring advanced computational frameworks, including quantum-enhanced modeling for optimization acceleration, high-dimensional pattern recognition, and advanced probabilistic forecasting. This research positions our platform for long-term technological leadership.' },
  { id: 'security', title: 'Security & Infrastructure', desc: 'Security is foundational to our architecture. Infrastructure includes encrypted data transmission, multi-layer server protection, smart contract auditing where applicable, and continuous infrastructure monitoring. Investor capital protection is prioritized at the system level.' },
]

export default function TechnologyPage() {
  return (
    <main className="relative w-full max-w-[100vw] min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 min-h-full z-0">
        <img
          src="/background.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
          fetchPriority="high"
        />
      </div>
      <div className="relative z-10">
        <Navbar />

        {/* Hero: text left, technology graphic right (browser-style layout) */}
        <section className="relative z-40 pt-40 sm:pt-48 pb-16 sm:pb-24 px-6 sm:px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left: text content (~2/3 on large screens) */}
              <div className="lg:col-span-7 text-left">
                <p className="text-[#E4B5FF] text-lg sm:text-xl font-medium uppercase tracking-wider mb-3">Technology</p>
                <h1
                  className="font-bold leading-tight text-white mb-4 sm:mb-5"
                  style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3.25rem)' }}
                >
                  AI Crypto Trading with Qynx
                </h1>
                <p className="text-white text-xl sm:text-2xl font-semibold mb-6 sm:mb-8">
                  Grow Your Portfolio with Crypto
                </p>
                <div className="text-[#C8C8C8] text-base sm:text-lg leading-relaxed space-y-4">
                  <p>
                    Our next-generation machine learning algorithm is built to optimize profit opportunities and mitigate risk in AI-driven crypto trading.
                  </p>
                  <p>
                    We diversify across a broad asset portfolio—including major cryptocurrencies, stablecoins, and select altcoins—to balance opportunity with risk management.
                  </p>
                  <p>
                    Trust and safety are at the core: our platform is designed to deliver AI-based financial services to a global user base with transparency and accountability.
                  </p>
                </div>
              </div>
              {/* Right: 3D / technology graphic (~1/3 on large screens) */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[260px] sm:max-w-[360px] lg:max-w-none aspect-square lg:aspect-auto lg:min-h-[380px]">
                  <Image
                    src="/technology.png"
                    alt="AI crypto trading — cursor and cryptocurrency coins"
                    width={520}
                    height={520}
                    className="w-full h-full object-contain object-center"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology lists: two columns, outline circle + connector line per item, no emojis */}
        <section className="relative z-40 px-6 sm:px-6 pb-16 sm:pb-24">
          <ListWithCircles items={technologyListItems} />
        </section>

        {/* Closing statement + CTA */}
        <section className="relative z-40 px-6 sm:px-6 pb-20 sm:pb-28">
          <div className="max-w-[800px] mx-auto text-center">
            <div className="rounded-2xl bg-[#0f0f1a]/90 border-2 border-white/20 p-8 sm:p-10 md:p-12">
              <p className="text-xl sm:text-2xl text-white font-semibold leading-relaxed mb-2">
                We are not building a trading bot.
              </p>
              <p className="text-xl sm:text-2xl text-white font-semibold leading-relaxed mb-8 sm:mb-10">
                We are building scalable AI-powered financial infrastructure.
              </p>
              <Link
                href="/#investment"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 sm:px-10 sm:py-5 rounded-full text-white text-lg font-medium transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(90deg, #6B46C1 0%, #A78BFA 100%)' }}
              >
                <span>Secure Early Entry</span>
                <span>&gt;</span>
              </Link>
              <p className="text-[#C8C8C8] text-sm mt-4">Take you to the Investment section</p>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  )
}
