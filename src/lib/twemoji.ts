const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72'

/**
 * Returns the Twemoji CDN URL for a given emoji character.
 * Skips variation selectors (U+FE00–U+FE0F) so URLs resolve for 🛡️, ⚛️, etc.
 */
export function getTwemojiUrl(emoji: string): string {
  const codePoints: string[] = []
  for (let i = 0; i < emoji.length; i++) {
    const code = emoji.codePointAt(i)
    if (code !== undefined) {
      if (code < 0xfe00 || code > 0xfe0f) {
        codePoints.push(code.toString(16))
      }
      if (code > 0xffff) i++
    }
  }
  return `${TWEMOJI_BASE}/${codePoints.join('-')}.png`
}
