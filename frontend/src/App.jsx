import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";
import { ThemeProvider } from "./context/ThemeContext";
import PageTransition from "./components/Common/PageTransition";
import Loader from "./components/UI/Loader";
import { useFaviconTheme } from "./hooks/useFaviconTheme";

// Layouts
import Navbar from "./components/Common/Navbar";
import Footer from "./components/Common/Footer";
import AdminSidebar from "./components/Common/AdminSidebar";

// Protected Route Component
import ProtectedRoute from "./components/Common/ProtectedRoute";

const HomePage = lazy(() => import("./pages/Visitor/HomePage"));
const MovieDetails = lazy(() => import("./pages/Visitor/MovieDetails"));
const SearchPage = lazy(() => import("./pages/Visitor/SearchPage"));
const Login = lazy(() => import("./pages/Customer/Login"));
const Register = lazy(() => import("./pages/Customer/Register"));
const ForgotPassword = lazy(() => import("./pages/Customer/ForgotPassword"));
const Payment = lazy(() => import("./pages/Customer/Payment"));
const ReceiptPage = lazy(() => import("./pages/Customer/ReceiptPage"));
const MyTickets = lazy(() => import("./pages/Customer/MyTickets"));
const Profile = lazy(() => import("./pages/Customer/Profile"));
const Dashboard = lazy(() => import("./pages/Admin/Dashboard"));
const ManageMovies = lazy(() => import("./pages/Admin/ManageMovies"));
const ManageShows = lazy(() => import("./pages/Admin/ManageShows"));
const ManageBookings = lazy(() => import("./pages/Admin/ManageBookings"));
const Reports = lazy(() => import("./pages/Admin/Reports"));
const UsersPage = lazy(() => import("./pages/Admin/Users"));
const AllMovies = lazy(() => import("./pages/Visitor/Allmovies"));
const NotFound = lazy(() => import("./pages/NotFound"));

function AppLayout() {
  const location = useLocation();
  const { loading } = useAuth();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Update favicon based on theme
  useFaviconTheme();

  useEffect(() => {
    document.body.classList.toggle("admin-route", isAdminRoute);
    document.documentElement.classList.toggle("admin-route", isAdminRoute);

    return () => {
      document.body.classList.remove("admin-route");
      document.documentElement.classList.remove("admin-route");
    };
  }, [isAdminRoute]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark">
      <Navbar />
      <main className={`flex-grow pt-16 sm:pt-20 ${isAdminRoute ? "py-0" : ""}`}>
        {isAdminRoute ? (
          <div className="min-h-[calc(100vh-5rem)]">
            <AdminSidebar />
            <div className="min-w-0 px-4 py-6 sm:px-6 lg:ml-72 lg:px-8">
                <AnimatePresence mode="wait">
                  <Suspense fallback={<Loader />}>
                    <Routes location={location} key={location.pathname}>
                      {/* Public Routes */}
                      <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
                      <Route path="/movie/:id" element={<PageTransition><MovieDetails /></PageTransition>} />
                      <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
                      <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                      <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                      <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
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
                        path="/admin/bookings"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <PageTransition><ManageBookings /></PageTransition>
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
                      <Route
                        path="/admin/users"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <PageTransition><UsersPage /></PageTransition>
                          </ProtectedRoute>
                        }
                      />

                      {/* 404 Route */}
                      <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                    </Routes>
                  </Suspense>
                </AnimatePresence>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <Suspense fallback={<Loader />}>
              <Routes location={location} key={location.pathname}>
                    {/* Public Routes */}
                    <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
                    <Route path="/movie/:id" element={<PageTransition><MovieDetails /></PageTransition>} />
                    <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
                    <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                    <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                    <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
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
                      path="/admin/bookings"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <PageTransition><ManageBookings /></PageTransition>
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
                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <PageTransition><UsersPage /></PageTransition>
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 Route */}
                    <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        )}
      </main>
      {!isAdminRoute && <Footer />}

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
