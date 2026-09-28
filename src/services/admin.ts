import { apiClient } from "@/services/api"
import type {
  AdminRouteListResponse,
  AdminRouteItem,
  CreateRouteRequest,
  AdminBusListResponse,
  AdminBusItem,
  CreateBusRequest,
  UpdateBusRequest,
  AdminTripListResponse,
  AdminTripItem,
  CreateTripRequest,
  UpdateTripRequest,
  AdminBookingListResponse,
  AdminDashboardResponse,
  AdminAnalyticsResponse,
} from "@/types/admin"

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function fetchDashboard(): Promise<AdminDashboardResponse> {
  const res = await apiClient.get<AdminDashboardResponse>("/admin/dashboard")
  return res.data
}

export async function fetchAnalytics(): Promise<AdminAnalyticsResponse> {
  const res = await apiClient.get<AdminAnalyticsResponse>("/admin/analytics")
  return res.data
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function fetchAdminRoutes(): Promise<AdminRouteListResponse> {
  const res = await apiClient.get<AdminRouteListResponse>("/admin/routes")
  return res.data
}

export async function createAdminRoute(body: CreateRouteRequest): Promise<AdminRouteItem> {
  const res = await apiClient.post<AdminRouteItem>("/admin/routes", body)
  return res.data
}

export async function deleteAdminRoute(routeId: string): Promise<void> {
  await apiClient.delete(`/admin/routes/${routeId}`)
}

// ---------------------------------------------------------------------------
// Buses
// ---------------------------------------------------------------------------

export async function fetchAdminBuses(): Promise<AdminBusListResponse> {
  const res = await apiClient.get<AdminBusListResponse>("/admin/buses")
  return res.data
}

export async function createAdminBus(body: CreateBusRequest): Promise<AdminBusItem> {
  const res = await apiClient.post<AdminBusItem>("/admin/buses", body)
  return res.data
}

export async function updateAdminBus(busId: string, body: UpdateBusRequest): Promise<AdminBusItem> {
  const res = await apiClient.patch<AdminBusItem>(`/admin/buses/${busId}`, body)
  return res.data
}

export async function deleteAdminBus(busId: string): Promise<void> {
  await apiClient.delete(`/admin/buses/${busId}`)
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

export async function fetchAdminTrips(page = 1, limit = 20): Promise<AdminTripListResponse> {
  const res = await apiClient.get<AdminTripListResponse>("/admin/trips", {
    params: { page, limit },
  })
  return res.data
}

export async function createAdminTrip(body: CreateTripRequest): Promise<AdminTripItem> {
  const res = await apiClient.post<AdminTripItem>("/admin/trips", body)
  return res.data
}

export async function updateAdminTrip(
  tripId: string,
  body: UpdateTripRequest,
): Promise<AdminTripItem> {
  const res = await apiClient.patch<AdminTripItem>(`/admin/trips/${tripId}`, body)
  return res.data
}

export async function deleteAdminTrip(tripId: string): Promise<void> {
  await apiClient.delete(`/admin/trips/${tripId}`)
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export async function fetchAdminBookings(
  page = 1,
  limit = 20,
): Promise<AdminBookingListResponse> {
  const res = await apiClient.get<AdminBookingListResponse>("/admin/bookings", {
    params: { page, limit },
  })
  return res.data
}

export async function cancelAdminBooking(bookingId: string): Promise<void> {
  await apiClient.patch(`/admin/bookings/${bookingId}/cancel`)
}

export async function fetchAllAdminBookings(): Promise<AdminBookingListResponse> {
  const res = await apiClient.get<AdminBookingListResponse>("/admin/bookings", {
    params: { page: 1, limit: 1000 },
  })
  return res.data
}
