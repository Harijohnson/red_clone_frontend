type Props = {
  from: string
  to: string
  duration?: string
}

export function RouteMapSvg({ from, to, duration }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-gradient-to-r from-primary/5 via-card to-emerald-500/5 px-5 py-4">
      {/* Origin */}
      <div className="flex min-w-0 shrink-0 flex-col items-center gap-1.5">
        <div className="relative flex items-center justify-center">
          <span className="absolute h-5 w-5 animate-ping rounded-full bg-primary/25" />
          <span className="relative h-3 w-3 rounded-full bg-primary" />
        </div>
        <p className="max-w-[80px] truncate text-center text-xs font-semibold">{from}</p>
      </div>

      {/* Road */}
      <div className="relative flex flex-1 flex-col items-center">
        {/* Bus icon floating above the road */}
        <div className="mb-1.5 text-primary">
          <svg
            viewBox="0 0 40 22"
            width="40"
            height="22"
            fill="currentColor"
            aria-hidden="true"
          >
            {/* Body */}
            <rect x="2" y="5" width="30" height="13" rx="3" />
            {/* Roof */}
            <rect x="4" y="2" width="24" height="8" rx="2" fillOpacity="0.65" />
            {/* Windows */}
            <rect x="6" y="6.5" width="6" height="4" rx="1" fill="white" fillOpacity="0.55" />
            <rect x="15" y="6.5" width="6" height="4" rx="1" fill="white" fillOpacity="0.55" />
            {/* Wheels */}
            <circle cx="9" cy="18.5" r="2.8" />
            <circle cx="25" cy="18.5" r="2.8" />
            {/* Bumper / exhaust */}
            <rect x="32" y="8" width="3" height="6" rx="1.5" />
          </svg>
        </div>

        {/* Dotted road */}
        <div className="flex w-full items-center gap-0.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="h-0.5 flex-1 rounded-full bg-border" />
          ))}
        </div>

        {duration && (
          <p className="mt-1.5 text-center text-xs text-muted-foreground">{duration}</p>
        )}
      </div>

      {/* Destination */}
      <div className="flex min-w-0 shrink-0 flex-col items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
        <p className="max-w-[80px] truncate text-center text-xs font-semibold">{to}</p>
      </div>
    </div>
  )
}
