import { useEffect, useState } from "react"
import {
  fetchAdminBuses,
  createAdminBus,
  updateAdminBus,
  deleteAdminBus,
} from "@/services/admin"
import type { AdminBusItem, CreateBusRequest, UpdateBusRequest, SeatLayoutInput } from "@/types/admin"
import type { ApiError } from "@/types"

function inputClass(hasError = false): string {
  return [
    "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none",
    "placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1",
    hasError ? "border-destructive" : "border-input",
  ].join(" ")
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">✕</button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create form — generates a flat seat layout automatically from totalSeats
// ---------------------------------------------------------------------------

function generateLayout(totalSeats: number): SeatLayoutInput[] {
  const layout: SeatLayoutInput[] = []
  const cols = 4
  for (let i = 0; i < totalSeats; i++) {
    const row = Math.floor(i / cols) + 1
    const col = (i % cols) + 1
    const posTypes: SeatLayoutInput["type"][] = ["window", "aisle", "aisle", "window"]
    layout.push({
      seatNumber: `S${String(i + 1).padStart(2, "0")}`,
      deck: "single",
      row,
      column: col,
      type: posTypes[col - 1] ?? "aisle",
      isFemaleSeat: false,
    })
  }
  return layout
}

function CreateBusForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: CreateBusRequest) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    registrationNumber: "",
    name: "",
    totalSeats: 40,
    seatType: "seater" as CreateBusRequest["seatType"],
    amenities: "",
    operatedBy: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.registrationNumber.trim() || !form.name.trim() || !form.operatedBy.trim()) {
      setError("Registration number, name, and operator user ID are required.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const amenities = form.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
      await onSubmit({
        registrationNumber: form.registrationNumber.trim().toUpperCase(),
        name: form.name.trim(),
        totalSeats: form.totalSeats,
        seatType: form.seatType,
        seatLayout: generateLayout(form.totalSeats),
        amenities,
        operatedBy: form.operatedBy.trim(),
      })
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to create bus.")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Registration Number</label>
        <input
          type="text"
          value={form.registrationNumber}
          onChange={(e) => setForm((p) => ({ ...p, registrationNumber: e.target.value }))}
          placeholder="TN01AB1234"
          className={inputClass()}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Bus Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Volvo Express"
          className={inputClass()}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Total Seats</label>
          <input
            type="number"
            min={1}
            value={form.totalSeats}
            onChange={(e) => setForm((p) => ({ ...p, totalSeats: Number(e.target.value) }))}
            className={inputClass()}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Seat Type</label>
          <select
            value={form.seatType}
            onChange={(e) => setForm((p) => ({ ...p, seatType: e.target.value as CreateBusRequest["seatType"] }))}
            className={inputClass()}
          >
            <option value="seater">Seater</option>
            <option value="sleeper">Sleeper</option>
            <option value="semi-sleeper">Semi-Sleeper</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Amenities (comma-separated)</label>
        <input
          type="text"
          value={form.amenities}
          onChange={(e) => setForm((p) => ({ ...p, amenities: e.target.value }))}
          placeholder="AC, WiFi, Charging"
          className={inputClass()}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Operator User ID</label>
        <input
          type="text"
          value={form.operatedBy}
          onChange={(e) => setForm((p) => ({ ...p, operatedBy: e.target.value }))}
          placeholder="MongoDB ObjectId of operator user"
          className={inputClass()}
        />
        <p className="text-xs text-muted-foreground">Must be a user with role 'operator' or 'admin'.</p>
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {saving ? "Creating…" : "Create Bus"}
        </button>
      </div>
    </form>
  )
}

function EditBusForm({
  bus,
  onSubmit,
  onClose,
}: {
  bus: AdminBusItem
  onSubmit: (data: UpdateBusRequest) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: bus.name,
    amenities: bus.amenities.join(", "),
    status: bus.status,
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        name: form.name.trim(),
        amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        status: form.status as UpdateBusRequest["status"],
      })
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to update bus.")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Bus Name</label>
        <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass()} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Amenities (comma-separated)</label>
        <input type="text" value={form.amenities} onChange={(e) => setForm((p) => ({ ...p, amenities: e.target.value }))} className={inputClass()} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Status</label>
        <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as AdminBusItem["status"] }))} className={inputClass()}>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>
      </div>
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {saving ? "Saving…" : "Save Changes"}
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

type UIState = { mode: "idle" } | { mode: "create" } | { mode: "edit"; bus: AdminBusItem } | { mode: "delete"; bus: AdminBusItem }

const statusBadge = (s: string) => ({
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  maintenance: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  retired: "bg-muted text-muted-foreground",
})[s] ?? "bg-muted text-muted-foreground"

export default function AdminBuses() {
  const [buses, setBuses] = useState<AdminBusItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ui, setUi] = useState<UIState>({ mode: "idle" })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchAdminBuses()
      .then((d) => { setBuses(d.buses); setLoading(false) })
      .catch((err: ApiError) => { setError(err.message ?? "Failed to load buses."); setLoading(false) })
  }, [])

  async function handleCreate(data: CreateBusRequest) {
    const bus = await createAdminBus(data)
    setBuses((prev) => [bus, ...prev])
    setUi({ mode: "idle" })
  }

  async function handleEdit(data: UpdateBusRequest) {
    if (ui.mode !== "edit") return
    const updated = await updateAdminBus(ui.bus.busId, data)
    setBuses((prev) => prev.map((b) => (b.busId === updated.busId ? updated : b)))
    setUi({ mode: "idle" })
  }

  async function handleDelete() {
    if (ui.mode !== "delete") return
    setActionLoading(true)
    try {
      await deleteAdminBus(ui.bus.busId)
      setBuses((prev) => prev.filter((b) => b.busId !== ui.bus.busId))
      setUi({ mode: "idle" })
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to delete bus.")
      setUi({ mode: "idle" })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Buses</h2>
        <button onClick={() => setUi({ mode: "create" })} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          + New Bus
        </button>
      </div>

      {error && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground" aria-busy="true">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading buses…
        </div>
      ) : buses.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No buses found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Reg No.</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Seats</th>
                <th className="px-4 py-3 text-left font-medium">Operator</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {buses.map((bus) => (
                <tr key={bus.busId} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{bus.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{bus.registrationNumber}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{bus.seatType}</td>
                  <td className="px-4 py-3 tabular-nums">{bus.totalSeats}</td>
                  <td className="px-4 py-3 text-muted-foreground">{bus.operatorName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(bus.status)}`}>
                      {bus.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setUi({ mode: "edit", bus })} className="mr-2 text-xs font-medium text-primary underline-offset-2 hover:underline">Edit</button>
                    <button onClick={() => setUi({ mode: "delete", bus })} className="text-xs font-medium text-destructive underline-offset-2 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ui.mode === "create" && (
        <Modal title="Create Bus" onClose={() => setUi({ mode: "idle" })}>
          <CreateBusForm onSubmit={handleCreate} onClose={() => setUi({ mode: "idle" })} />
        </Modal>
      )}
      {ui.mode === "edit" && (
        <Modal title="Edit Bus" onClose={() => setUi({ mode: "idle" })}>
          <EditBusForm bus={ui.bus} onSubmit={handleEdit} onClose={() => setUi({ mode: "idle" })} />
        </Modal>
      )}
      {ui.mode === "delete" && (
        <ConfirmDialog
          message={`Delete bus "${ui.bus.name}" (${ui.bus.registrationNumber})? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setUi({ mode: "idle" })}
          loading={actionLoading}
        />
      )}
    </>
  )
}
