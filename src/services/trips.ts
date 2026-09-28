import { apiClient } from "@/services/api"
import type { SearchParams, TripSearchResponse } from "@/types"

export async function searchTrips(params: SearchParams): Promise<TripSearchResponse> {
  const response = await apiClient.get<TripSearchResponse>("/trips/search", {
    params: {
      from: params.from,
      to: params.to,
      date: params.date,
    },
  })
  return response.data
}
