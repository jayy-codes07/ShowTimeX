import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";
import { ThemeProvider } from "./context/ThemeContext";
import ReceiptPage from "./pages/Customer/ReceiptPage";
import PageTransition from "./components/Common/PageTransition";


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
import NotFound from "./pages/NotFound";

function App() {
  const location = useLocation();

  return (
    <ThemeProvider>
      <AuthProvider>
        <BookingProvider>
          <div className="min-h-screen flex flex-col bg-dark">
            <Navbar />
            <main className="flex-grow">
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  {/* Public Routes */}
                  <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
                  <Route path="/movie/:id" element={<PageTransition><MovieDetails /></PageTransition>} />
                  <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
                  <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                  <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                  <Route path="/movies" element={<PageTransition><AllMovies /></PageTransition>} />

                  {/* Customer Protected Routes */}
                  <Route
                    path="/payment"
                    element={
                      <ProtectedRoute allowedRoles={["customer", "admin"]}>
                        <PageTransition><Payment /></PageTransition>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/receipt/:bookingId"
                    element={
                      <ProtectedRoute allowedRoles={["customer", "admin"]}>
                        <PageTransition><ReceiptPage /></PageTransition>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/my-tickets"
                    element={
                      <ProtectedRoute allowedRoles={["customer", "admin"]}>
                        <PageTransition><MyTickets /></PageTransition>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute allowedRoles={["customer", "admin"]}>
                        <PageTransition><Profile /></PageTransition>
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Protected Routes */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <PageTransition><Dashboard /></PageTransition>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/movies"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <PageTransition><ManageMovies /></PageTransition>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/shows"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <PageTransition><ManageShows /></PageTransition>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/reports"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <PageTransition><Reports /></PageTransition>
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Route */}
                  <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                </Routes>
              </AnimatePresence>
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
                    border: "1px solid #22c55e", // Green border for success
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
    </ThemeProvider>
  );
}

export default App;
