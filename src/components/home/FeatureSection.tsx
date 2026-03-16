const features: { image: string; title: string; description?: string; items?: string[] }[] = [
  {
    image: "/ai_trading.webp",
    title: "AI Trading Engine",
    description:
      "A fully autonomous LLM trained specifically for cryptocurrency markets. Never sleeps. Never misses an opportunity. Designed to maximize upside while minimizing downside exposure. The more capital we manage, the safer our strategies become."
  },
  {
    image: "/protection.webp",
    title: "Protection & Transparency",
    description:
      "Multi-layer risk management & hedging strategies Real-time performance dashboard Segregated trading capital structure Smart contract–based token mechanics."
  },
  {
    image: "/token_value.webp",
    title: "Token Value & Utility",
    description:
      "Profit participation from AI trading performance Monthly buyback & burn mechanism 0 platform & performance fees for holders Limited amount of tokens."
  }
];

export default function FeatureSection() {
  return (
    <section className="relative z-40 px-12 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-6 sm:py-16 md:py-24 mt-5 sm:mt-18 w-full max-w-[100vw] overflow-x-hidden box-border">
      <div className="w-full min-w-0 max-w-[1600px] mx-auto">
        {/* Introductory area */}
        <div className="text-center mb-10 sm:mb-16 md:mb-20">
          <h1 className="font-semibold leading-tight mb-4 sm:mb-6" style={{ fontSize: "clamp(1.75rem, 5vw, 5.7rem)" }}>
            Smart AI. Smarter Returns.
          </h1>
          <p className="text-[#C8C8C8] text-sm sm:text-lg max-w-[1450px] mx-auto leading-relaxed px-2">
            We have developed a proprietary AI trading system trained on vast amounts of crypto market data. Our
            advanced LLM-based bot trades 24/7, adapting to market conditions in real time.
          </p>
        </div>

        {/* Feature cards - constrained on mobile so no zoom/overflow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 min-w-0">
          {features.map(feature => (
            <div
              key={feature.title}
              className="rounded-2xl font-montserrat bg-[#0f0f1a]/90 border-2 border-white/25 hover:border-purple-500/50 transition-colors duration-150 shadow-[0_0_30px_rgba(168,85,247,0.05)] min-w-0 max-w-full overflow-hidden"
            >
              <div className="relative w-full max-w-full min-w-0 rounded-t-xl overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  width={400}
                  height={300}
                  className="w-full h-auto min-w-0 max-w-full object-contain"
                />
              </div>
              <div className="p-5 sm:p-6 md:p-8 min-w-0">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-3 sm:mb-4 break-words">
                  {feature.title}
                </h3>
                {feature.description ? (
                  <p className="text-[#C8C8C8] text-sm sm:text-lg text-white leading-relaxed break-words">
                    {feature.description}
                  </p>
                ) : (
                  <ul className="space-y-2 text-[#C8C8C8] text-sm sm:text-lg leading-relaxed">
                    {feature.items?.map(item => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
