'use client'

export type ListWithCirclesItem = { id: string; title: string; desc: string }

function ListColumn({ items }: { items: ListWithCirclesItem[] }) {
  return (
    <div className="relative pl-0">
      {items.length > 1 && (
        <div
          className="absolute left-[7px] top-2 bottom-2 w-px bg-white/40 hidden md:block"
          aria-hidden
        />
      )}
      <div className="relative flex flex-col gap-0">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 sm:gap-5 pb-8 sm:pb-10">
            <div className="flex-shrink-0 w-6 flex justify-center pt-1.5">
              <div className="w-4 h-4 rounded-full border-2 border-white bg-transparent flex-shrink-0" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white uppercase tracking-wide mb-2">
                {item.title}
              </h3>
              <p className="text-[#A0A0A0] text-sm sm:text-base leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ListWithCircles({ items }: { items: ListWithCirclesItem[] }) {
  const half = Math.ceil(items.length / 2)
  const left = items.slice(0, half)
  const right = items.slice(half)
  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 lg:gap-x-16 gap-y-4">
        <ListColumn items={left} />
        <ListColumn items={right} />
      </div>
    </div>
  )
}
