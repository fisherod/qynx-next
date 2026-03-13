import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PageLayout({
  children,
  showFooter = true,
  showNavbar = true,
}: {
  children: React.ReactNode
  showFooter?: boolean
  showNavbar?: boolean
}) {
  return (
    <main className="relative w-full max-w-[100vw] min-h-screen overflow-x-hidden bg-[#0a0a12]">
      <div className="absolute inset-0 min-h-full z-0 bg-[#0a0a12] max-w-[100vw]">
        <img
          src="/background.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
          fetchPriority="high"
        />
      </div>
      <div className="relative z-10">
        {showNavbar && <Navbar />}
        {children}
        {showFooter && <Footer />}
      </div>
    </main>
  )
}
