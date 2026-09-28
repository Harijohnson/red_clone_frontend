import type { SeatEntry, DeckType, SeatType } from "@/types"

type Props = {
  seats: SeatEntry[]
  selected: Set<string>
  onToggle: (seatNumber: string) => void
  maxSelect?: number
}

const DECK_LABEL: Record<DeckType, string> = {
  lower: "Lower Deck",
  upper: "Upper Deck",
  single: "",
}

// Left group = cols 1..aisleAfter, right group = rest
function getAisleAfter(maxCol: number): number {
  if (maxCol <= 1) return maxCol
  return Math.ceil(maxCol / 2)
}

function colPositionLabel(col: number, maxCol: number): string {
  if (maxCol === 4) return (["Window", "Aisle", "Aisle", "Window"] as const)[col - 1] ?? ""
  if (maxCol === 3) return (["Window", "Aisle", "Window"] as const)[col - 1] ?? ""
  if (maxCol === 2) return (["Window", "Aisle"] as const)[col - 1] ?? ""
  return `Col ${col}`
}

export default function SeatGrid({ seats, selected, onToggle, maxSelect = 6 }: Props) {
  const decks = groupByDeck(seats)
  const deckOrder: DeckType[] = ["single", "lower", "upper"]

  return (
    <div className="flex flex-col gap-10">
      {deckOrder.map((deck) => {
        const deckSeats = decks.get(deck)
        if (!deckSeats || deckSeats.length === 0) return null

        const rows = groupByRow(deckSeats)
        const maxCol = Math.max(...deckSeats.map((s) => s.column))
        const aisleAfter = getAisleAfter(maxCol)
        const seatType = deckSeats[0]?.type ?? "seater"
        const available = deckSeats.filter(
          (s) => s.status === "available" && !s.isLockedByMe,
        ).length
        const totalSeats = deckSeats.length

        return (
          <div key={deck}>
            {DECK_LABEL[deck] && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {DECK_LABEL[deck]}
              </p>
            )}

            <div className="inline-block overflow-hidden rounded-2xl border-2 border-border bg-card shadow-sm">
              {/* Bus front / driver */}
              <div className="flex items-center justify-between border-b bg-muted/50 px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <SteeringWheelIcon />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Front of Bus
                    </p>
                    <p className="text-[9px] capitalize text-muted-foreground/60">{seatType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-green-600 dark:text-green-400">
                    {available} available
                  </p>
                  <p className="text-[9px] text-muted-foreground">{totalSeats} seats total</p>
                </div>
              </div>

              <div className="p-4">
                {/* Column position labels */}
                <ColHeader maxCol={maxCol} aisleAfter={aisleAfter} />

                {/* Seat rows */}
                <div className="mt-2 flex flex-col gap-2">
                  {Array.from(rows.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([rowNum, rowSeats]) => (
                      <SeatRow
                        key={rowNum}
                        row={rowNum}
                        seats={rowSeats}
                        maxCol={maxCol}
                        aisleAfter={aisleAfter}
                        seatType={seatType}
                        selected={selected}
                        onToggle={onToggle}
                        maxSelect={maxSelect}
                        totalSelected={selected.size}
                      />
                    ))}
                </div>
              </div>

              {/* Bus rear */}
              <div className="flex items-center justify-center border-t bg-muted/30 px-5 py-2">
                <div className="flex items-center gap-4">
                  <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40">
                    Rear of Bus
                  </span>
                  <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Column header row
// ---------------------------------------------------------------------------

function ColHeader({ maxCol, aisleAfter }: { maxCol: number; aisleAfter: number }) {
  const leftCols = Array.from({ length: aisleAfter }, (_, i) => i + 1)
  const rightCols = Array.from({ length: maxCol - aisleAfter }, (_, i) => aisleAfter + i + 1)

  return (
    <div className="flex items-center gap-3 pl-9">
      <div className="flex gap-2">
        {leftCols.map((col) => (
          <div
            key={col}
            className="flex w-[52px] items-center justify-center text-[9px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            {colPositionLabel(col, maxCol)}
          </div>
        ))}
      </div>
      <div className="w-8" />
      <div className="flex gap-2">
        {rightCols.map((col) => (
          <div
            key={col}
            className="flex w-[52px] items-center justify-center text-[9px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            {colPositionLabel(col, maxCol)}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single seat row
// ---------------------------------------------------------------------------

function SeatRow({
  row,
  seats,
  maxCol,
  aisleAfter,
  seatType,
  selected,
  onToggle,
  maxSelect,
  totalSelected,
}: {
  row: number
  seats: SeatEntry[]
  maxCol: number
  aisleAfter: number
  seatType: SeatType
  selected: Set<string>
  onToggle: (sn: string) => void
  maxSelect: number
  totalSelected: number
}) {
  const byCol = new Map(seats.map((s) => [s.column, s]))
  const leftCols = Array.from({ length: aisleAfter }, (_, i) => i + 1)
  const rightCols = Array.from({ length: maxCol - aisleAfter }, (_, i) => aisleAfter + i + 1)

  return (
    <div className="flex items-center gap-3">
      {/* Row number */}
      <span className="w-6 shrink-0 text-right text-[10px] font-semibold text-muted-foreground/60">
        {row}
      </span>

      {/* Left-side seats */}
      <div className="flex gap-2">
        {leftCols.map((col) => {
          const seat = byCol.get(col)
          if (!seat) return <div key={col} className="h-[58px] w-[52px]" />
          return (
            <SeatButton
              key={seat.number}
              seat={seat}
              seatType={seatType}
              isSelected={selected.has(seat.number)}
              onToggle={onToggle}
              canSelect={totalSelected < maxSelect || selected.has(seat.number)}
            />
          )
        })}
      </div>

      {/* Aisle */}
      <div className="flex w-8 flex-col items-center justify-center self-stretch">
        <div className="h-full w-0 border-l-2 border-dashed border-muted-foreground/15" />
      </div>

      {/* Right-side seats */}
      <div className="flex gap-2">
        {rightCols.map((col) => {
          const seat = byCol.get(col)
          if (!seat) return <div key={col} className="h-[58px] w-[52px]" />
          return (
            <SeatButton
              key={seat.number}
              seat={seat}
              seatType={seatType}
              isSelected={selected.has(seat.number)}
              onToggle={onToggle}
              canSelect={totalSelected < maxSelect || selected.has(seat.number)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual seat button
// ---------------------------------------------------------------------------

function SeatButton({
  seat,
  seatType,
  isSelected,
  onToggle,
  canSelect,
}: {
  seat: SeatEntry
  seatType: SeatType
  isSelected: boolean
  onToggle: (sn: string) => void
  canSelect: boolean
}) {
  const isUnavailable =
    seat.status === "booked" || (seat.status === "locked" && !seat.isLockedByMe)
  const disabled = isUnavailable || (!isSelected && !canSelect)

  let classes =
    "text-foreground/70 bg-muted hover:bg-muted/70 hover:scale-105 hover:shadow-sm"
  if (isUnavailable)
    classes = "text-muted-foreground/25 bg-muted/20 cursor-not-allowed"
  else if (isSelected)
    classes =
      "text-primary-foreground bg-primary ring-2 ring-primary ring-offset-2 scale-105 shadow-md"
  else if (seat.isLockedByMe)
    classes =
      "text-amber-600 dark:text-amber-400 bg-amber-500/20 ring-1 ring-amber-400 hover:scale-105"
  else if (seat.isFemaleSeat)
    classes =
      "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 ring-1 ring-rose-300 dark:ring-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:scale-105"

  return (
    <button
      type="button"
      disabled={disabled}
      title={seatTitle(seat, isSelected, canSelect)}
      onClick={() => !disabled && onToggle(seat.number)}
      className={`relative flex h-[58px] w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-150 ${classes}`}
    >
      {/* Seat type icon */}
      <SeatIcon type={seatType} isUnavailable={isUnavailable} />

      {/* Seat number */}
      <span className="text-[10px] font-bold leading-none">{seat.number}</span>

      {/* Female-only badge */}
      {seat.isFemaleSeat && !isUnavailable && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
          ♀
        </span>
      )}

      {/* Booked — cross overlay */}
      {seat.status === "booked" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl">
          <div className="absolute h-px w-8 rotate-45 bg-muted-foreground/40" />
          <div className="absolute h-px w-8 -rotate-45 bg-muted-foreground/40" />
        </div>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// SVG seat icons — each shows the seat shape from above
// ---------------------------------------------------------------------------

function SeatIcon({
  type,
  size = 22,
  isUnavailable = false,
}: {
  type: SeatType
  size?: number
  isUnavailable?: boolean
}) {
  const opacity = isUnavailable ? 0.25 : 1

  if (type === "sleeper") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 26"
        fill="none"
        style={{ opacity }}
        aria-hidden="true"
      >
        {/* Pillow */}
        <rect x="2" y="1" width="20" height="7" rx="3" fill="currentColor" fillOpacity="0.45" />
        {/* Berth */}
        <rect x="2" y="10" width="20" height="15" rx="3" fill="currentColor" />
      </svg>
    )
  }

  if (type === "semi-sleeper") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 26"
        fill="none"
        style={{ opacity }}
        aria-hidden="true"
      >
        {/* Reclined back */}
        <rect x="2" y="1" width="20" height="10" rx="3" fill="currentColor" fillOpacity="0.6" />
        {/* Extended seat */}
        <rect x="2" y="13" width="20" height="12" rx="3" fill="currentColor" />
      </svg>
    )
  }

  // seater — upright chair from above
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 26"
      fill="none"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Chair back */}
      <rect x="3" y="1" width="18" height="8" rx="3" fill="currentColor" fillOpacity="0.6" />
      {/* Seat cushion */}
      <rect x="3" y="11" width="18" height="11" rx="3" fill="currentColor" />
      {/* Left armrest */}
      <rect x="0" y="11" width="5" height="8" rx="2" fill="currentColor" fillOpacity="0.35" />
      {/* Right armrest */}
      <rect x="19" y="11" width="5" height="8" rx="2" fill="currentColor" fillOpacity="0.35" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Steering wheel icon for bus front indicator
// ---------------------------------------------------------------------------

function SteeringWheelIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      className="text-muted-foreground/40"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="11" cy="11" r="3.5" fill="currentColor" fillOpacity="0.5" />
      <line x1="11" y1="2" x2="11" y2="7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="11" x2="14.5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="11" x2="7.5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Seat tooltip title
// ---------------------------------------------------------------------------

function seatTitle(seat: SeatEntry, isSelected: boolean, canSelect: boolean): string {
  const typeName = seat.type === "semi-sleeper" ? "Semi-sleeper" : seat.type.charAt(0).toUpperCase() + seat.type.slice(1)
  if (seat.status === "booked") return `${seat.number} — Booked (${typeName})`
  if (seat.status === "locked" && !seat.isLockedByMe) return `${seat.number} — Held by another`
  if (seat.isLockedByMe) return `${seat.number} — Your hold · ₹${seat.price.toLocaleString("en-IN")}`
  if (!isSelected && !canSelect) return `${seat.number} — Maximum seats already selected`
  const femaleTag = seat.isFemaleSeat ? " · Ladies only" : ""
  return `${seat.number} — ₹${seat.price.toLocaleString("en-IN")} · ${typeName}${femaleTag}`
}

// ---------------------------------------------------------------------------
// Group helpers
// ---------------------------------------------------------------------------

function groupByDeck(seats: SeatEntry[]): Map<DeckType, SeatEntry[]> {
  const map = new Map<DeckType, SeatEntry[]>()
  for (const seat of seats) {
    const group = map.get(seat.deck) ?? []
    group.push(seat)
    map.set(seat.deck, group)
  }
  return map
}

function groupByRow(seats: SeatEntry[]): Map<number, SeatEntry[]> {
  const map = new Map<number, SeatEntry[]>()
  for (const seat of seats) {
    const group = map.get(seat.row) ?? []
    group.push(seat)
    map.set(seat.row, group)
  }
  return map
}
