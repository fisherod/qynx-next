import Navbar from '@/components/Navbar'
import TitleSection from '@/components/TitleSection'
import MobileCtaBar from '@/components/MobileCtaBar'
import AssetSection from '@/components/AssetSection'
import FeatureSection from '@/components/FeatureSection'
import PerformanceSection from '@/components/PerformanceSection'
import PlanSection from '@/components/PlanSection'
import FAQSection from '@/components/FAQSection'
import PositionSection from '@/components/PositionSection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="relative w-full max-w-[100vw] min-h-screen overflow-x-hidden bg-[#0a0a12]">
      {/* Background - scrolls with page, covers full content height */}
      <div className="absolute inset-0 min-h-full z-0 bg-[#0a0a12] max-w-[100vw]">
        <img
          src="/background.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
          fetchPriority="high"
        />
      </div>
      <div className="relative z-10">

      {/* Content - natural flow */}
      <Navbar />
      <TitleSection />
      <MobileCtaBar />
      <FeatureSection />
      <PerformanceSection />
      <AssetSection />
      <PlanSection />
      <FAQSection />
      <PositionSection />
      <Footer />
      </div>
    </main>
  )
}
