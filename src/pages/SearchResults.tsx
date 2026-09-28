import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { searchTrips } from "@/services/trips"
import TripCard from "@/components/trips/TripCard"
import type { ApiError, TripSearchResult } from "@/types"

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; trips: TripSearchResult[]; from: string; to: string; date: string }

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const from = searchParams.get("from") ?? ""
  const to = searchParams.get("to") ?? ""
  const date = searchParams.get("date") ?? ""

  const [state, setState] = useState<State>({ status: "idle" })

  useEffect(() => {
    if (!from || !to || !date) {
      setState({ status: "idle" })
      return
    }

    let cancelled = false

    setState({ status: "loading" })

    searchTrips({ from, to, date })
      .then((data) => {
        if (!cancelled) {
          setState({ status: "success", trips: data.trips, from, to, date })
        }
      })
      .catch((err: ApiError) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err.message ?? "Failed to load trips. Please try again.",
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [from, to, date])

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Search Results</h1>
        <Link
          to="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          New search
        </Link>
      </div>

      {state.status === "idle" && <MissingParams />}
      {state.status === "loading" && <LoadingState />}
      {state.status === "error" && <ErrorState message={state.message} />}
      {state.status === "success" && (
        <SuccessState
          trips={state.trips}
          from={state.from}
          to={state.to}
          date={state.date}
        />
      )}
    </main>
  )
}

function MissingParams() {
  return (
    <div className="rounded-xl border border-dashed p-12 text-center">
      <p className="text-muted-foreground">No search criteria provided.</p>
      <Link
        to="/"
        className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
      >
        Go back to search
      </Link>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading trips">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl border bg-muted"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center"
    >
      <p className="font-medium text-destructive">Something went wrong</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Link
        to="/"
        className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
      >
        Try again
      </Link>
    </div>
  )
}

function SuccessState({
  trips,
  from,
  to,
  date,
}: {
  trips: TripSearchResult[]
  from: string
  to: string
  date: string
}) {
  const formattedDate = new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{from}</span>
        {" → "}
        <span className="font-medium text-foreground">{to}</span>
        {" · "}
        <span>{formattedDate}</span>
        {" · "}
        <span>{trips.length} {trips.length === 1 ? "bus" : "buses"} found</span>
      </p>

      {trips.length === 0 ? (
        <EmptyState from={from} to={to} date={date} />
      ) : (
        <div className="flex flex-col gap-4">
          {trips.map((trip) => (
            <TripCard key={trip.tripId} trip={trip} />
          ))}
        </div>
      )}
    </>
  )
}

function EmptyState({ from, to, date }: { from: string; to: string; date: string }) {
  return (
    <div className="rounded-xl border border-dashed p-12 text-center">
      <p className="font-medium">No buses found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        No buses are scheduled from {from} to {to} on {date}.
      </p>
      <Link
        to="/"
        className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
      >
        Search different dates
      </Link>
    </div>
  )
}
