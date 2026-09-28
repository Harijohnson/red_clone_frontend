import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import Navbar from "@/components/layout/Navbar"
import ProtectedRoute from "@/components/ProtectedRoute"
import AdminRoute from "@/components/AdminRoute"
import Home from "@/pages/Home"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import SearchResults from "@/pages/SearchResults"
import TripSeats from "@/pages/TripSeats"
import PassengerDetails from "@/pages/PassengerDetails"
import PaymentPlaceholder from "@/pages/PaymentPlaceholder"
import BookingConfirmation from "@/pages/BookingConfirmation"
import MyBookings from "@/pages/MyBookings"
import AdminLayout from "@/pages/admin/AdminLayout"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import AdminTrips from "@/pages/admin/AdminTrips"
import AdminBuses from "@/pages/admin/AdminBuses"
import AdminRoutes from "@/pages/admin/AdminRoutes"
import AdminBookings from "@/pages/admin/AdminBookings"

function AppShell() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith("/admin")

  return (
    <div className="min-h-svh bg-background text-foreground">
      {!isAdmin && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<SearchResults />} />
        <Route
          path="/trips/:tripId/seats"
          element={
            <ProtectedRoute>
              <TripSeats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/passenger-details"
          element={
            <ProtectedRoute>
              <PassengerDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/payment"
          element={
            <ProtectedRoute>
              <PaymentPlaceholder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:bookingId"
          element={
            <ProtectedRoute>
              <BookingConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="trips" element={<AdminTrips />} />
          <Route path="buses" element={<AdminBuses />} />
          <Route path="routes" element={<AdminRoutes />} />
          <Route path="bookings" element={<AdminBookings />} />
        </Route>
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
