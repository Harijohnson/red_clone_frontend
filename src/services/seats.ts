import { apiClient } from "@/services/api"
import type {
  TripSeatsResponse,
  LockSeatsRequest,
  LockSeatsResponse,
  ConfirmBookingRequest,
  ConfirmBookingResponse,
} from "@/types"

export async function fetchTripSeats(tripId: string): Promise<TripSeatsResponse> {
  const response = await apiClient.get<TripSeatsResponse>(`/trips/${tripId}/seats`)
  return response.data
}

export async function lockSeats(
  tripId: string,
  payload: LockSeatsRequest,
): Promise<LockSeatsResponse> {
  const response = await apiClient.post<LockSeatsResponse>(
    `/trips/${tripId}/seats/lock`,
    payload,
  )
  return response.data
}

export async function releaseLock(tripId: string): Promise<void> {
  await apiClient.delete(`/trips/${tripId}/seats/lock`)
}

export async function confirmBooking(
  bookingId: string,
  payload: ConfirmBookingRequest = {},
): Promise<ConfirmBookingResponse> {
  const response = await apiClient.post<ConfirmBookingResponse>(
    `/bookings/${bookingId}/confirm`,
    payload,
  )
  return response.data
}
