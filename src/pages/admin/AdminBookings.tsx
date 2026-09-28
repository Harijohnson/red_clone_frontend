import { useEffect, useState } from "react"
import { fetchAdminBookings, cancelAdminBooking } from "@/services/admin"
import type { AdminBookingItem } from "@/types/admin"
import type { ApiError } from "@/types"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function statusBadgeClass(status: string): string {
  return ({
    confirmed: "bg-green-500/10 text-green-700 dark:text-green-400",
    cancelled: "bg-destructive/10 text-destructive",
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  })[status] ?? "bg-muted text-muted-foreground"
}

function paymentBadgeClass(status: string): string {
  return ({
    paid: "bg-green-500/10 text-green-700 dark:text-green-400",
    refunded: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    unpaid: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  })[status] ?? "bg-muted text-muted-foreground"
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

function ConfirmCancelDialog({
  booking,
  onConfirm,
  onCancel,
  loading,
}: {
  booking: AdminBookingItem
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <Modal title="Cancel Booking" onClose={onCancel}>
      <p className="text-sm text-muted-foreground">
        Cancel booking <span className="font-mono font-medium text-foreground">{booking.bookingReference}</span> for{" "}
        <span className="font-medium text-foreground">{booking.user.name}</span>?
        This will release their seats back to available.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Keep Booking</button>
        <button onClick={onConfirm} disabled={loading} className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "Cancelling…" : "Cancel Booking"}
        </button>
      </div>
    </Modal>
  )
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<AdminBookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cancelTarget, setCancelTarget] = useState<AdminBookingItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  function loadBookings(p: number) {
    setLoading(true)
    fetchAdminBookings(p)
      .then((data) => {
        setBookings(data.bookings)
        setTotalPages(data.totalPages)
        setLoading(false)
      })
      .catch((err: ApiError) => {
        setError(err.message ?? "Failed to load bookings.")
        setLoading(false)
      })
  }

  useEffect(() => { loadBookings(page) }, [page])

  async function handleCancel() {
    if (!cancelTarget) return
    setActionLoading(true)
    try {
      await cancelAdminBooking(cancelTarget.bookingId)
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingId === cancelTarget.bookingId ? { ...b, bookingStatus: "cancelled" } : b
        )
      )
      setCancelTarget(null)
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to cancel booking.")
      setCancelTarget(null)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Bookings</h2>
      </div>

      {error && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground" aria-busy="true">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading bookings…
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No bookings found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Reference</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Route</th>
                <th className="px-4 py-3 text-left font-medium">Departure</th>
                <th className="px-4 py-3 text-left font-medium">Seats</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Payment</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((b) => (
                <tr key={b.bookingId} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{b.bookingReference}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.user.name}</p>
                    <p className="text-xs text-muted-foreground">{b.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {b.trip.source} → {b.trip.destination}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(b.trip.departureTime)}
                    <br />
                    <span className="text-xs">{formatTime(b.trip.departureTime)}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{b.seats.join(", ")}</td>
                  <td className="px-4 py-3 font-semibold">₹{b.totalAmount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(b.bookingStatus)}`}>
                      {b.bookingStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${paymentBadgeClass(b.paymentStatus)}`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.bookingStatus !== "cancelled" && (
                      <button
                        onClick={() => setCancelTarget(b)}
                        className="text-xs font-medium text-destructive underline-offset-2 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border px-3 py-1.5 disabled:opacity-40 hover:bg-accent">
            ← Prev
          </button>
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border px-3 py-1.5 disabled:opacity-40 hover:bg-accent">
            Next →
          </button>
        </div>
      )}

      {cancelTarget && (
        <ConfirmCancelDialog
          booking={cancelTarget}
          onConfirm={handleCancel}
          onCancel={() => setCancelTarget(null)}
          loading={actionLoading}
        />
      )}
    </>
  )
}
