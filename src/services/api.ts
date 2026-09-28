import axios from "axios"
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import type { ApiError } from "@/types/api"

const TOKEN_KEY = "rc_token"

// Prefer non-prefixed `BACKEND_API_URL` (Vercel/runtime). Fall back to other sources.
const runtimeMeta = typeof document !== "undefined" ? document.querySelector('meta[name="backend-api-url"]')?.getAttribute("content") : undefined
const injected = (globalThis as any).__env?.BACKEND_API_URL ?? (globalThis as any).BACKEND_API_URL

const baseURL = (
  import.meta.env.BACKEND_API_URL ??
  import.meta.env.VITE_BACKEND_API_URL ??
  injected ??
  runtimeMeta
) as string

if (!baseURL) {
  throw new Error(
    "BACKEND_API_URL is not defined. Set it in your deployment environment, or inject it at runtime via a meta tag or globalThis.BACKEND_API_URL."
  )
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
