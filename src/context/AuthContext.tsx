import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { AuthUser } from "@/types/auth"
import * as authService from "@/services/auth"

const TOKEN_KEY = "rc_token"

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: AuthUser }

type AuthContextValue = {
  state: AuthState
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" })

  const login = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    setState({ status: "authenticated", user })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setState({ status: "unauthenticated" })
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setState({ status: "unauthenticated" })
      return
    }

    authService
      .fetchMe()
      .then((user) => setState({ status: "authenticated", user }))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setState({ status: "unauthenticated" })
      })
  }, [])

  const value: AuthContextValue = {
    state,
    user: state.status === "authenticated" ? state.user : null,
    isAuthenticated: state.status === "authenticated",
    isLoading: state.status === "loading",
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
