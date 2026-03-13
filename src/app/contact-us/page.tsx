import PageLayout from '@/components/PageLayout'

const contactBlocks = [
  { title: 'General Inquiries', desc: 'For general questions and platform information. Email: support@[yourdomain].com. Response time: Within 24 hours.' },
  { title: 'Investor Relations', desc: 'For allocation inquiries, strategic partnerships, or institutional participation. Email: investors@[yourdomain].com. Please include: Full name, allocation interest range, geographic location. Our team will respond with relevant documentation and onboarding steps.' },
  { title: 'Partnerships & Technology', desc: 'For exchange integrations, infrastructure collaboration, or research initiatives. Email: partnerships@[yourdomain].com.' },
  { title: 'Community Channels', desc: 'Stay connected with our ecosystem: Twitter/X • Telegram • WhatsApp • Instagram. Community updates, roadmap announcements, and performance summaries are shared regularly.' },
  { title: 'Corporate Information', desc: '[Company Name] | Registered Entity: [If applicable] | Jurisdiction: [Country] | Business Address: [Virtual office or official address if available].' },
  { title: 'Security Notice', desc: 'We will never request private keys, wallet seed phrases, or direct fund transfers outside official platform channels. Always verify communications through our official domain and community channels.' },
  { title: 'Compliance & Reporting', desc: 'For compliance inquiries or regulatory communication: compliance@[yourdomain].com.' },
]

export default function ContactUsPage() {
  return (
    <PageLayout>
      <section className="relative z-40 pt-32 sm:pt-40 pb-12 sm:pb-16 px-6 sm:px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <p className="text-[#E4B5FF] text-xl font-medium uppercase tracking-wider mb-3">Contact Us</p>
          <h1 className="font-semibold leading-tight text-white mb-6 sm:mb-8" style={{ fontSize: 'clamp(2rem, 4.5vw, 4rem)' }}>
            Connect With Our Team
          </h1>
          <p className="text-[#C8C8C8] text-lg max-w-3xl mx-auto leading-relaxed">
            We welcome inquiries from investors, partners, and technology collaborators. Whether you have questions about our AI trading infrastructure, token participation model, or long-term vision, our team is here to assist.
          </p>
        </div>
      </section>

      <section className="relative z-40 px-6 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {contactBlocks.map((block) => (
              <div key={block.title} className="rounded-2xl bg-black/15 backdrop-blur-sm border border-white/10 p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                  {block.title}
                </h2>
                <p className="text-[#C8C8C8] text-base leading-relaxed">
                  {block.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-40 px-6 sm:px-6 pb-20 sm:pb-28">
        <div className="max-w-[600px] mx-auto text-center">
          <div className="rounded-2xl bg-[#0f0f1a]/90 border-2 border-white/20 p-8">
            <p className="text-lg text-white font-semibold leading-relaxed">We are building long-term AI-driven financial infrastructure. Serious inquiries are welcome.</p>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
