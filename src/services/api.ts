import axios from "axios"
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import type { ApiError } from "@/types/api"

const TOKEN_KEY = "rc_token"

const baseURL = import.meta.env.API_URL as string

if (!baseURL) {
  throw new Error("API_URL is not defined. Check your .env file.")
}

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const apiError: ApiError = {
        message: (error.response?.data as { message?: string })?.message ?? error.message,
        status: error.response?.status ?? 0,
        errors: (error.response?.data as { errors?: Record<string, string[]> })?.errors,
      }
      return Promise.reject(apiError)
    }
    return Promise.reject(error)
  }
)
