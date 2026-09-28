import { BrowserRouter, Route, Routes } from "react-router-dom"
import Navbar from "@/components/layout/Navbar"
import ProtectedRoute from "@/components/ProtectedRoute"
import Home from "@/pages/Home"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import SearchResults from "@/pages/SearchResults"
import TripSeats from "@/pages/TripSeats"
import PassengerDetails from "@/pages/PassengerDetails"
import PaymentPlaceholder from "@/pages/PaymentPlaceholder"
import BookingConfirmation from "@/pages/BookingConfirmation"
import MyBookings from "@/pages/MyBookings"

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-svh bg-background text-foreground">
        <Navbar />
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
        </Routes>
      </div>
    </BrowserRouter>
  )
}
