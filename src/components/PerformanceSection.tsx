const performanceCards = [
  {
    icon: '/ai.png',
    title: 'Performance-Driven AI Engine',
    items: [
      'Guaranteed 11% monthly investor distributions',
      '30-40% average profit',
      '24/7 autonomous AI execution',
      'Adaptive hedging across market cycles',
    ],
  },
  {
    icon: '/token.png',
    title: 'Structured Token Economics',
    items: [
      'Current token price: $0.0154',
      'Monthly guaranteed buyback program',
      'Deflationary supply through strategic burns',
      'Profit participation for token holders',
    ],
  },
  {
    icon: '/capital.png',
    title: 'Capital Protection Framework',
    items: [
      'Multi-layer risk management system',
      'Diversified strategy deployment',
      'Position-level risk controls',
      'Real-time monitoring dashboard',
    ],
  },
  {
    icon: '/transparency.png',
    title: 'Transparency & Investor Alignment',
    items: [
      'Monthly performance reports',
      'On-chain token tracking',
      'Treasury allocation visibility',
      'Team tokens vested & locked',
    ],
  },
]

export default function PerformanceSection() {
  return (
    <section className="relative z-50 pl-10 pr-0 sm:pl-6 sm:pr-0 py-12 sm:py-16 md:py-24 overflow-x-hidden">
      <div className="max-w-[1830px] w-full mx-auto sm:ml-auto sm:mr-0 sm:-mr-8 lg:-mr-16">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-0 min-w-0 w-full">
          {/* Illustration - first on mobile (flush to viewport right edge via 100vw), right on lg */}
          <div className="flex justify-end w-full order-1 lg:order-2 lg:flex-[1.2] min-w-0 max-md:w-[100vw] max-md:relative max-md:left-[50%] max-md:-translate-x-1/2">
            <div className="relative w-full max-w-[500px] sm:max-w-[800px] lg:max-w-[1400px] aspect-square shrink-0 ml-auto max-md:mr-0">
              <img
                src="/hands.webp"
                alt="Performance"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Feature Cards - second on mobile (full width, right padding so illustration is flush right), left on lg */}
          <div className="flex flex-col gap-4 order-2 lg:order-1 lg:flex-1 lg:ml-5 w-full lg:max-w-2xl min-w-0 pr-10 sm:pr-0">
            {performanceCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl bg-[#0f0f1a]/90 border-2 border-white/25 p-6 md:p-8 hover:border-purple-500/50 transition-colors duration-150"
              >
                <div className="mb-4">
                  <img src={card.icon} alt={card.title} width={64} height={64} className="w-16 h-16 object-contain" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-3 sm:mb-4">{card.title}</h3>
                <ul className="space-y-1 text-[#C8C8C8] text-sm sm:text-fluid-base md:text-fluid-lg leading-relaxed">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-white shrink-0">•</span>
                      <span className="text-sm sm:text-lg text-white">
                        {item.includes('$0.0154') ? (
                          <>
                            {item.split('$0.0154')[0]}
                            <span style={{ color: '#d35dd7' }}>$0.0154</span>
                            {item.split('$0.0154')[1]}
                          </>
                        ) : (
                          item
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
