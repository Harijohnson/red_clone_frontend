import { apiClient } from "./api"
import type { AuthResponse, AuthUser, LoginInput, RegisterInput } from "@/types/auth"

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/auth/register", input)
  return res.data
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/auth/login", input)
  return res.data
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await apiClient.get<AuthUser>("/auth/me")
  return res.data
}
