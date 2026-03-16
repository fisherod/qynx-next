import Link from "next/link";
import InvestNowLink from "@/components/InvestNowLink";

export default function TitleSection() {
  return (
    <section className="relative w-full">
      {/* Background image: section size = image size, aspect ratio preserved */}
      <div className="relative w-full">
        <img
          src="/title_back.webp"
          alt=""
          width={1920}
          height={1080}
          className="w-full h-auto block"
          fetchPriority="high"
        />
        {/* Content overlaid on background – below navbar on mobile, centered + upward on desktop; pointer-events-none so hover over image doesn't trigger overlay/link styles */}
        <div className="absolute inset-0 flex items-start sm:items-center justify-center px-4 sm:px-6 pt-20 sm:pt-28 md:pt-32 sm:-translate-y-28 pointer-events-none">
          <div className="max-w-6xl mx-auto text-center w-full pointer-events-auto">
            <h1
              className="font-semibold leading-tight mb-4 sm:mb-6"
              style={{ fontSize: "clamp(1.75rem, 5vw, 5.7rem)" }}
            >
              <span className="text-white block">Let AI Trade the</span>
              <span className="text-[#E4B5FF] block mt-2">Crypto Markets for You</span>
            </h1>

            <p className="hidden sm:block text-[#C8C8C8] text-sm sm:text-base md:text-lg max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-10 leading-relaxed px-1">
              Our autonomous trading engine operates 24/7, combining advanced AI models, strategic hedging, and
              real-time market analysis to deliver performance-based growth.
            </p>

            <div className="hidden sm:flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-4">
              <Link
                href="/whitepaper.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-6 sm:py-3 text-white text-sm sm:text-fluid-base font-medium hover:bg-white/5 rounded-lg transition-colors w-auto shrink-0"
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
              <InvestNowLink
                className="flex items-center justify-center gap-1.5 sm:gap-6 px-3 py-2 sm:px-8 sm:py-6 rounded-full text-white text-sm sm:text-fluid-base font-medium transition-opacity hover:opacity-90 w-auto shrink-0"
                style={{ background: "linear-gradient(90deg, #6B46C1 0%, #A78BFA 100%)" }}
              >
                <span>Invest Now</span>
                <span>&gt;</span>
              </InvestNowLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
