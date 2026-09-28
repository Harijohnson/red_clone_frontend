import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { searchTrips, getCities } from "@/services/trips"
import type { ApiError, SearchParams } from "@/types"
import { MapPin, ArrowUpDown, Bus, Search, Ticket } from "lucide-react"
import { DateTimePicker } from "@/components/ui/DateTimePicker"

type FormErrors = {
  from?: string
  to?: string
  date?: string
}

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0]
}

function validateForm(params: SearchParams): FormErrors {
  const errors: FormErrors = {}

  if (!params.from.trim()) {
    errors.from = "Origin city is required."
  }

  if (!params.to.trim()) {
    errors.to = "Destination city is required."
  } else if (params.to.trim().toLowerCase() === params.from.trim().toLowerCase()) {
    errors.to = "Destination must differ from origin."
  }

  if (!params.date) {
    errors.date = "Travel date is required."
  } else {
    const selected = new Date(params.date)
    const today = new Date(getTodayISO())
    if (isNaN(selected.getTime())) {
      errors.date = "Enter a valid date."
    } else if (selected < today) {
      errors.date = "Travel date cannot be in the past."
    }
  }

  return errors
}

function filterCities(cities: string[], query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return cities.filter((c) => c.toLowerCase().includes(q)).slice(0, 6)
}

const HOW_IT_WORKS = [
  {
    step: 1,
    Icon: Search,
    title: "Search Your Route",
    desc: "Enter departure city, destination, and travel date to see available buses.",
    bg: "bg-primary/10",
    color: "text-primary",
  },
  {
    step: 2,
    Icon: Bus,
    title: "Pick Your Seat",
    desc: "Browse buses, compare prices, and choose your preferred seat.",
    bg: "bg-emerald-500/10",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    step: 3,
    Icon: Ticket,
    title: "Confirm & Go",
    desc: "Fill in passenger details and confirm your booking in seconds.",
    bg: "bg-amber-500/10",
    color: "text-amber-600 dark:text-amber-400",
  },
]

export default function Home() {
  const navigate = useNavigate()

  const [form, setForm] = useState<SearchParams>({ from: "", to: "", date: "" })
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<string[]>([])
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null)

  const fromRef = useRef<HTMLDivElement>(null)
  const toRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getCities()
      .then(setCities)
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        fromRef.current && !fromRef.current.contains(target) &&
        toRef.current && !toRef.current.contains(target)
      ) {
        setActiveField(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setApiError(null)
    setActiveField(name as "from" | "to")
  }

  function handleSuggest(field: "from" | "to", city: string): void {
    setForm((prev) => ({ ...prev, [field]: city }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setActiveField(null)
  }

  function handleSwap(): void {
    setForm((prev) => ({ ...prev, from: prev.to, to: prev.from }))
    setErrors({})
    setApiError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setActiveField(null)

    const trimmed: SearchParams = {
      from: form.from.trim(),
      to: form.to.trim(),
      date: form.date,
    }

    const validationErrors = validateForm(trimmed)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setApiError(null)

    try {
      await searchTrips(trimmed)
      navigate(
        `/search?from=${encodeURIComponent(trimmed.from)}&to=${encodeURIComponent(trimmed.to)}&date=${trimmed.date}`,
      )
    } catch (err) {
      const apiErr = err as ApiError
      setApiError(apiErr.message ?? "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fromSuggestions = filterCities(cities, form.from)
  const toSuggestions = filterCities(cities, form.to)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-emerald-500/5 px-4 py-14 sm:py-20">
        {/* Decorative background bus */}
        <div
          className="pointer-events-none absolute -right-16 -top-8 opacity-[0.04]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 300 180" width="500" fill="currentColor" className="text-primary">
            <rect x="10" y="40" width="260" height="110" rx="20" />
            <rect x="30" y="15" width="200" height="70" rx="15" />
            <rect x="40" y="50" width="55" height="40" rx="8" fill="white" />
            <rect x="110" y="50" width="55" height="40" rx="8" fill="white" />
            <rect x="180" y="50" width="55" height="40" rx="8" fill="white" />
            <circle cx="70" cy="155" r="22" />
            <circle cx="200" cy="155" r="22" />
            <rect x="270" y="70" width="22" height="40" rx="11" />
          </svg>
        </div>

        <div className="relative mx-auto flex max-w-md flex-col items-center gap-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
              <Bus className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Book Your Bus,
              <br />
              The Easy Way
            </h1>
            <p className="mt-3 text-muted-foreground">
              Find buses between cities, pick your seat, and confirm in minutes.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="w-full rounded-2xl border bg-card p-6 text-left shadow-xl shadow-black/5"
          >
            <div className="flex flex-col gap-4">
              {/* From */}
              <Field label="From" error={errors.from}>
                <div ref={fromRef} className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="from"
                    name="from"
                    type="text"
                    value={form.from}
                    onChange={handleChange}
                    onFocus={() => setActiveField("from")}
                    placeholder="Departure city"
                    autoComplete="off"
                    className={`${inputClass(!!errors.from)} pl-9`}
                  />
                  {activeField === "from" && fromSuggestions.length > 0 && (
                    <SuggestionList
                      suggestions={fromSuggestions}
                      onSelect={(city) => handleSuggest("from", city)}
                    />
                  )}
                </div>
              </Field>

              {/* Swap button */}
              <div className="relative -my-1 flex justify-center">
                <button
                  type="button"
                  onClick={handleSwap}
                  aria-label="Swap departure and destination cities"
                  className="z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-accent"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* To */}
              <Field label="To" error={errors.to}>
                <div ref={toRef} className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                  <input
                    id="to"
                    name="to"
                    type="text"
                    value={form.to}
                    onChange={handleChange}
                    onFocus={() => setActiveField("to")}
                    placeholder="Destination city"
                    autoComplete="off"
                    className={`${inputClass(!!errors.to)} pl-9`}
                  />
                  {activeField === "to" && toSuggestions.length > 0 && (
                    <SuggestionList
                      suggestions={toSuggestions}
                      onSelect={(city) => handleSuggest("to", city)}
                    />
                  )}
                </div>
              </Field>

              {/* Date */}
              <Field label="Travel Date" error={errors.date}>
                <DateTimePicker
                  value={form.date}
                  onChange={(val) => {
                    setForm((prev) => ({ ...prev, date: val }))
                    setErrors((prev) => ({ ...prev, date: undefined }))
                    setApiError(null)
                  }}
                  placeholder="Select travel date"
                  hasError={!!errors.date}
                  minDate={new Date(getTodayISO())}
                />
              </Field>

              {apiError && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {apiError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading ? "Searching…" : "Search Buses"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-8 text-center text-xl font-semibold">Book in 3 easy steps</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, Icon, title, desc, bg, color }) => (
            <div
              key={step}
              className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SuggestionList({
  suggestions,
  onSelect,
}: {
  suggestions: string[]
  onSelect: (city: string) => void
}) {
  return (
    <ul className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border bg-popover shadow-lg">
      {suggestions.map((city) => (
        <li key={city}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(city)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {city}
          </button>
        </li>
      ))}
    </ul>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function inputClass(hasError: boolean): string {
  return [
    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none",
    "placeholder:text-muted-foreground",
    "focus:ring-2 focus:ring-ring focus:ring-offset-1",
    hasError ? "border-destructive focus:ring-destructive/40" : "border-input",
  ].join(" ")
}
