'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const USER_NOTE_STORAGE_KEY = 'qynx_user_note'

export default function FloatingButton() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(USER_NOTE_STORAGE_KEY)
      if (saved != null) setNote(saved)
    } catch {
      // ignore
    }
  }, [])

  const scrollToTop = () => {
    const start = window.scrollY
    const startTime = performance.now()
    const duration = 500

    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      window.scrollTo(0, start * (1 - eased))
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }

  const handleSaveNote = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(USER_NOTE_STORAGE_KEY, note)
        setNoteSaved(true)
        setTimeout(() => setNoteSaved(false), 2000)
      }
    } catch {
      // ignore
    }
  }

  const handleCloseNote = () => {
    setNoteOpen(false)
  }

  if (pathname?.startsWith('/admin')) return null

  return (
    <>
      {/* Chat / Note button - above back to top; clicked state = square + down chevron */}
      <button
        type="button"
        onClick={() => setNoteOpen((prev) => !prev)}
        aria-label={noteOpen ? 'Close' : 'Write a note'}
        className={`fixed bottom-24 right-6 z-[100] w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-white focus:outline-none ${noteOpen ? 'rounded-lg' : 'rounded-full'}`}
      >
        {noteOpen ? (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        ) : (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7.7L5.3 19.4V16H7a2 2 0 0 1-2-2V5z"
            />
            <path
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              d="M9 14.2q3 .8 6 0"
            />
          </svg>
        )}
      </button>

      {/* Back to top button - only when scrolled */}
      {visible && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-[100] w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white focus:outline-none"
        >
          <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Note modal - chat/feedback style */}
      {noteOpen && (
        <>
          <div
            className="fixed inset-0 z-[101] bg-black/40"
            aria-hidden
            onClick={handleCloseNote}
          />
          <div
            className="fixed inset-4 sm:inset-auto sm:right-6 sm:bottom-[10rem] sm:top-auto sm:left-auto z-[102] sm:w-[min(100vw-2rem,24rem)] sm:max-h-[min(65vh,18rem)] flex flex-col rounded-2xl bg-[#1a1a1f] border border-white/10 shadow-2xl overflow-hidden"
            role="dialog"
            aria-labelledby="note-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold text-sm">
                    Q
                  </div>
                  <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#1a1a1f]" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p id="note-modal-title" className="font-semibold text-white truncate">
                    Qynx Support
                  </p>
                  <p className="flex items-center gap-1 text-xs text-white/60">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Back tomorrow
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseNote}
                  aria-label="Close"
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 min-h-[4rem] bg-white/[0.03]">
              <p className="text-center text-white/70 text-sm sm:text-base">
                Ask us anything, or share your feedback.
              </p>
            </div>

            {/* Message input bar */}
            <div className="p-3 border-t border-white/10 shrink-0">
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="message..."
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
                />
                <button
                  type="button"
                  onClick={handleSaveNote}
                  aria-label="Send"
                  className="shrink-0 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
