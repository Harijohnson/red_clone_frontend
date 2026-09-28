import { useNavigate } from "react-router-dom"
import type { TripSearchResult } from "@/types"
import { Wifi, Snowflake, Zap, Droplets, Coffee, ArrowRight } from "lucide-react"

type Props = {
  trip: TripSearchResult
}

// ── Bus type badge ────────────────────────────────────────────────────────────

const BUS_TYPE_CONFIG = {
  seater: {
    label: "Seater",
    classes: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  sleeper: {
    label: "Sleeper",
    classes: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  "semi-sleeper": {
    label: "Semi-Sleeper",
    classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
} satisfies Record<TripSearchResult["busType"], { label: string; classes: string }>

// ── Amenity icon matching ─────────────────────────────────────────────────────

type AmenityMatch = {
  pattern: RegExp
  Icon: React.ElementType
  label: string
}

const AMENITY_MATCHERS: AmenityMatch[] = [
  { pattern: /wifi/i, Icon: Wifi, label: "WiFi" },
  { pattern: /ac|air.?con/i, Icon: Snowflake, label: "AC" },
  { pattern: /usb|charg/i, Icon: Zap, label: "USB" },
  { pattern: /water/i, Icon: Droplets, label: "Water" },
  { pattern: /food|meal|snack|coffee/i, Icon: Coffee, label: "Food" },
]

function matchAmenity(amenity: string): { Icon: React.ElementType | null; label: string } {
  const match = AMENITY_MATCHERS.find((m) => m.pattern.test(amenity))
  return match ? { Icon: match.Icon, label: match.label } : { Icon: null, label: amenity }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDuration(departure: string, arrival: string): string {
  const diff = new Date(arrival).getTime() - new Date(departure).getTime()
  const totalMinutes = Math.round(diff / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TripCard({ trip }: Props) {
  const navigate = useNavigate()

  const busConfig = BUS_TYPE_CONFIG[trip.busType]
  const soldOut = trip.availableSeats === 0
  const seatPct = trip.totalSeats > 0
    ? Math.round((trip.availableSeats / trip.totalSeats) * 100)
    : 0

  const seatsLabel = soldOut
    ? "Sold out"
    : trip.availableSeats === 1
      ? "1 seat left"
      : `${trip.availableSeats} seats available`

  const seatsBarColor = soldOut
    ? "bg-destructive"
    : seatPct <= 20
      ? "bg-destructive"
      : seatPct <= 50
        ? "bg-amber-500"
        : "bg-emerald-500"

  const seatsTextColor = soldOut
    ? "text-destructive"
    : seatPct <= 20
      ? "text-destructive"
      : seatPct <= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400"

  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* ── Row 1: Operator + badge + bus name ── */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold">{trip.operator}</p>
            <span
              className={[
                "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                busConfig.classes,
              ].join(" ")}
            >
              {busConfig.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{trip.busName}</p>
        </div>

        {/* Amenity chips */}
        {trip.amenities.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {trip.amenities.map((amenity) => {
              const { Icon, label } = matchAmenity(amenity)
              return (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {Icon && <Icon className="h-3 w-3" aria-hidden />}
                  {label}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Row 2: Time bar ── */}
      <div className="mb-4 flex items-center gap-3">
        <div className="text-center">
          <p className="text-xl font-bold tabular-nums leading-none">
            {formatTime(trip.departure)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Departure</p>
        </div>

        <div className="flex flex-1 items-center gap-1.5">
          <div className="h-0.5 flex-1 rounded-full bg-border" />
          <div className="flex flex-col items-center">
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="mt-0.5 whitespace-nowrap text-xs text-muted-foreground">
              {formatDuration(trip.departure, trip.arrival)}
            </span>
          </div>
          <div className="h-0.5 flex-1 rounded-full bg-border" />
        </div>

        <div className="text-center">
          <p className="text-xl font-bold tabular-nums leading-none">
            {formatTime(trip.arrival)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Arrival</p>
        </div>
      </div>

      {/* ── Row 3: Seat bar + price + CTA ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-t pt-4">
        {/* Seat availability */}
        <div className="min-w-[120px] flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className={`text-xs font-medium ${seatsTextColor}`}>{seatsLabel}</p>
            {!soldOut && trip.totalSeats > 0 && (
              <p className="text-xs text-muted-foreground">{seatPct}%</p>
            )}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${seatsBarColor}`}
              style={{ width: `${soldOut ? 100 : seatPct}%` }}
            />
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xl font-bold leading-none">
              ₹{trip.pricePerSeat.toLocaleString("en-IN")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">per seat</p>
          </div>
          <button
            type="button"
            disabled={soldOut}
            onClick={() => navigate(`/trips/${trip.tripId}/seats`)}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {soldOut ? "Sold Out" : "Select Seats"}
          </button>
        </div>
      </div>
    </article>
  )
}
