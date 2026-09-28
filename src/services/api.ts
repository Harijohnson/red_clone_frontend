import axios from "axios"
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import type { ApiError } from "@/types/api"

const TOKEN_KEY = "rc_token"
// Support both Node (process.env) and Vite (import.meta.env) environments
const baseURL = (
  // when running in Node-like envs (use globalThis to avoid missing 'process' type in browser builds)
  (typeof globalThis !== "undefined" ? (globalThis as any)?.process?.env?.BACKEND_API_URL : undefined) ||
  // when running in Vite / browser env with import.meta.env (commonly VITE_ prefix)
  ((typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_BACKEND_API_URL : undefined) as string)
)

if (!baseURL) {
  throw new Error("BACKEND_API_URL is not defined. Check your .env file.")
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
