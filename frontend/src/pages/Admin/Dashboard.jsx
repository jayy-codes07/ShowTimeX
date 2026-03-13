import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DollarSign,
  Ticket,
  Film,
  TrendingUp,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  MonitorPlay,
} from "lucide-react";
import RevenueChart from "../../components/Admin/RevenueChart";
import MovieDistributionChart from "../../components/Admin/MovieDistributionChart";
import LeaderboardChart from "../../components/Admin/LeaderboardChart";
import Loader from "../../components/UI/Loader";
import { useTheme } from "../../context/ThemeContext";
import { apiRequest } from "../../services/api";
import { API_ENDPOINTS } from "../../utils/constants";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [movieStatsData, setMovieStatsData] = useState([]);
  const [formatStatsData, setFormatStatsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const currencySymbol = "\u20B9";
  const panelClassName = "rounded-2xl border border-gray-800 bg-dark-card p-4 shadow-sm sm:p-6";

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes] = await Promise.all([
        apiRequest.get(API_ENDPOINTS.ADMIN_STATS),
        apiRequest.get(`${API_ENDPOINTS.ADMIN_BOOKINGS}?limit=5`),
      ]);

      const backendData = statsRes.report || statsRes.stats;

      if (statsRes.success && backendData) {
        setStats(backendData);
        setRevenueData(backendData.revenueData || []);
        setMovieStatsData(backendData.movieStatsData || []);
        setFormatStatsData(backendData.formatStatsData || []);
      }

      if (bookingsRes.success) {
        setRecentBookings(bookingsRes.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading dashboard..." />;
  }

  const formatChange = (value) => {
    if (value === undefined || value === null) {
      return "0%";
    }

    return `${value > 0 ? "+" : ""}${value}%`;
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: `${currencySymbol}${Math.round(stats?.totalRevenue || 0).toLocaleString()}`,
      change: formatChange(stats?.changes?.revenue),
      isPositive: (stats?.changes?.revenue || 0) >= 0,
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings?.toLocaleString() || "0",
      change: formatChange(stats?.changes?.bookings),
      isPositive: (stats?.changes?.bookings || 0) >= 0,
      icon: Ticket,
      color: "bg-blue-500",
    },
    {
      title: "Total Tickets Sold",
      value: stats?.totalTickets?.toLocaleString() || "0",
      change: formatChange(stats?.changes?.tickets),
      isPositive: (stats?.changes?.tickets || 0) >= 0,
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      title: "Avg. Booking Value",
      value: `${currencySymbol}${Math.round(
        stats?.avgBookingValue ||
          (stats?.totalBookings > 0 ? stats.totalRevenue / stats.totalBookings : 0),
      ).toLocaleString()}`,
      change: formatChange(stats?.changes?.avgValue),
      isPositive: (stats?.changes?.avgValue || 0) >= 0,
      icon: Calendar,
      color: "bg-primary",
    },
  ];

  const quickActions = [
    {
      title: "Manage Movies",
      description: "Add new releases, posters, trailers, and genre details.",
      to: "/admin/movies",
      icon: Film,
    },
    {
      title: "Manage Shows",
      description: "Schedule showtimes and keep screens organized for the week.",
      to: "/admin/shows",
      icon: Calendar,
    },
    {
      title: "View Reports",
      description: "Review revenue, booking activity, and audience trends.",
      to: "/admin/reports",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-dark py-6 sm:py-8">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Admin Dashboard</h1>
            <p className="text-gray-400">
              Welcome back. Here is the live performance snapshot for your cinema.
            </p>
          </div>
          <div className="inline-flex w-fit items-center rounded-full border border-gray-800 bg-dark-card px-4 py-2 text-sm text-gray-500">
            Updated from current bookings and revenue data
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${panelClassName} mb-8`}
        >
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Quick Actions</h2>
              <p className="text-sm text-gray-500">
                Keep the most common admin tasks within one click.
              </p>
            </div>
            <Link
              to="/admin/reports"
              className="text-sm font-medium text-primary transition hover:text-primary-light"
            >
              Open full reports
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;

              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.08 }}
                >
                  <Link
                    to={action.to}
                    className={`dashboard-quick-action dashboard-quick-action-${theme} group`}
                  >
                    <div
                      className={`dashboard-quick-action-icon dashboard-quick-action-icon-${theme} flex h-12 w-12 shrink-0 items-center justify-center rounded-xl`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold text-white">{action.title}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-500">{action.description}</p>
                    </div>
                    <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const ChangeIcon = stat.isPositive ? ArrowUpRight : ArrowDownRight;

            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.08 }}
                className={`${panelClassName} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div
                    className={`flex items-center space-x-1 text-sm ${
                      stat.isPositive ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    <ChangeIcon className="h-4 w-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <h3 className="mb-1 text-sm text-gray-400">{stat.title}</h3>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className={panelClassName}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Revenue Trend</h2>
                <p className="text-sm text-gray-500">Daily earnings over the last 7 days</p>
              </div>
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            {revenueData.length > 0 ? (
              <RevenueChart data={revenueData} theme={theme} />
            ) : (
              <p className="flex h-[300px] items-center justify-center text-gray-500">
                No revenue data yet
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className={panelClassName}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Top Movies</h2>
                <p className="text-sm text-gray-500">Ticket sales by title</p>
              </div>
              <Film className="h-6 w-6 text-purple-500" />
            </div>
            {movieStatsData.length > 0 ? (
              <LeaderboardChart data={movieStatsData} theme={theme} />
            ) : (
              <p className="flex h-[250px] items-center justify-center text-gray-500">
                No movie data yet
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className={panelClassName}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Format Revenue</h2>
                <p className="text-sm text-gray-500">Earnings across screen types</p>
              </div>
              <MonitorPlay className="h-6 w-6 text-blue-500" />
            </div>
            {formatStatsData.length > 0 ? (
              <MovieDistributionChart data={formatStatsData} theme={theme} />
            ) : (
              <p className="flex h-[300px] items-center justify-center text-gray-500">
                No format data yet
              </p>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className={panelClassName}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Recent Bookings</h2>
            <Link
              to="/admin/reports"
              className="text-sm font-medium text-primary transition hover:text-primary-light"
            >
              View All
            </Link>
          </div>

          {recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                      Booking ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Movie</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Seats</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className="admin-table-row border-b border-gray-800"
                    >
                      <td className="px-4 py-3 text-sm text-white">{booking.bookingId}</td>
                      <td className="px-4 py-3 text-sm text-white">{booking.user?.name}</td>
                      <td className="px-4 py-3 text-sm text-white">{booking.movie?.title}</td>
                      <td className="px-4 py-3 text-sm text-white">{booking.seats?.length}</td>
                      <td className="px-4 py-3 text-sm font-semibold money-value">
                        {currencySymbol}
                        {booking.totalAmount?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                            booking.status === "confirmed"
                              ? "bg-green-500/20 text-green-500"
                              : booking.status === "cancelled"
                                ? "bg-red-500/20 text-red-500"
                                : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-gray-400">No recent bookings</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
