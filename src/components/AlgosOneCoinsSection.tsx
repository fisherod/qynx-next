'use client'

/**
 * Exact replica of the AlgosOne "Trading Up" coins animation:
 * same coin images (from public/coins/), same layout and cycling labels (+70%, +35%, +5%, x8, x3).
 * Copy images first: node scripts/copy-algosone-coins.js
 */

import { useEffect, useRef } from 'react'
import styles from './AlgosOneCoinsSection.module.css'

/* Order and initial label match reference along trend line */
const COIN_IMAGES = [
  { id: 'eth', image: 'ephirium', light: 'ephirium-light', initialText: '+5%' },
  { id: 'sol', image: 'solana', light: 'solana-light', initialText: '+70%' },
  { id: 'ltc', image: 'litecoin', light: 'litecoin-light', initialText: '' },
  { id: 'btc', image: 'bitcoin', light: 'bitcoin-light', initialText: 'x3' },
  { id: 'xmr', image: 'monero', light: 'monero-light', initialText: '+5%' },
] as const

const TEXT_ITEMS = ['', '', '+70%', '+35%', '+5%', 'x8', 'x3'] as const

function CoinBlock({
  imageName,
  lightName,
  initialText,
}: {
  imageName: string
  lightName: string
  initialText: string
}) {
  const textRef = useRef<HTMLDivElement>(null)
  const imageBase = '/coins'

  useEffect(() => {
    const container = textRef.current
    if (!container) return
    const items = container.querySelectorAll<HTMLElement>('[data-coin-text-item]')
    const run = () => {
      items.forEach((el) => el.classList.add(styles.coinTextItemHidden))
      const idx = Math.round(Math.random() * (items.length - 1))
      items[idx]?.classList.remove(styles.coinTextItemHidden)
    }
    const t = setTimeout(run, 500 + Math.random() * 500)
    const id = setInterval(run, 1000 + Math.random() * 1000)
    return () => {
      clearTimeout(t)
      clearInterval(id)
    }
  }, [])

  return (
    <div className={styles.coin}>
      <div className={styles.coinImgWrap}>
        <img
          src={`${imageBase}/${lightName}.png.webp`}
          alt=""
          className={styles.coinLight}
          loading="lazy"
        />
        <img
          src={`${imageBase}/${imageName}.png.webp`}
          alt=""
          className={styles.coinImage}
          loading="lazy"
        />
      </div>
      <div ref={textRef} className={styles.coinText}>
        {TEXT_ITEMS.map((text, i) => {
          const isVisible = initialText !== '' && text === initialText
          const isYellow = text === 'x8' || text === 'x3'
          return (
            <div
              key={i}
              data-coin-text-item
              className={`${styles.coinTextItem} ${!isVisible ? styles.coinTextItemHidden : ''}`}
              style={isYellow ? { color: '#FBDF7C' } : undefined}
            >
              {text}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AlgosOneCoinsSection() {
  return (
    <section className={`${styles.section} relative z-40 px-4 sm:px-6 py-8 sm:py-16`}>
      <div className="w-full max-w-[92%] sm:max-w-[900px] mx-auto">
        <div className={styles.algosCoins}>
          {COIN_IMAGES.map((coin) => (
            <CoinBlock
              key={coin.id}
              imageName={coin.image}
              lightName={coin.light}
              initialText={coin.initialText}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
