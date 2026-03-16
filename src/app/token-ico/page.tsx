import Link from "next/link";
import InvestNowLink from "@/components/InvestNowLink";
import PageLayout from "@/components/PageLayout";
import AlgosOneCoinsSection from "@/components/landing/AlgosOneCoinsSection";
import ListWithCircles from "@/components/landing/ListWithCircles";

// Stage 4 = current ($0.0154). Stages 1–3 lower; stages 5–10+ much higher.
const presaleStages = [
  { stage: "Presale 1", tokenPct: "1.000%", minPrice: "0.006", actualPrice: "0.008" },
  { stage: "Presale 2", tokenPct: "1.000%", minPrice: "0.008", actualPrice: "0.0105" },
  { stage: "Presale 3", tokenPct: "2.000%", minPrice: "0.011", actualPrice: "0.0132" },
  { stage: "Presale 4", tokenPct: "2.000%", minPrice: "0.014", actualPrice: "0.0154" }, // current
  { stage: "Presale 5", tokenPct: "2.500%", minPrice: "0.018", actualPrice: "0.024" },
  { stage: "Presale 6", tokenPct: "3.000%", minPrice: "0.028", actualPrice: "0.038" },
  { stage: "Presale 7", tokenPct: "5.000%", minPrice: "0.045", actualPrice: "0.062" },
  { stage: "Presale 8", tokenPct: "7.000%", minPrice: "0.070", actualPrice: "0.095" },
  { stage: "Presale 9", tokenPct: "7.500%", minPrice: "0.105", actualPrice: "0.145" },
  { stage: "Presale 10", tokenPct: "7.000%", minPrice: "0.160", actualPrice: "0.220" },
  { stage: "Presale 11", tokenPct: "7.000%", minPrice: "0.240", actualPrice: "0.335" },
  { stage: "Presale 12", tokenPct: "6.000%", minPrice: "0.360", actualPrice: "0.502" }
];

const listItems = [
  {
    id: "overview",
    title: "Token Overview",
    desc: "Token Name: QYNX | Ticker: QNX | Total Supply: 1,000,000,000 Tokens | Current Phase Price: $0.0154 | Token Type: Utility / Ecosystem Participation Token. The token serves as the core participation mechanism within our AI trading ecosystem."
  },
  {
    id: "utility",
    title: "Token Utility",
    desc: "Token holders gain access to AI trading performance distributions, participation in revenue-backed buybacks, governance voting rights, reduced platform and performance fees, staking incentives, early access to new trading modules, and guaranteed buybacks. Token utility expands as the ecosystem scales."
  },
  {
    id: "buyback",
    title: "Revenue-Backed Buyback Mechanism",
    desc: "A portion of AI trading revenue is allocated to periodic open-market token buybacks. This mechanism is designed to support token liquidity, strengthen price stability, reduce circulating supply when burns are applied, and align token value with trading performance. Buybacks are performance-based and transparently disclosed."
  },
  {
    id: "capital",
    title: "Capital Appreciation",
    desc: "The Qynx token is designed to capture the long-term growth and expansion of the ecosystem. The total supply is capped at 1 billion tokens, ensuring controlled issuance and long-term scarcity. Participants at higher platform tiers may receive priority allocation and access to larger portions of the limited supply. The token will be released in structured rounds, with each successive phase expected to be offered at a higher valuation. Following the completion of all pre-sale phases, the platform guarantees all buybacks according to the token vesting structure you choose, supported by ecosystem revenues and treasury allocation, with a planned initial target of up to $100 million. Full details are outlined in the Tokenomics and Whitepaper."
  },
  {
    id: "distribution",
    title: "Distribution Model",
    desc: "The AI trading engine targets structured monthly performance. Investor distributions are derived from actual trading results. Target model: starting from 11% monthly performance-based distributions, depending on market conditions. There are no guaranteed returns."
  },
  {
    id: "allocation",
    title: "Token Allocation",
    desc: "Total Supply: 1,000,000,000. 40% – Public ICO, 5% – Team & Founders (Vested for 3 years), 15% – Ecosystem & Treasury, 20% – Staking Rewards, 15% – Liquidity & Market Making, 5% – Marketing & Partnerships. Team tokens are subject to vesting schedules to ensure long-term alignment."
  },
  {
    id: "vesting",
    title: "Vesting Structure",
    desc: "To promote sustainability and prevent early dilution: team allocation 24-month vesting, advisor allocation 12-month vesting, no immediate large unlock events, controlled release schedule. This protects token holders from sudden supply shocks."
  },
  {
    id: "ico",
    title: "ICO Structure",
    desc: "Phase 1 — Early Access: Price $0.0154, limited allocation, priority access. Phase 2 — Expansion Phase: Price increase based on milestone achievement. Phase 3 — Final Public Phase: Final pre-listing price. Allocation per phase is limited."
  },
  {
    id: "usefunds",
    title: "Use of ICO Funds",
    desc: "Funds raised through the ICO will be allocated toward expanding trading capital, AI model development, infrastructure scaling, risk management systems, security and audits, and strategic reserves. Capital deployment is designed to enhance ecosystem resilience and scalability."
  },
  {
    id: "value",
    title: "Long-Term Value Drivers",
    desc: "Token value is supported by AI trading performance, revenue-backed buybacks, controlled token supply, ecosystem expansion, staking participation, governance rights, and platform growth. Our objective is sustainable value creation — not short-term speculation."
  },
  {
    id: "transparency",
    title: "Transparency & Reporting",
    desc: "We commit to monthly performance summaries, buyback disclosures, token supply transparency, roadmap updates, and clear capital allocation communication. Structured reporting strengthens long-term investor trust."
  }
];

