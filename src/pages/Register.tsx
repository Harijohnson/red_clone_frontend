import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import * as authService from "@/services/auth"
import type { ApiError } from "@/types/api"

type FormState = {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone: string
}

type FormErrors = {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim() || form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters."
  }
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "A valid email address is required."
  }
  if (!form.password || form.password.length < 8) {
    errors.password = "Password must be at least 8 characters."
  }
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match."
  }
  return errors
}

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })
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

    const trimmed: FormState = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      phone: form.phone.trim(),
    }

    const validationErrors = validate(trimmed)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setApiError(null)

    try {
      const result = await authService.register({
        name: trimmed.name,
        email: trimmed.email,
        password: trimmed.password,
        ...(trimmed.phone ? { phone: trimmed.phone } : {}),
      })
      login(result.token, result.user)
      navigate("/", { replace: true })
    } catch (err) {
      const apiErr = err as ApiError
      setApiError(apiErr.message ?? "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center gap-8 px-4 py-20">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Create Account</h1>
        <p className="mt-2 text-muted-foreground">Join RedColne to book bus tickets.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="flex flex-col gap-5">
          <Field label="Full Name" error={errors.name}>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Smith"
              autoComplete="name"
              className={inputClass(!!errors.name)}
            />
          </Field>

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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={inputClass(!!errors.password)}
            />
          </Field>

          <Field label="Confirm Password" error={errors.confirmPassword}>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              autoComplete="new-password"
              className={inputClass(!!errors.confirmPassword)}
            />
          </Field>

          <Field label="Phone (optional)">
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              autoComplete="tel"
              className={inputClass(false)}
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
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </div>
      </form>

      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
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
