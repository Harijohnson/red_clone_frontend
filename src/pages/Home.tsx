import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { searchTrips } from "@/services/trips"
import type { ApiError, SearchParams } from "@/types"

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

export default function Home() {
  const navigate = useNavigate()

  const [form, setForm] = useState<SearchParams>({ from: "", to: "", date: "" })
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setApiError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

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

  return (
    <main className="flex flex-col items-center justify-center gap-8 px-4 py-20">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Find Your Bus</h1>
        <p className="mt-2 text-muted-foreground">Search for available buses between cities.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="flex flex-col gap-5">
          <Field label="From" error={errors.from}>
            <input
              id="from"
              name="from"
              type="text"
              value={form.from}
              onChange={handleChange}
              placeholder="e.g. Coimbatore"
              autoComplete="off"
              className={inputClass(!!errors.from)}
            />
          </Field>

          <Field label="To" error={errors.to}>
            <input
              id="to"
              name="to"
              type="text"
              value={form.to}
              onChange={handleChange}
              placeholder="e.g. Chennai"
              autoComplete="off"
              className={inputClass(!!errors.to)}
            />
          </Field>

          <Field label="Travel Date" error={errors.date}>
            <input
              id="date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              min={getTodayISO()}
              className={inputClass(!!errors.date)}
            />
          </Field>

          {apiError && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {apiError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search Buses"}
          </button>
        </div>
      </form>
    </main>
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
    "rounded-md border bg-background px-3 py-2 text-sm outline-none",
    "placeholder:text-muted-foreground",
    "focus:ring-2 focus:ring-ring focus:ring-offset-1",
    hasError ? "border-destructive focus:ring-destructive/40" : "border-input",
  ].join(" ")
}
