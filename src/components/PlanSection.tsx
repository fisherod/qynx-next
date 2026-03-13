import InvestNowLink from '@/components/InvestNowLink'

const plans = [
  {
    image: '/star_1_back.png',
    title: 'CORE HOLDER',
    benefits: [
      'Access to AI trading distributions',
      'Standard profit participation',
      'Governance voting rights',
      'Access to dashboard',
      '10% monthly guaranteed ROI',
    ],
    price: '$50 – $4,999',
    buttonText: 'Select Plan',
  },
  {
    image: '/star_2_back.png',
    title: 'STRATEGIC HOLDER',
    benefits: [
      'Enhanced profit share multiplier',
      'Reduced performance fees',
      'Priority buyback allocation',
      'Early access to new strategies',
      'Staking bonus rewards',
      '12% monthly guaranteed ROI',
    ],
    price: '$5,000–$14,999',
    buttonText: 'Upgrade to Pro',
  },
  {
    image: '/star_3_back.png',
    title: 'INSTITUTIONAL HOLDER',
    benefits: [
      'Maximum profit share allocation',
      'Lowest performance fees',
      'Priority capital deployment',
      'Direct strategy briefings',
      'Dedicated support line',
      'Early access to quantum research module',
      '14% monthly guaranteed ROI',
    ],
    price: '$15,000+',
    buttonText: 'Go Elite',
  },
]

export default function PlanSection() {
  return (
    <section id="investment" className="relative z-40 px-14 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-4 sm:py-6 md:py-9 w-full max-w-[100vw] overflow-x-hidden box-border">
      <div className="w-full min-w-0 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="text-center sm:text-left mb-6 sm:mb-7 md:mb-9">
          <h1
              className="font-semibold leading-tight text-white mb-1 sm:mb-2"
              style={{ fontSize: 'clamp(2rem, 5vw, 6rem)' }}
            >
             Flexible Plans for every one
          </h1>
        </div>

        {/* Plan cards - narrower on mobile via section padding */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-4 min-w-0">
          {plans.map((plan) => (
            <div
              key={plan.title}
              className="rounded-2xl border-2 border-white/25 overflow-hidden hover:border-purple-500/50 transition-colors duration-150 flex flex-col min-w-0 max-w-full"
            >
              {/* Purple gradient strip with icon */}
              <div className="relative m-4 md:m-6 rounded-xl overflow-hidden">
                <img
                  src={plan.image}
                  alt={plan.title}
                  width={400}
                  height={200}
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="pt-0 px-5 sm:px-6 pb-6 md:px-8 md:pb-8 flex flex-col flex-1 min-h-0 min-w-0">
                <h3 className="text-xl sm:text-3xl md:text-4xl text-white uppercase mb-4 break-words">{plan.title}</h3>

                <ul className="space-y-2 sm:space-y-3 text-[#C8C8C8] text-sm sm:text-fluid-lg md:text-fluid-xl mb-12 sm:mb-24 flex-1 min-w-0">
                  {plan.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-1 min-w-0">
                      <span className="text-white shrink-0">•</span>
                      <span className="text-sm sm:text-lg break-words">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <p className="text-2xl sm:text-3xl md:text-5xl text-white mb-4 sm:mb-6">
                    {plan.price}
                    <span className="text-[#C8C8C8] text-sm font-normal ml-2 align-baseline whitespace-nowrap">per month</span>
                  </p>

                  <InvestNowLink
                    className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 w-full max-w-[200px] sm:max-w-none mx-auto sm:mx-0 py-2.5 sm:py-3 md:py-4 px-5 sm:px-6 rounded-full text-center text-white text-sm sm:text-fluid-md font-medium transition-opacity hover:opacity-90 mb-4"
                    style={{ background: 'linear-gradient(90deg, #6B46C1 0%, #9333EA 100%)' }}
                  >
                    <span>{plan.buttonText}</span>
                    <span>&gt;</span>
                  </InvestNowLink>

                  <p className="text-[#C8C8C8] text-xs sm:text-fluid-sm md:text-fluid-base text-center">30-day money-back guarantee</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
