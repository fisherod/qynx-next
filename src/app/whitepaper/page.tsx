import Image from 'next/image'
import PageLayout from '@/components/PageLayout'

const sections = [
  { title: 'Executive Summary', paragraphs: ['QYNX is a technology-driven digital asset infrastructure platform built around a proprietary AI trading engine designed for cryptocurrency markets. Our ecosystem combines: a fully autonomous AI trading system, multi-layer risk management architecture, performance-based distribution model, revenue-backed token mechanics, and long-term research through our Quantum Lab initiative.', 'The platform enables participants to gain structured exposure to AI-powered trading strategies through a tokenized participation model. Our objective is to build scalable AI-driven financial infrastructure capable of evolving with global digital asset markets.'] },
  { title: 'Industry Problem', paragraphs: ['The cryptocurrency market presents high opportunity but significant challenges: extreme volatility, emotional retail trading behavior, limited access to institutional-grade tools, inefficient manual strategies, and static algorithmic bots unable to adapt. Traditional bots operate on rule-based systems that often fail during changing market conditions. There is a growing demand for autonomous AI-based trading, risk-managed strategy execution, transparent performance structures, and scalable capital deployment models.'] },
  { title: 'Our Solution', paragraphs: ['QYNX introduces a proprietary AI-driven trading infrastructure designed to operate 24/7 without emotional bias, adapt dynamically to changing market conditions, deploy diversified multi-strategy execution, integrate structured risk management, and align investor participation through token mechanics. The platform is designed for scalability, sustainability, and long-term technological evolution.'] },
  { title: 'Technology Architecture', paragraphs: ['The core is a custom-trained AI model that analyzes real-time price action, order book liquidity, derivatives positioning, volatility patterns, on-chain data, and market sentiment. The system uses probabilistic modeling and dynamic capital allocation. Execution is fully automated. Multi-strategy deployment includes trend-following, market-neutral hedging, statistical arbitrage, mean reversion, and volatility capture. Risk is embedded at multiple layers with position-level limits, dynamic stop-loss automation, and cross-asset hedging.'] },
  { title: 'Performance Model', paragraphs: ['The AI trading engine targets structured monthly performance. Target model: Up to 11% monthly performance-based distributions, depending on market conditions and actual trading results. Returns are not guaranteed. Performance results are transparently reported.'] },
  { title: 'Token Overview', paragraphs: ['The native token serves as the participation mechanism. Token holders may gain exposure to performance-based distributions, staking rewards, revenue-backed buybacks, governance voting rights, and reduced platform fees. Total Supply: 1,000,000,000 Tokens. Allocation: 40% Public ICO, 20% Team (Vested 24 months), 15% Ecosystem & Treasury, 10% Staking Rewards, 10% Liquidity Provision, 5% Advisors.'] },
  { title: 'Buyback Mechanism', paragraphs: ['A portion of trading revenue is allocated to periodic open-market token buybacks to support liquidity, reduce circulating supply, align token value with ecosystem growth, and reinforce long-term sustainability. Buybacks are performance-based and transparently disclosed.'] },
  { title: 'ICO Structure', paragraphs: ['The ICO will occur in structured phases: Phase 1 – Early Access, Phase 2 – Expansion, Phase 3 – Final Public Allocation. Pricing may increase between phases. Funds raised will support trading capital expansion, AI model refinement, infrastructure scaling, risk management systems, and security & audits.'] },
  { title: 'Governance Model', paragraphs: ['Token holders may participate in governance decisions including strategy expansion proposals, ecosystem development priorities, staking parameter adjustments, and future product rollouts. Governance evolves as the platform matures.'] },
  { title: 'Quantum Lab Initiative', paragraphs: ['The Quantum Lab is a long-term research division exploring quantum-inspired optimization, hybrid AI modeling, high-dimensional probabilistic forecasting, and simulation acceleration. R&D operates separately from live trading capital. The objective is long-term computational advantage.'] },
  { title: 'Roadmap', paragraphs: ['2026 – AI Engine Deployment & Beta | Late 2026 – Private Participation Round | 2027 – Public ICO Launch | August 2027 – Strategic Public Market Ambition | 2028+ – Quantum Research Integration'] },
  { title: 'Security & Transparency', paragraphs: ['We prioritize secure infrastructure, transparent reporting, capital allocation clarity, performance summaries, and supply visibility. Security protocols evolve with ecosystem growth.'] },
  { title: 'Risk Factors', paragraphs: ['Cryptocurrency markets involve substantial volatility and risk. Potential risks include market downturns, liquidity constraints, regulatory changes, exchange-related risks, and technological vulnerabilities. Participants should evaluate risk tolerance before engaging.'] },
  { title: 'Long-Term Vision', paragraphs: ['Our mission is to build scalable AI-driven asset management infrastructure for the digital economy. We are not building a short-term yield platform. We are engineering an adaptive, evolving financial intelligence system.'] },
  { title: 'Disclaimer', paragraphs: ['This document is for informational purposes only and does not constitute financial advice, investment solicitation, or a guarantee of returns. Participation involves risk. All performance projections depend on market conditions and execution results.'] },
  { title: 'Financial Modeling Scenarios', paragraphs: ['The document includes illustrative scenarios (Conservative, Target, High-Performance) with key assumptions: monthly trading performance range 10–40% gross, distribution allocation up to 70% of net profits, buyback allocation 10%. Scenarios are hypothetical. Capital scaling improves hedging depth and liquidity access. All modeling is subject to market, regulatory, and execution risks.'] },
]

export default function WhitepaperPage() {
  return (
    <PageLayout>
      <section className="relative z-40 pt-40 sm:pt-48 pb-12 sm:pb-16 px-6 sm:px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <p className="text-[#E4B5FF] text-xl font-medium uppercase tracking-wider mb-3">Whitepaper</p>
          <h1 className="font-semibold leading-tight text-white mb-4" style={{ fontSize: 'clamp(2rem, 4.5vw, 4rem)' }}>
            QYNX
          </h1>
          <p className="text-[#C8C8C8] text-lg max-w-2xl mx-auto">
            AI-Driven Crypto Asset Management Infrastructure
          </p>
          <p className="text-[#C8C8C8] text-sm mt-2">Version 3.4 | 2026</p>
        </div>
      </section>

      <section className="relative z-40 px-6 sm:px-6 pb-20 sm:pb-28">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-10 lg:gap-x-16 gap-y-10">
          {sections.map((section) => (
            <div key={section.title} className="flex gap-4 sm:gap-5">
              <div className="flex-shrink-0 pt-0.5">
                <Image
                  src="/buble.webp"
                  alt=""
                  width={56}
                  height={56}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                  {section.title}
                </h2>
                <div className="text-[#A0A0A0] text-sm sm:text-base leading-relaxed space-y-2">
                  {section.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  )
}
