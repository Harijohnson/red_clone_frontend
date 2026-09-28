// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export type AdminRouteItem = {
  routeId: string
  source: string
  destination: string
  distanceKm: number
  estimatedDurationMinutes: number
  createdAt: string
}

export type AdminRouteListResponse = {
  routes: AdminRouteItem[]
  count: number
}

export type CreateRouteRequest = {
  source: string
  destination: string
  distanceKm: number
  estimatedDurationMinutes: number
}

// ---------------------------------------------------------------------------
// Buses
// ---------------------------------------------------------------------------

export type SeatLayoutInput = {
  seatNumber: string
  deck: "lower" | "upper" | "single"
  row: number
  column: number
  type: "window" | "aisle" | "middle"
  isFemaleSeat: boolean
}

export type AdminBusItem = {
  busId: string
  registrationNumber: string
  name: string
  totalSeats: number
  seatType: "seater" | "sleeper" | "semi-sleeper"
  amenities: string[]
  status: "active" | "maintenance" | "retired"
  operatedBy: string
  operatorName: string
}

export type AdminBusListResponse = {
  buses: AdminBusItem[]
  count: number
}

export type CreateBusRequest = {
  registrationNumber: string
  name: string
  totalSeats: number
  seatType: "seater" | "sleeper" | "semi-sleeper"
  seatLayout: SeatLayoutInput[]
  amenities?: string[]
  operatedBy: string
}

export type UpdateBusRequest = {
  name?: string
  amenities?: string[]
  status?: "active" | "maintenance" | "retired"
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

export type AdminTripItem = {
  tripId: string
  busId: string
  busName: string
  routeId: string
  source: string
  destination: string
  departureTime: string
  arrivalTime: string
  pricePerSeat: number
  totalSeats: number
  availableCount: number
  status: string
}

export type AdminTripListResponse = {
  trips: AdminTripItem[]
  count: number
  page: number
  totalPages: number
}

export type CreateTripRequest = {
  busId: string
  routeId: string
  departureTime: string
  arrivalTime: string
  pricePerSeat: number
}

export type UpdateTripRequest = {
  departureTime?: string
  arrivalTime?: string
  pricePerSeat?: number
  status?: "scheduled" | "cancelled" | "completed" | "in-progress"
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export type AdminBookingItem = {
  bookingId: string
  bookingReference: string
  bookingStatus: string
  paymentStatus: string
  bookedAt: string
  totalAmount: number
  seats: string[]
  passengerCount: number
  user: {
    userId: string
    name: string
    email: string
  }
  trip: {
    tripId: string
    source: string
    destination: string
    departureTime: string
    busName: string
  }
}

export type AdminBookingListResponse = {
  bookings: AdminBookingItem[]
  count: number
  page: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type AdminDashboardResponse = {
  totalTrips: number
  totalBuses: number
  totalRoutes: number
  totalBookings: number
  confirmedBookings: number
}
