import Link from "next/link";
import InvestNowLink from "@/components/InvestNowLink";

export default function PositionSection() {
  return (
    <section className="relative z-40 px-14 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-12 sm:py-16 md:py-24 w-full max-w-[100vw] overflow-x-hidden box-border">
      <div className="relative w-full min-w-0 max-w-[1600px] min-h-[320px] sm:min-h-[480px] aspect-[16/10] mx-auto overflow-hidden flex flex-col justify-center items-center text-center rounded-2xl border border-white/20">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <img src="/sun.webp" alt="" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        {/* Main heading - same mobile margin as FeatureSection / PlanSection / FAQSection */}
        <div className="flex flex-col items-center -translate-y-4 sm:-translate-y-8 px-4 min-w-0 w-full max-w-full">
          <h1
            className="font-semibold leading-tight text-white mb-1 sm:mb-2 break-words"
            style={{ fontSize: "clamp(1.75rem, 4.5vw, 5.4rem)" }}
          >
            <span className="block">Position Yourself Early in</span>
            <span className="block">the Future of AI-Driven</span>
            <span className="block">Asset Management</span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/90 text-sm sm:text-lg md:text-xl max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed break-words min-w-0">
            Join a performance-driven ecosystem combining autonomous AI trading, structured token economics, and
            long-term capital growth.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 flex-wrap">
            <InvestNowLink
              className="flex items-center justify-center gap-2 px-5 py-3 sm:px-10 sm:py-5 rounded-full text-white text-sm sm:text-fluid-base md:text-fluid-lg font-medium transition-opacity hover:opacity-90 w-full sm:w-auto"
              style={{ background: "linear-gradient(90deg, #6B46C1 0%, #E866E7 100%)" }}
            >
              Invest Now &gt;
            </InvestNowLink>
            <Link
              href="/whitepaper.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-white text-sm sm:text-fluid-base md:text-fluid-lg font-medium hover:text-white/80 transition-colors w-full sm:w-auto"
            >
              <svg
                className="w-5 h-5 sm:w-7 sm:h-7 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v6M9 11l3 3 3-3" />
              </svg>
              Download Whitepaper
            </Link>
            <span className="text-fluid-base sm:text-fluid-lg font-medium">
              <span className="text-lg sm:text-xl" style={{ color: "#d35dd7" }}>
                $0.0154
              </span>
              <span className="text-white"> per token</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
