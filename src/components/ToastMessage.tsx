'use client'

/**
 * Toast message: light background, colored bottom border that progresses (shrinks) over duration.
 * Variants: success (green), error (red), info (blue), warning (orange).
 * Includes icon, title, optional subtitle, optional right content, close button, and progress bar.
 */

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessageProps {
  variant: ToastVariant
  /** Main title text */
  title: string
  /** Optional subtitle (secondary line) */
  subtitle?: string
  /** Optional right-side content (e.g. "+ 500" for info) */
  rightContent?: React.ReactNode
  /** Display duration in ms; bottom border progress runs over this. Default 5000. */
  duration?: number
  /** Called when user clicks close (optional). Pass to enable the dismiss X button. */
  onDismiss?: () => void
  /** Additional class for positioning. Use inline={true} for in-flow messages. */
  className?: string
  /** If true, do not apply fixed positioning. */
  inline?: boolean
  /** If true, progress bar animates in a loop (100% → 0% → repeat). Use for waiting/indeterminate toasts. */
  repeatingProgress?: boolean
  /** Duration in ms for one progress cycle when repeatingProgress is true. Default 2000. */
  progressCycleMs?: number
  /** Optional inline style (e.g. for stacking multiple toasts with different top). */
  style?: React.CSSProperties
  /** Minimum width in px. Default 280. */
  minWidth?: number
}

const variantStyles: Record<
  ToastVariant,
  {
    bg: string
    borderColor: string
    titleColor: string
    subtitleColor: string
    iconBg: string
    iconColor: string
    icon: React.ReactNode
  }
> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'bg-emerald-500',
    titleColor: 'text-gray-900 dark:text-gray-100',
    subtitleColor: 'text-gray-700 dark:text-gray-300',
    iconBg: 'bg-emerald-500',
    iconColor: 'text-white',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    borderColor: 'bg-red-500',
    titleColor: 'text-gray-900 dark:text-gray-100',
    subtitleColor: 'text-gray-700 dark:text-gray-300',
    iconBg: 'bg-red-500',
    iconColor: 'text-white',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'bg-blue-500',
    titleColor: 'text-gray-900 dark:text-gray-100',
    subtitleColor: 'text-gray-700 dark:text-gray-300',
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'bg-amber-500',
    titleColor: 'text-gray-900 dark:text-gray-100',
    subtitleColor: 'text-gray-700 dark:text-gray-300',
    iconBg: 'bg-amber-500',
    iconColor: 'text-white',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
}

const defaultPosition = 'fixed top-24 right-4 z-[60]'

// Progress bar shrinks from 100% to 0% over duration (CSS animation)

export default function ToastMessage({
  variant,
  title,
  subtitle,
  rightContent,
  duration = 5000,
  onDismiss,
  className = '',
  inline,
  repeatingProgress = false,
  progressCycleMs = 2000,
  style: inlineStyle,
  minWidth = 300,
}: ToastMessageProps) {
  const style = variantStyles[variant]
  const positionClass = inline ? className : (className.includes('fixed') ? className : `${defaultPosition} ${className}`)
  const durationSec = duration / 1000
  const cycleSec = progressCycleMs / 1000
  const progressAnimation = repeatingProgress
    ? `toast-progress ${cycleSec}s linear infinite`
    : `toast-progress ${durationSec}s linear forwards`
  const combinedStyle = { ...inlineStyle, minWidth: minWidth ? `${minWidth}px` : undefined }

  return (
    <>
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        className={`rounded-lg overflow-hidden shadow-lg max-w-[360px] ${style.bg} ${positionClass}`}
        role="alert"
        style={combinedStyle}
      >
        <div className="flex items-start gap-3 p-4">
          <span
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${style.iconBg} ${style.iconColor}`}
            aria-hidden
          >
            {style.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${style.titleColor}`}>{title}</p>
            {subtitle && <p className={`text-sm mt-0.5 ${style.subtitleColor}`}>{subtitle}</p>}
          </div>
          {(rightContent || onDismiss) && (
            <div className="flex items-center gap-2 shrink-0">
              {rightContent && <span className={`text-sm font-medium ${style.subtitleColor}`}>{rightContent}</span>}
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500"
                  aria-label="Dismiss"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
        {/* Bottom border: colored bar; when repeatingProgress, loops 100% → 0% repeatedly */}
        <div className="h-1 w-full bg-gray-200/50 dark:bg-gray-700/50 overflow-hidden">
          <div
            className={`h-full ${style.borderColor}`}
            style={{
              animation: progressAnimation,
              width: '100%',
            }}
          />
        </div>
      </div>
    </>
  )
}
