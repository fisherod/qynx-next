'use client'

/** Circular loading spinner in a dark rounded rectangle, centered in the viewport. */
export default function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      {/* <div className="inline-flex items-center justify-center rounded-2xl bg-black/50 border border-white/15 p-12 min-w-[260px] min-h-[200px]"> */}
      <div className="inline-flex items-center justify-center rounded-2xl min-w-[280px] min-h-[220px]">
        <div
          className="w-24 h-24 rounded-full border-4 border-[#D3D8DF] border-t-[#4285F4] animate-spin shrink-0"
          aria-hidden
        />
      </div>
    </div>
  )
}
