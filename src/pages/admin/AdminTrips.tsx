import { useEffect, useState } from "react"
import {
  fetchAdminTrips,
  createAdminTrip,
  updateAdminTrip,
  deleteAdminTrip,
  fetchAdminRoutes,
  fetchAdminBuses,
} from "@/services/admin"
import type { AdminTripItem, AdminRouteItem, AdminBusItem, CreateTripRequest, UpdateTripRequest } from "@/types/admin"
import type { ApiError } from "@/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function inputClass(hasError = false): string {
  return [
    "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none",
    "placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1",
    hasError ? "border-destructive" : "border-input",
  ].join(" ")
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

type ModalProps = {
  title: string
  onClose: () => void
  children: React.ReactNode
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create form
// ---------------------------------------------------------------------------

type CreateFormProps = {
  routes: AdminRouteItem[]
  buses: AdminBusItem[]
  onSubmit: (data: CreateTripRequest) => Promise<void>
  onClose: () => void
}

function CreateTripForm({ routes, buses, onSubmit, onClose }: CreateFormProps) {
  const [form, setForm] = useState<CreateTripRequest>({
    busId: "",
    routeId: "",
    departureTime: "",
    arrivalTime: "",
    pricePerSeat: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.busId || !form.routeId || !form.departureTime || !form.arrivalTime) {
      setError("All fields are required.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(form)
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to create trip.")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Route</label>
        <select
          value={form.routeId}
          onChange={(e) => setForm((p) => ({ ...p, routeId: e.target.value }))}
          className={inputClass(!form.routeId)}
        >
          <option value="">Select route…</option>
          {routes.map((r) => (
            <option key={r.routeId} value={r.routeId}>
              {r.source} → {r.destination}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Bus</label>
        <select
          value={form.busId}
          onChange={(e) => setForm((p) => ({ ...p, busId: e.target.value }))}
          className={inputClass(!form.busId)}
        >
          <option value="">Select bus…</option>
          {buses.filter((b) => b.status === "active").map((b) => (
            <option key={b.busId} value={b.busId}>
              {b.name} ({b.registrationNumber}) — {b.totalSeats} seats
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Departure</label>
          <input
            type="datetime-local"
            value={form.departureTime}
            onChange={(e) => setForm((p) => ({ ...p, departureTime: e.target.value }))}
            className={inputClass()}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Arrival</label>
          <input
            type="datetime-local"
            value={form.arrivalTime}
            onChange={(e) => setForm((p) => ({ ...p, arrivalTime: e.target.value }))}
            className={inputClass()}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Price per Seat (₹)</label>
        <input
          type="number"
          min={0}
          value={form.pricePerSeat}
          onChange={(e) => setForm((p) => ({ ...p, pricePerSeat: Number(e.target.value) }))}
          className={inputClass()}
        />
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create Trip"}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Edit form
// ---------------------------------------------------------------------------

type EditFormProps = {
  trip: AdminTripItem
  onSubmit: (data: UpdateTripRequest) => Promise<void>
  onClose: () => void
}

function EditTripForm({ trip, onSubmit, onClose }: EditFormProps) {
  const toLocalDT = (iso: string) => new Date(iso).toISOString().slice(0, 16)

  const [form, setForm] = useState({
    departureTime: toLocalDT(trip.departureTime),
    arrivalTime: toLocalDT(trip.arrivalTime),
    pricePerSeat: trip.pricePerSeat,
    status: trip.status as UpdateTripRequest["status"],
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        departureTime: new Date(form.departureTime).toISOString(),
        arrivalTime: new Date(form.arrivalTime).toISOString(),
        pricePerSeat: form.pricePerSeat,
        status: form.status,
      })
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to update trip.")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Departure</label>
          <input
            type="datetime-local"
            value={form.departureTime}
            onChange={(e) => setForm((p) => ({ ...p, departureTime: e.target.value }))}
            className={inputClass()}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Arrival</label>
          <input
            type="datetime-local"
            value={form.arrivalTime}
            onChange={(e) => setForm((p) => ({ ...p, arrivalTime: e.target.value }))}
            className={inputClass()}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Price per Seat (₹)</label>
        <input
          type="number"
          min={0}
          value={form.pricePerSeat}
          onChange={(e) => setForm((p) => ({ ...p, pricePerSeat: Number(e.target.value) }))}
          className={inputClass()}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as UpdateTripRequest["status"] }))}
          className={inputClass()}
        >
          <option value="scheduled">Scheduled</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Confirm delete dialog
// ---------------------------------------------------------------------------

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <Modal title="Confirm Delete" onClose={onCancel}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type UIState =
  | { mode: "idle" }
  | { mode: "create" }
  | { mode: "edit"; trip: AdminTripItem }
  | { mode: "delete"; trip: AdminTripItem }

export default function AdminTrips() {
  const [trips, setTrips] = useState<AdminTripItem[]>([])
  const [routes, setRoutes] = useState<AdminRouteItem[]>([])
  const [buses, setBuses] = useState<AdminBusItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [ui, setUi] = useState<UIState>({ mode: "idle" })
  const [actionLoading, setActionLoading] = useState(false)

  function loadTrips(p: number) {
    setLoading(true)
    fetchAdminTrips(p)
      .then((data) => {
        setTrips(data.trips)
        setTotalPages(data.totalPages)
        setLoading(false)
      })
      .catch((err: ApiError) => {
        setError(err.message ?? "Failed to load trips.")
        setLoading(false)
      })
  }

  useEffect(() => {
    loadTrips(page)
    fetchAdminRoutes().then((d) => setRoutes(d.routes)).catch(() => {})
    fetchAdminBuses().then((d) => setBuses(d.buses)).catch(() => {})
  }, [page])

  async function handleCreate(data: CreateTripRequest) {
    const trip = await createAdminTrip(data)
    setTrips((prev) => [trip, ...prev])
    setUi({ mode: "idle" })
  }

  async function handleEdit(data: UpdateTripRequest) {
    if (ui.mode !== "edit") return
    const updated = await updateAdminTrip(ui.trip.tripId, data)
    setTrips((prev) => prev.map((t) => (t.tripId === updated.tripId ? updated : t)))
    setUi({ mode: "idle" })
  }

  async function handleDelete() {
    if (ui.mode !== "delete") return
    setActionLoading(true)
    try {
      await deleteAdminTrip(ui.trip.tripId)
      setTrips((prev) => prev.filter((t) => t.tripId !== ui.trip.tripId))
      setUi({ mode: "idle" })
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to delete trip.")
      setUi({ mode: "idle" })
    } finally {
      setActionLoading(false)
    }
  }

  const statusBadge = (status: string) => {
    const cls: Record<string, string> = {
      scheduled: "bg-green-500/10 text-green-700 dark:text-green-400",
      "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      completed: "bg-muted text-muted-foreground",
      cancelled: "bg-destructive/10 text-destructive",
    }
    return cls[status] ?? "bg-muted text-muted-foreground"
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trips</h2>
        <button
          onClick={() => setUi({ mode: "create" })}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + New Trip
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground" aria-busy="true">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading trips…
        </div>
      ) : trips.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No trips found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Route</th>
                <th className="px-4 py-3 text-left font-medium">Bus</th>
                <th className="px-4 py-3 text-left font-medium">Departure</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Available</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trips.map((trip) => (
                <tr key={trip.tripId} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {trip.source} → {trip.destination}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{trip.busName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(trip.departureTime)}</td>
                  <td className="px-4 py-3">₹{trip.pricePerSeat.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {trip.availableCount}/{trip.totalSeats}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(trip.status)}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setUi({ mode: "edit", trip })}
                      className="mr-2 text-xs font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setUi({ mode: "delete", trip })}
                      className="text-xs font-medium text-destructive underline-offset-2 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border px-3 py-1.5 disabled:opacity-40 hover:bg-accent"
          >
            ← Prev
          </button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border px-3 py-1.5 disabled:opacity-40 hover:bg-accent"
          >
            Next →
          </button>
        </div>
      )}

      {ui.mode === "create" && (
        <Modal title="Create Trip" onClose={() => setUi({ mode: "idle" })}>
          <CreateTripForm
            routes={routes}
            buses={buses}
            onSubmit={handleCreate}
            onClose={() => setUi({ mode: "idle" })}
          />
        </Modal>
      )}

      {ui.mode === "edit" && (
        <Modal title="Edit Trip" onClose={() => setUi({ mode: "idle" })}>
          <EditTripForm
            trip={ui.trip}
            onSubmit={handleEdit}
            onClose={() => setUi({ mode: "idle" })}
          />
        </Modal>
      )}

      {ui.mode === "delete" && (
        <ConfirmDialog
          message={`Delete trip ${ui.trip.source} → ${ui.trip.destination} on ${formatDateTime(ui.trip.departureTime)}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setUi({ mode: "idle" })}
          loading={actionLoading}
        />
      )}
    </>
  )
}
