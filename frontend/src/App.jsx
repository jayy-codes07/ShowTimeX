import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";

// Layouts
import Navbar from "./components/Common/Navbar";
import Footer from "./components/Common/Footer";

// Visitor Pages
import HomePage from "./pages/Visitor/HomePage";
import MovieDetails from "./pages/Visitor/MovieDetails";
import SearchPage from "./pages/Visitor/SearchPage";

// Customer Pages
import Login from "./pages/Customer/Login";
import Register from "./pages/Customer/Register";
import Payment from "./pages/Customer/Payment";
import MyTickets from "./pages/Customer/MyTickets";
import Profile from "./pages/Customer/Profile";

// Admin Pages
import Dashboard from "./pages/Admin/Dashboard";
import ManageMovies from "./pages/Admin/ManageMovies";
import ManageShows from "./pages/Admin/ManageShows";
import Reports from "./pages/Admin/Reports";

// Protected Route Component
import ProtectedRoute from "./components/Common/ProtectedRoute";
import AllMovies from "./pages/Visitor/Allmovies";

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <div className="min-h-screen flex flex-col bg-dark">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/movies" element={<AllMovies />} />

              {/* Customer Protected Routes */}
              <Route
                path="/payment"
                element={
                  <ProtectedRoute allowedRoles={["customer", "admin"]}>
                    <Payment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-tickets"
                element={
                  <ProtectedRoute allowedRoles={["customer", "admin"]}>
                    <MyTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={["customer", "admin"]}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/movies"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ManageMovies />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/shows"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ManageShows />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              // Default style for all toasts
              style: {
                background: "#2A2A2A",
                color: "#fff",
                border: "1px solid #444",
              },
              success: {
                style: {
                  border: "1px solid #ef4444", // Green border
                },
                iconTheme: {
                  primary: "#22c55e", // Green icon
                  secondary: "#fff",
                },
              },
              error: {
                style: {
                  border: "1px solid #ef4444", // Red border
                },
                iconTheme: {
                  primary: "#ef4444", // Red icon
                  secondary: "#fff",
                },
              },
            }}
          />
        </div>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;
