import { useNavigate } from "react-router-dom"
import type { TripSearchResult } from "@/types"

type Props = {
  trip: TripSearchResult
}

const SEAT_TYPE_LABEL: Record<TripSearchResult["busType"], string> = {
  seater: "Seater",
  sleeper: "Sleeper",
  "semi-sleeper": "Semi-Sleeper",
}

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

export default function TripCard({ trip }: Props) {
  const navigate = useNavigate()

  const seatsLabel =
    trip.availableSeats === 0
      ? "Sold out"
      : trip.availableSeats === 1
        ? "1 seat left"
        : `${trip.availableSeats} seats available`

  const seatsClass =
    trip.availableSeats === 0
      ? "text-destructive"
      : trip.availableSeats <= 5
        ? "text-amber-500"
        : "text-emerald-600 dark:text-emerald-400"

  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      {/* Operator + bus meta */}
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-base font-semibold">{trip.operator}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{trip.busName}</span>
          <span aria-hidden>·</span>
          <span>{SEAT_TYPE_LABEL[trip.busType]}</span>
          {trip.amenities.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>{trip.amenities.join(", ")}</span>
            </>
          )}
        </div>
      </div>

      {/* Times */}
      <div className="flex items-center gap-4 text-sm">
        <div className="text-center">
          <p className="text-lg font-semibold tabular-nums">{formatTime(trip.departure)}</p>
          <p className="text-xs text-muted-foreground">Departure</p>
        </div>
        <div className="text-center text-xs text-muted-foreground">
          <p>{formatDuration(trip.departure, trip.arrival)}</p>
          <div className="mx-auto my-1 h-px w-12 bg-border" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold tabular-nums">{formatTime(trip.arrival)}</p>
          <p className="text-xs text-muted-foreground">Arrival</p>
        </div>
      </div>

      {/* Price + seats + CTA */}
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <p className="text-xl font-bold">
          ₹{trip.pricePerSeat.toLocaleString("en-IN")}
          <span className="text-sm font-normal text-muted-foreground"> /seat</span>
        </p>
        <p className={`text-xs font-medium ${seatsClass}`}>{seatsLabel}</p>
        <button
          type="button"
          disabled={trip.availableSeats === 0}
          onClick={() => navigate(`/trips/${trip.tripId}/seats`)}
          className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          View Seats
        </button>
      </div>
    </article>
  )
}
