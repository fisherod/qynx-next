import Link from 'next/link'

export default function AssetSection() {
  return (
    <section className="relative z-30 w-full -mt-56 sm:-mt-[24rem] md:-mt-[30rem]">
      {/* Background image: section size = image size, aspect ratio preserved */}
      <div className="relative w-full">
        <img
          src="/assets_back.webp"
          alt=""
          width={1920}
          height={1080}
          className="w-full h-auto block"
        />
        {/* Content overlaid on background - in bottom half, slightly above its center; pointer-events-none so hover over image doesn't trigger overlay styles */}
        <div className="absolute inset-0 flex items-end justify-center pb-[18%] sm:pb-[20%] px-4 sm:px-8 md:px-10 lg:px-12 pointer-events-none">
          <div className="max-w-7xl mx-auto text-center w-full pointer-events-auto">
            <h1
              className="font-semibold leading-tight text-white mb-1 sm:mb-2"
              style={{ fontSize: 'clamp(1.75rem, 4.2vw, 4.45rem)' }}
            >
              <span className="block">Participate in the Next Generation</span>
              <span className="block mt-2">of AI Asset Management</span>
            </h1>
            <p className="hidden min-[1200px]:block text-[#C8C8C8] text-lg max-w-[950px] mx-auto leading-relaxed px-2">
            Let AI Work While Your Capital Grows. Powered by a proprietary AI trading engine targeting
              structured monthly distributions, our ecosystem combines performance-driven strategies,
              disciplined risk management, and tokenized value capture.{' '}
              <span>
                Current token price:{' '}
                <span className="font-semibold" style={{ color: '#d35dd7' }}>$0.0154</span>
              </span>
            </p>

            <Link
              href="#"
              className="inline-flex items-center justify-center gap-4 sm:gap-6 px-8 py-3 sm:px-10 sm:py-4 rounded-full text-white text-fluid-base font-medium transition-opacity hover:opacity-90 mt-4 sm:mt-6"
              style={{ background: 'linear-gradient(90deg, #A78BFA 0%, #6B46C1 100%)' }}
            >
              <span>Secure Early Access</span>
              <span>&gt;</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
