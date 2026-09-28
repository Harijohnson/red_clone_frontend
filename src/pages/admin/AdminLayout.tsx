import { NavLink, Outlet } from "react-router-dom"

const NAV_LINKS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/trips", label: "Trips", end: false },
  { to: "/admin/buses", label: "Buses", end: false },
  { to: "/admin/routes", label: "Routes", end: false },
  { to: "/admin/bookings", label: "Bookings", end: false },
]

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage trips, buses, routes, and bookings.</p>
      </div>

      <nav className="mb-8 flex gap-1 border-b pb-1">
        {NAV_LINKS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              ].join(" ")
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
