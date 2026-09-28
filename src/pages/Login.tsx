import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import * as authService from "@/services/auth"
import type { ApiError } from "@/types/api"

type FormState = {
  email: string
  password: string
}

type FormErrors = {
  email?: string
  password?: string
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "A valid email address is required."
  }
  if (!form.password) {
    errors.password = "Password is required."
  }
  return errors
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? "/"

  const [form, setForm] = useState<FormState>({ email: "", password: "" })
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setApiError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    const trimmed: FormState = { email: form.email.trim(), password: form.password }
    const validationErrors = validate(trimmed)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setApiError(null)

    try {
      const result = await authService.login(trimmed)
      login(result.token, result.user)
      navigate(from, { replace: true })
    } catch (err) {
      const apiErr = err as ApiError
      setApiError(apiErr.message ?? "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center gap-8 px-4 py-20">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign In</h1>
        <p className="mt-2 text-muted-foreground">Welcome back to RedColne.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="flex flex-col gap-5">
          <Field label="Email" error={errors.email}>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass(!!errors.email)}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              className={inputClass(!!errors.password)}
            />
          </Field>

          {apiError && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {apiError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </form>

      <p className="text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/register" className="text-primary underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </main>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function inputClass(hasError: boolean): string {
  return [
    "rounded-md border bg-background px-3 py-2 text-sm outline-none",
    "placeholder:text-muted-foreground",
    "focus:ring-2 focus:ring-ring focus:ring-offset-1",
    hasError ? "border-destructive focus:ring-destructive/40" : "border-input",
  ].join(" ")
}
