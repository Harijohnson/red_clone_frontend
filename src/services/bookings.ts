import { apiClient } from "@/services/api"
import type { BookingDetail, BookingListResponse } from "@/types"

export type CreateBookingPassenger = {
  name: string
  age: number
  seatNumber: string
}

export type CreateBookingRequest = {
  tripId: string
  passengers: CreateBookingPassenger[]
}

export async function createBooking(payload: CreateBookingRequest): Promise<BookingDetail> {
  const response = await apiClient.post<BookingDetail>("/bookings", payload)
  return response.data
}

export async function fetchMyBookings(): Promise<BookingListResponse> {
  const response = await apiClient.get<BookingListResponse>("/bookings")
  return response.data
}

export async function fetchBookingById(bookingId: string): Promise<BookingDetail> {
  const response = await apiClient.get<BookingDetail>(`/bookings/${bookingId}`)
  return response.data
}
