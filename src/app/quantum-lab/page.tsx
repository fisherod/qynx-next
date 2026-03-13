import Link from 'next/link'
import Image from 'next/image'
import PageLayout from '@/components/PageLayout'
import ListWithCircles from '@/components/ListWithCircles'

const listItems = [
  { id: 'why', title: 'Why Quantum Research?', desc: 'Financial markets are complex, high-dimensional systems influenced by countless variables. Traditional computing processes data sequentially. Quantum-inspired computational models allow us to explore multi-variable optimization problems at an entirely different scale. We are researching how quantum methodologies may improve portfolio optimization, risk scenario simulation, high-dimensional pattern recognition, probabilistic forecasting, and strategy backtesting acceleration.' },
  { id: 'focus', title: 'Current Research Focus', desc: 'The Quantum Lab operates as a parallel R&D division exploring quantum-inspired optimization algorithms, hybrid AI and quantum modeling structures, advanced Monte Carlo simulation frameworks, volatility forecasting enhancement, and high-frequency decision acceleration. Our objective is to integrate these advancements into the core AI trading engine as they mature.' },
  { id: 'vision', title: 'Long-Term Vision', desc: 'The Quantum Lab positions our ecosystem for institutional-grade computational advantage, enhanced strategy precision, reduced latency in probabilistic modeling, improved capital allocation efficiency, and scalable infrastructure leadership. We believe the next evolution of AI trading will be powered by advanced computational innovation.' },
  { id: 'practical', title: 'Practical Approach', desc: 'We take a measured and realistic approach to quantum development. Rather than relying on speculative breakthroughs, we focus on applied research, computational modeling advancements, strategic partnerships, and gradual integration into existing infrastructure. Innovation must be disciplined, not experimental capital risk.' },
  { id: 'positioning', title: 'Strategic Positioning', desc: 'The Quantum Lab represents our commitment to long-term technological leadership. While many platforms focus solely on short-term yield generation, we are building the foundation for a next-generation AI asset management infrastructure.' },
  { id: 'responsible', title: 'Responsible Innovation', desc: 'All research initiatives operate independently from active trading capital to ensure no experimental exposure of investor funds, clear separation between R&D and live trading, and risk-controlled innovation. Sustainability remains our core priority.' },
]

export default function QuantumLabPage() {
  return (
    <PageLayout>
      {/* Hero: text left, quantum.png right (browser-style layout) */}
      <section className="relative z-40 pt-40 sm:pt-48 pb-16 sm:pb-24 px-6 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left: text content */}
            <div className="lg:col-span-5 text-left">
              <p className="text-[#E4B5FF] text-lg sm:text-xl font-medium uppercase tracking-wider mb-3">Quantum Lab</p>
              <h1
                className="font-bold leading-tight text-white mb-6 sm:mb-8"
                style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3.25rem)' }}
              >
                Advancing the Future of AI-Driven Financial Intelligence
              </h1>
              <div className="text-white/90 text-base sm:text-lg leading-relaxed space-y-4 mb-8 sm:mb-10">
                <p>
                  The Quantum Lab is our long-term research initiative focused on advancing computational capabilities beyond traditional AI trading systems.
                </p>
                <p>
                  While our current AI infrastructure operates on high-performance classical computing systems, we are actively exploring next-generation computational frameworks to enhance predictive modeling, optimization speed, and strategic execution. Our goal is not incremental improvement — but exponential capability expansion.
                </p>
              </div>
              <Link
                href="/#investment"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-white text-lg font-medium border-2 border-white bg-transparent hover:bg-white/10 transition-colors"
              >
                Secure Early Access
              </Link>
            </div>
            {/* Right: quantum.png — scales with viewport */}
            <div className="lg:col-span-7 flex justify-center lg:justify-end items-center">
              <div className="relative w-full max-w-[520px] sm:max-w-[600px] lg:max-w-[55vw] xl:max-w-[680px]">
                <Image
                  src="/quantum.webp"
                  alt="Quantum Lab — AI-driven financial intelligence"
                  width={700}
                  height={500}
                  className="w-full h-auto min-h-[260px] sm:min-h-[300px] lg:min-h-[340px] object-contain object-center"
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1023px) 600px, 55vw"
                />
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
            <p className="text-xl sm:text-2xl text-white font-semibold leading-relaxed mb-2">Building the Computational Edge of Tomorrow</p>
            <p className="text-[#C8C8C8] text-lg leading-relaxed mb-8">Our mission is not simply to trade markets — but to engineer the intelligence layer that powers them. The Quantum Lab ensures our ecosystem evolves alongside the future of computation.</p>
            <Link href="/#investment" className="inline-flex items-center justify-center gap-2 px-8 py-4 sm:px-10 sm:py-5 rounded-full text-white text-lg font-medium transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(90deg, #6B46C1 0%, #A78BFA 100%)' }}>
              <span>Secure Early Access</span>
              <span>&gt;</span>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
