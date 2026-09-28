import { useEffect, useState } from "react"
import { fetchAdminRoutes, createAdminRoute, deleteAdminRoute } from "@/services/admin"
import type { AdminRouteItem, CreateRouteRequest } from "@/types/admin"
import type { ApiError } from "@/types"

function inputClass(): string {
  return "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1"
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">✕</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

function CreateRouteForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: CreateRouteRequest) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<CreateRouteRequest>({ source: "", destination: "", distanceKm: 0, estimatedDurationMinutes: 0 })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.source.trim() || !form.destination.trim()) {
      setError("Source and destination are required.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({ ...form, source: form.source.trim(), destination: form.destination.trim() })
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to create route.")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Source City</label>
        <input type="text" value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} placeholder="e.g. Coimbatore" className={inputClass()} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Destination City</label>
        <input type="text" value={form.destination} onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))} placeholder="e.g. Chennai" className={inputClass()} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Distance (km)</label>
          <input type="number" min={0} value={form.distanceKm} onChange={(e) => setForm((p) => ({ ...p, distanceKm: Number(e.target.value) }))} className={inputClass()} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Duration (min)</label>
          <input type="number" min={0} value={form.estimatedDurationMinutes} onChange={(e) => setForm((p) => ({ ...p, estimatedDurationMinutes: Number(e.target.value) }))} className={inputClass()} />
        </div>
      </div>
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {saving ? "Creating…" : "Create Route"}
        </button>
      </div>
    </form>
  )
}

function ConfirmDialog({ message, onConfirm, onCancel, loading }: { message: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <Modal title="Confirm Delete" onClose={onCancel}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  )
}

type UIState = { mode: "idle" } | { mode: "create" } | { mode: "delete"; route: AdminRouteItem }

export default function AdminRoutes() {
  const [routes, setRoutes] = useState<AdminRouteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ui, setUi] = useState<UIState>({ mode: "idle" })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchAdminRoutes()
      .then((d) => { setRoutes(d.routes); setLoading(false) })
      .catch((err: ApiError) => { setError(err.message ?? "Failed to load routes."); setLoading(false) })
  }, [])

  async function handleCreate(data: CreateRouteRequest) {
    const route = await createAdminRoute(data)
    setRoutes((prev) => [...prev, route].sort((a, b) => a.source.localeCompare(b.source)))
    setUi({ mode: "idle" })
  }

  async function handleDelete() {
    if (ui.mode !== "delete") return
    setActionLoading(true)
    try {
      await deleteAdminRoute(ui.route.routeId)
      setRoutes((prev) => prev.filter((r) => r.routeId !== ui.route.routeId))
      setUi({ mode: "idle" })
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to delete route.")
      setUi({ mode: "idle" })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Routes</h2>
        <button onClick={() => setUi({ mode: "create" })} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          + New Route
        </button>
      </div>

      {error && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground" aria-busy="true">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading routes…
        </div>
      ) : routes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No routes found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Destination</th>
                <th className="px-4 py-3 text-left font-medium">Distance</th>
                <th className="px-4 py-3 text-left font-medium">Duration</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {routes.map((route) => (
                <tr key={route.routeId} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{route.source}</td>
                  <td className="px-4 py-3 font-medium">{route.destination}</td>
                  <td className="px-4 py-3 text-muted-foreground">{route.distanceKm} km</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {Math.floor(route.estimatedDurationMinutes / 60)}h {route.estimatedDurationMinutes % 60}m
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setUi({ mode: "delete", route })} className="text-xs font-medium text-destructive underline-offset-2 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ui.mode === "create" && (
        <Modal title="Create Route" onClose={() => setUi({ mode: "idle" })}>
          <CreateRouteForm onSubmit={handleCreate} onClose={() => setUi({ mode: "idle" })} />
        </Modal>
      )}
      {ui.mode === "delete" && (
        <ConfirmDialog
          message={`Delete route "${ui.route.source} → ${ui.route.destination}"? This will fail if trips are assigned to it.`}
          onConfirm={handleDelete}
          onCancel={() => setUi({ mode: "idle" })}
          loading={actionLoading}
        />
      )}
    </>
  )
}
