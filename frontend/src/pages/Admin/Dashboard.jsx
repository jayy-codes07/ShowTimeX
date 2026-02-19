import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import RevenueChart from "../../components/Admin/RevenueChart";
import MovieDistributionChart from "../../components/Admin/MovieDistributionChart";
import LeaderboardChart from "../../components/Admin/LeaderboardChart";

import {
  DollarSign,
  Users,
  Ticket,
  Film,
  TrendingUp,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  MonitorPlay // Added a new icon for the Format chart
} from "lucide-react";
import Loader from "../../components/UI/Loader";
import { apiRequest } from "../../services/api";
import { API_ENDPOINTS } from "../../utils/constants";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes] = await Promise.all([
        apiRequest.get(API_ENDPOINTS.ADMIN_STATS),
        apiRequest.get(API_ENDPOINTS.ADMIN_BOOKINGS + "?limit=5"),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (bookingsRes.success) setRecentBookings(bookingsRes.bookings || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen message="Loading dashboard..." />;

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${stats?.totalRevenue?.toLocaleString() || "0"}`,
      change: "+12.5%",
      isPositive: true,
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings?.toLocaleString() || "0",
      change: "+8.2%",
      isPositive: true,
      icon: Ticket,
      color: "bg-blue-500",
    },
    {
      title: "Active Users",
      value: stats?.totalUsers?.toLocaleString() || "0",
      change: "+5.7%",
      isPositive: true,
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Total Movies",
      value: stats?.totalMovies?.toLocaleString() || "0",
      change: "+2",
      isPositive: true,
      icon: Film,
      color: "bg-primary",
    },
  ];

  // --- CHART DATA ---
  const revenueData = [
    { date: "Mon", revenue: 12000 },
    { date: "Tue", revenue: 18000 },
    { date: "Wed", revenue: 15000 },
    { date: "Thu", revenue: 22000 },
    { date: "Fri", revenue: 28000 },
    { date: "Sat", revenue: 35000 },
    { date: "Sun", revenue: 40000 },
  ];

  const movieStatsData = [
    { name: "Pushpa 2", value: 400 },
    { name: "Avatar 3", value: 300 },
    { name: "Dune", value: 300 },
    { name: "Fighter", value: 200 },
  ];

  const formatStatsData = [
    { name: "2D", value: 5000 },
    { name: "3D", value: 3000 },
    { name: "IMAX", value: 2000 },
    { name: "4DX", value: 1500 },
  ];

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container-custom">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const ChangeIcon = stat.isPositive ? ArrowUpRight : ArrowDownRight;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-card rounded-xl p-6 hover:shadow-xl transition-shadow border border-gray-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${stat.isPositive ? "text-green-500" : "text-red-500"}`}>
                    <ChangeIcon className="w-4 h-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* 🟢 HORIZONTALLY SCROLLABLE CHARTS SECTION */}
        <div className="flex overflow-x-auto gap-6 pb-4 mb-8 snap-x snap-mandatory [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-track]:bg-dark-lighter">
          
          {/* Chart 1: Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-dark-card rounded-xl p-6 border border-gray-800 min-w-[500px] flex-shrink-0 snap-start"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Revenue Trend</h2>
                <p className="text-sm text-gray-500">Daily earnings over the last 7 days</p>
              </div>
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <RevenueChart data={revenueData} />
          </motion.div>

          {/* Chart 2: Top Movies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-dark-card rounded-xl p-6 border border-gray-800 min-w-[400px] flex-shrink-0 snap-start"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Top Movies</h2>
                <p className="text-sm text-gray-500">Ticket sales by title</p>
              </div>
              <Film className="w-6 h-6 text-purple-500" />
            </div>
            <LeaderboardChart data={movieStatsData} />
          </motion.div>

          {/* Chart 3: Format Popularity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-dark-card rounded-xl p-6 border border-gray-800 min-w-[400px] flex-shrink-0 snap-start"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Format Revenue</h2>
                <p className="text-sm text-gray-500">Earnings across screen types</p>
              </div>
              <MonitorPlay className="w-6 h-6 text-blue-500" />
            </div>
            {/* Reusing the exact same Pie chart component for different data! */}
            <MovieDistributionChart data={formatStatsData} />
          </motion.div>

        </div>

        {/* Bottom Section: Recent Bookings & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Recent Bookings (Takes up 3/4 of the bottom row) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-3 bg-dark-card rounded-xl p-6 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Bookings</h2>
              <Link to="/admin/reports" className="text-primary hover:text-primary-light text-sm">
                View All →
              </Link>
            </div>

            {recentBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Booking ID</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Customer</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Movie</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Seats</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking._id} className="border-b border-gray-800 hover:bg-dark-lighter transition">
                        <td className="py-3 px-4 text-white text-sm">{booking.bookingId}</td>
                        <td className="py-3 px-4 text-white text-sm">{booking.user?.name}</td>
                        <td className="py-3 px-4 text-white text-sm">{booking.movie?.title}</td>
                        <td className="py-3 px-4 text-white text-sm">{booking.seats?.length}</td>
                        <td className="py-3 px-4 text-primary font-semibold text-sm">₹{booking.totalAmount?.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            booking.status === "confirmed" ? "bg-green-500/20 text-green-500" :
                            booking.status === "cancelled" ? "bg-red-500/20 text-red-500" :
                            "bg-yellow-500/20 text-yellow-500"
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No recent bookings</p>
            )}
          </motion.div>

          {/* Quick Actions (Takes up 1/4 of the bottom row) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-dark-card rounded-xl p-6 border border-gray-800 h-full"
          >
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <Link to="/admin/movies" className="block p-4 bg-dark-lighter rounded-lg hover:bg-dark hover:border hover:border-primary transition group">
                <div className="flex items-center space-x-3">
                  <Film className="w-5 h-5 text-primary" />
                  <div className="flex-grow">
                    <p className="text-white font-semibold group-hover:text-primary transition">Manage Movies</p>
                    <p className="text-gray-500 text-xs mt-1">Add or edit movies</p>
                  </div>
                </div>
              </Link>
              <Link to="/admin/shows" className="block p-4 bg-dark-lighter rounded-lg hover:bg-dark hover:border hover:border-primary transition group">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div className="flex-grow">
                    <p className="text-white font-semibold group-hover:text-primary transition">Manage Shows</p>
                    <p className="text-gray-500 text-xs mt-1">Schedule showtimes</p>
                  </div>
                </div>
              </Link>
              <Link to="/admin/reports" className="block p-4 bg-dark-lighter rounded-lg hover:bg-dark hover:border hover:border-primary transition group">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <div className="flex-grow">
                    <p className="text-white font-semibold group-hover:text-primary transition">View Reports</p>
                    <p className="text-gray-500 text-xs mt-1">Sales analytics</p>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;