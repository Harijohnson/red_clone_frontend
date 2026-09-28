import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (user?.role !== "admin" && user?.role !== "operator") {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
