import type { SeatEntry, DeckType } from "@/types"

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

export default function SeatGrid({ seats, selected, onToggle, maxSelect = 6 }: Props) {
  const decks = groupByDeck(seats)
  const deckOrder: DeckType[] = ["single", "lower", "upper"]

  return (
    <div className="flex flex-col gap-8">
      {deckOrder.map((deck) => {
        const deckSeats = decks.get(deck)
        if (!deckSeats || deckSeats.length === 0) return null

        const rows = groupByRow(deckSeats)
        const maxCol = Math.max(...deckSeats.map((s) => s.column))

        return (
          <div key={deck}>
            {DECK_LABEL[deck] && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {DECK_LABEL[deck]}
              </p>
            )}
            <div className="inline-flex flex-col gap-1.5 rounded-xl border bg-card p-4">
              {/* Column header */}
              <div
                className="mb-1 grid gap-1.5 text-center text-[10px] text-muted-foreground"
                style={{ gridTemplateColumns: `repeat(${maxCol}, 2.5rem)` }}
              >
                {Array.from({ length: maxCol }, (_, i) => (
                  <span key={i}>{colLabel(i + 1, maxCol)}</span>
                ))}
              </div>
              {/* Seat rows */}
              {Array.from(rows.entries())
                .sort(([a], [b]) => a - b)
                .map(([rowNum, rowSeats]) => (
                  <SeatRow
                    key={rowNum}
                    row={rowNum}
                    seats={rowSeats}
                    maxCol={maxCol}
                    selected={selected}
                    onToggle={onToggle}
                    maxSelect={maxSelect}
                    totalSelected={selected.size}
                  />
                ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SeatRow({
  row,
  seats,
  maxCol,
  selected,
  onToggle,
  maxSelect,
  totalSelected,
}: {
  row: number
  seats: SeatEntry[]
  maxCol: number
  selected: Set<string>
  onToggle: (sn: string) => void
  maxSelect: number
  totalSelected: number
}) {
  const byCol = new Map(seats.map((s) => [s.column, s]))

  return (
    <div className="flex items-center gap-2">
      <span className="w-5 shrink-0 text-right text-[10px] text-muted-foreground">{row}</span>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${maxCol}, 2.5rem)` }}
      >
        {Array.from({ length: maxCol }, (_, i) => {
          const seat = byCol.get(i + 1)
          if (!seat) return <div key={i} className="h-9 w-10" />
          return (
            <SeatButton
              key={seat.number}
              seat={seat}
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

function SeatButton({
  seat,
  isSelected,
  onToggle,
  canSelect,
}: {
  seat: SeatEntry
  isSelected: boolean
  onToggle: (sn: string) => void
  canSelect: boolean
}) {
  const isUnavailable =
    seat.status === "booked" || (seat.status === "locked" && !seat.isLockedByMe)
  const disabled = isUnavailable || (!isSelected && !canSelect)

  let bg = "bg-muted text-muted-foreground hover:bg-muted/80"
  if (isUnavailable) bg = "bg-muted/40 text-muted-foreground/40 cursor-not-allowed"
  else if (isSelected) bg = "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1"
  else if (seat.isLockedByMe)
    bg = "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-400"

  return (
    <button
      type="button"
      disabled={disabled}
      title={seatTitle(seat, isSelected, canSelect)}
      onClick={() => !disabled && onToggle(seat.number)}
      className={`flex h-9 w-10 items-center justify-center rounded-md text-[11px] font-medium transition-all ${bg}`}
    >
      {seat.number}
    </button>
  )
}

function seatTitle(seat: SeatEntry, isSelected: boolean, canSelect: boolean): string {
  if (seat.status === "booked") return `${seat.number} — Booked`
  if (seat.status === "locked" && !seat.isLockedByMe) return `${seat.number} — Locked`
  if (seat.isLockedByMe) return `${seat.number} — Your hold`
  if (!isSelected && !canSelect) return `${seat.number} — Maximum seats already selected`
  return `${seat.number} — ₹${seat.price.toLocaleString("en-IN")}`
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

function colLabel(col: number, maxCol: number): string {
  if (maxCol === 4) {
    return ["W", "A", "A", "W"][col - 1] ?? ""
  }
  if (maxCol === 3) {
    return ["W", "A", "W"][col - 1] ?? ""
  }
  if (maxCol === 2) {
    return ["W", "A"][col - 1] ?? ""
  }
  return String(col)
}
