import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function Navbar() {
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout(): void {
    logout()
    navigate("/")
  }

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-tight">
          RedColne
        </Link>

        {!isLoading && (
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/my-bookings"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  My Bookings
                </Link>
                {(user.role === "admin" || user.role === "operator") && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Admin
                  </Link>
                )}
                <span className="text-sm text-muted-foreground">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
