import React, { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";
import { ThemeProvider } from "./context/ThemeContext";
import PageTransition from "./components/Common/PageTransition";
import Loader from "./components/UI/Loader";

// Layouts
import Navbar from "./components/Common/Navbar";
import Footer from "./components/Common/Footer";

// Protected Route Component
import ProtectedRoute from "./components/Common/ProtectedRoute";

const HomePage = lazy(() => import("./pages/Visitor/HomePage"));
const MovieDetails = lazy(() => import("./pages/Visitor/MovieDetails"));
const SearchPage = lazy(() => import("./pages/Visitor/SearchPage"));
const Login = lazy(() => import("./pages/Customer/Login"));
const Register = lazy(() => import("./pages/Customer/Register"));
const Payment = lazy(() => import("./pages/Customer/Payment"));
const ReceiptPage = lazy(() => import("./pages/Customer/ReceiptPage"));
const MyTickets = lazy(() => import("./pages/Customer/MyTickets"));
const Profile = lazy(() => import("./pages/Customer/Profile"));
const Dashboard = lazy(() => import("./pages/Admin/Dashboard"));
const ManageMovies = lazy(() => import("./pages/Admin/ManageMovies"));
const ManageShows = lazy(() => import("./pages/Admin/ManageShows"));
const Reports = lazy(() => import("./pages/Admin/Reports"));
const AllMovies = lazy(() => import("./pages/Visitor/Allmovies"));
const NotFound = lazy(() => import("./pages/NotFound"));

function AppLayout() {
  const location = useLocation();
  const { loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark">
      <Navbar />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Suspense fallback={<Loader />}>
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
                </Suspense>
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
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BookingProvider>
          <AppLayout />
        </BookingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
