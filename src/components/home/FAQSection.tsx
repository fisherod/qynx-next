"use client";

import { useState } from "react";

const faqItems = [
  {
    question: "What does the AI actually do?",
    answer: {
      paragraph:
        "Our proprietary AI trading engine analyzes real-time market data, order flow, volatility, and sentiment across major crypto exchanges.",
      intro: "The system:",
      listItems: [
        "Executes trades automatically using multi-strategy deployment",
        "Built-in risk management protocols designed to adapt to changing market conditions",
        "Operates 24/7 without emotional bias or manual intervention"
      ]
    }
  },
  {
    question: "Do I need trading experience?",
    answer: {
      paragraph: "No. The platform is fully automated.",
      intro: "How it works:",
      listItems: [
        "Investors participate through the token ecosystem",
        "AI engine manages strategy execution, hedging, and portfolio optimization",
        "You do not need to trade manually"
      ]
    }
  },
  {
    question: "How do investors earn returns?",
    answer: {
      paragraph: "Investor returns are generated through the performance of our AI trading strategies.",
      intro: "Profits are distributed according to the token participation model and include:",
      listItems: [
        "Monthly performance-based distributions",
        "Revenue-backed buybacks",
        "Staking rewards (if applicable)"
      ]
    }
  },
  {
    question: "Is the 11% monthly return guaranteed?",
    answer: {
      paragraph: "Yes. The monthly return is guaranteed through our already set up profit pool.",
      intro: "Our system:",
      listItems: [
        "Targets structured monthly distributions",
        "Based on historical strategy performance and disciplined risk management",
        "All results depend on actual trading performance"
      ]
    }
  },
  {
    question: "How does the token buyback work?",
    answer: {
      paragraph: "A portion of trading revenue is allocated to periodic token buybacks from the open market.",
      intro: "This mechanism:",
      listItems: [
        "Supports token liquidity",
        "Reduces circulating supply (if burns are applied)",
        "Aligns platform success with token value"
      ]
    }
  },
  {
    question: "How is risk managed?",
    answer: {
      paragraph: "Risk management is embedded at multiple levels.",
      intro: "Key areas:",
      listItems: [
        "Position-level exposure limits",
        "Strategy diversification",
        "Hedging across market conditions",
        "Continuous volatility monitoring",
        "Automated stop-loss protocols",
        "Focus on long-term sustainability over short-term speculation"
      ]
    }
  },
  {
    question: "Are my funds held on the platform?",
    answer: {
      paragraph: "Token purchases are processed via secure blockchain transactions.",
      intro: "We manage:",
      listItems: [
        "Trading capital under structured operational protocols",
        "Transparency in allocation and performance reporting",
        "All unused funds are held in cold storage wallets"
      ]
    }
  },
  {
    question: "How transparent is performance reporting?",
    answer: {
      paragraph: "We provide comprehensive reporting to investors.",
      intro: "We provide:",
      listItems: [
        "Monthly performance summaries",
        "Token supply and buyback disclosures",
        "Roadmap and treasury updates"
      ]
    }
  },
  {
    question: "What gives the token long-term value?",
    answer: {
      paragraph: "Token value is supported by multiple factors.",
      intro: "Token value is supported by:",
      listItems: [
        "Revenue-backed buybacks",
        "Utility within the AI ecosystem",
        "Governance participation",
        "Staking incentives",
        "Ecosystem expansion"
      ]
    }
  },
  {
    question: "What is the long-term vision?",
    answer: {
      paragraph: "Our goal is to build a scalable AI-driven asset management infrastructure.",
      intro: "We focus on:",
      listItems: ["Continuous technology upgrades", "Advanced AI research", "Long-term expansion toward public markets"]
    }
  },
  {
    question: "Is the token buyback guaranteed?",
    answer: {
      paragraph: "Our goal is to build a scalable AI-driven asset management infrastructure.",
      intro: "We guarantee:",
      listItems: [
        "Our ecosystem includes a structured token buyback program funded by platform revenue.",
        "Participants may choose to lock their tokens for a selected period (1 month, 3 months, 6 months, or 12 months)",
        "At the end of each lock-up cycle, holders can either renew their participation for another term or unlock their tokens.",
        "Distributions and profit allocations are processed on a weekly basis, subject to platform performance and operational schedules.",
        "All distributions, profit participation, and token buyback transactions are conducted in supported stablecoins, including USDT, USDC, and DAI, to provide stability and transparency."
      ]
    }
  },
  {
    question: "How does QYNX handle payouts?",
    answer: {
      paragraph: "Our goal is to build a scalable AI-driven asset management infrastructure.",
      intro: "QYNX handles payouts:",
      listItems: [
        "Provide stability and efficiency in settlement.",
        "Participants can view their distribution history and transaction records directly within their dashboard for full transparency."
      ]
    }
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative z-40 px-14 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-12 sm:py-16 md:py-24 w-full max-w-[100vw] overflow-x-hidden box-border">
      <div className="w-full min-w-0 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="text-center sm:text-left mb-8 sm:mb-9 md:mb-12">
          <h1
            className="font-semibold leading-tight text-white mb-1 sm:mb-2"
            style={{ fontSize: "clamp(2rem, 5vw, 6rem)" }}
          >
            Questions & Answers
          </h1>
        </div>

        {/* FAQ Accordion - same mobile margin as FeatureSection / PlanSection */}
        <div className="flex flex-col gap-3 sm:gap-4 min-w-0">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="rounded-xl bg-black/15 backdrop-blur-sm border border-white/10 overflow-hidden p-4 sm:p-6 min-w-0 max-w-full"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between gap-3 sm:gap-4 py-1 text-left hover:bg-white/5 transition-colors rounded min-w-0"
              >
                <span className="text-base sm:text-lg md:text-xl font-semibold text-white pr-2 sm:pr-4 break-words min-w-0">
                  {item.question}
                </span>
                <span className="shrink-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 text-white transition-transform duration-200 ${openIndex === index ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </span>
              </button>
              {openIndex === index && (
                <div className="border-t border-white/10 pt-3 sm:pt-4 mt-0">
                  <div className="text-[#C8C8C8] text-sm sm:text-base leading-relaxed space-y-3 min-w-0">
                    <p className="break-words">{item.answer.paragraph}</p>
                    <p className="break-words">{item.answer.intro}</p>
                    <ul className="space-y-2 min-w-0">
                      {item.answer.listItems.map(listItem => (
                        <li key={listItem} className="flex items-start gap-2 min-w-0">
                          <span className="text-white shrink-0">•</span>
                          <span className="break-words">{listItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
