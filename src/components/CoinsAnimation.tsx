"use client";

/**
 * AlgosOne-style coins animation: crypto coins with performance labels (+70%, +35%, +5%, x8, x3).
 * Uses SVG coin placeholders (no external image files).
 */

const COINS = [
  { id: "eth", label: "ETH", color: "#627EEA", visibleText: "+35%", textYellow: false },
  { id: "btc", label: "B", color: "#F7931A", visibleText: "x3", textYellow: true },
  { id: "ltc", label: "Ł", color: "#BFBBBB", visibleText: "+35%", textYellow: false },
  { id: "sol", label: "S", color: "#9945FF", visibleText: "+5%", textYellow: false },
  { id: "usdt", label: "₮", color: "#26A17B", visibleText: null, textYellow: false },
  { id: "qynx", label: "Q", color: "#A78BFA", visibleText: "+70%", textYellow: false }
] as const;

const TEXT_ITEMS = ["", "", "+70%", "+35%", "+5%", "x8", "x3"] as const;

function CoinSvg({ label, color }: { label: string; color: string }) {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`coin-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.6} />
        </linearGradient>
        <filter id={`shadow-${label}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity={0.4} />
        </filter>
      </defs>
      <circle
        cx="32"
        cy="32"
        r="28"
        fill={`url(#coin-${label})`}
        filter={`url(#shadow-${label})`}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fill="white"
        fontSize="24"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

function CoinCard({
  label,
  color,
  visibleText,
  textYellow
}: {
  label: string;
  color: string;
  visibleText: string | null;
  textYellow: boolean;
}) {
  return (
    <div className="coins-animation__coin">
      <div className="coins-animation__coin-image-wrap">
        <CoinSvg label={label} color={color} />
      </div>
      <div className="coins-animation__coin-text">
        {TEXT_ITEMS.map((text, i) => {
          const isVisible = text === visibleText;
          const isYellow = text === "x8" || text === "x3";
          return (
            <div
              key={i}
              className={`coins-animation__coin-text-item ${!isVisible ? "coins-animation__coin-text-item_hidden" : ""}`}
              style={isYellow ? { color: "#FBDF7C" } : undefined}
            >
              {text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CoinsAnimation() {
  return (
    <div className="coins-animation mt-10 sm:mt-12">
      {COINS.map(coin => (
        <CoinCard
          key={coin.id}
          label={coin.label}
          color={coin.color}
          visibleText={coin.visibleText}
          textYellow={coin.textYellow}
        />
      ))}
    </div>
  );
}
