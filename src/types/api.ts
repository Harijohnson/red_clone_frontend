export type ApiResponse<T> = {
  data: T
  message: string
  success: boolean
}

export type PaginatedResponse<T> = ApiResponse<{
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}>

export type ApiError = {
  message: string
  status: number
  errors?: Record<string, string[]>
}