export default function TokenIcoPage() {
  return (
    <PageLayout>
      <section className="relative z-40 pt-40 sm:pt-48 pb-12 sm:pb-16 px-6 sm:px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <p className="text-[#E4B5FF] text-xl font-medium uppercase tracking-wider mb-3">Token & ICO</p>
          <h1
            className="font-semibold leading-tight text-white mb-6 sm:mb-8"
            style={{ fontSize: "clamp(2rem, 4.5vw, 4rem)" }}
          >
            The Engine Behind the Ecosystem
          </h1>
          <p className="text-[#C8C8C8] text-lg max-w-3xl mx-auto leading-relaxed">
            Our native token powers the AI trading infrastructure and aligns investor participation with platform
            performance.
          </p>
          <p className="text-[#C8C8C8] text-lg max-w-3xl mx-auto leading-relaxed mt-4">
            It is not designed as a speculative instrument — it is structured to reflect ecosystem growth, trading
            performance, and long-term capital deployment.
          </p>
        </div>
      </section>

      <AlgosOneCoinsSection />

      <section className="relative z-40 px-6 sm:px-6 pb-12 sm:pb-16">
        <div className="max-w-[1200px] mx-auto">
          <div className="rounded-2xl bg-black/15 backdrop-blur-sm border border-white/10 overflow-hidden">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white p-6 sm:p-8 border-b border-white/10">
              Presale Stages
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-white/90 font-semibold text-sm sm:text-base py-4 px-6 sm:px-6">STAGE</th>
                    <th className="text-white/90 font-semibold text-sm sm:text-base py-4 px-6 sm:px-6">
                      TOKEN PERCENTAGE
                    </th>
                    <th className="text-white/90 font-semibold text-sm sm:text-base py-4 px-6 sm:px-6">
                      MINIMAL STARTING PRICE
                    </th>
                    <th className="text-white/90 font-semibold text-sm sm:text-base py-4 px-6 sm:px-6">
                      ACTUAL STARTING PRICE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {presaleStages.map(row => (
                    <tr key={row.stage} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="text-white py-3 px-6 sm:px-6 text-sm sm:text-base">{row.stage}</td>
                      <td className="text-[#C8C8C8] py-3 px-6 sm:px-6 text-sm sm:text-base">{row.tokenPct}</td>
                      <td className="text-[#C8C8C8] py-3 px-6 sm:px-6 text-sm sm:text-base">{row.minPrice}</td>
                      <td className="text-[#C8C8C8] py-3 px-6 sm:px-6 text-sm sm:text-base">{row.actualPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <p className="text-xl sm:text-2xl text-white font-semibold leading-relaxed mb-4">
              Own the Infrastructure Behind AI-Driven Crypto Trading
            </p>
            <p className="text-[#C8C8C8] text-lg leading-relaxed mb-4">
              This token represents participation in a scalable AI-powered asset management ecosystem.
            </p>
            <p className="text-[#E4B5FF] text-xl font-semibold mb-8">
              Current token price: $0.0154 — Early-phase allocation is limited.
            </p>
            <InvestNowLink
              className="inline-flex items-center justify-center gap-2 px-8 py-4 sm:px-10 sm:py-5 rounded-full text-white text-lg font-medium transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(90deg, #6B46C1 0%, #A78BFA 100%)" }}
            >
              <span>Invest Now</span>
              <span>&gt;</span>
            </InvestNowLink>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
