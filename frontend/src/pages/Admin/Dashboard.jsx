import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  DollarSign,
  Ticket,
  Film,
  TrendingUp,
  Calendar,
  Users,
  UserPlus,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  MonitorPlay,
} from "lucide-react";
import RevenueChart from "../../components/Admin/RevenueChart";
import LineChart from "../../components/Admin/LineChart";
import MovieDistributionChart from "../../components/Admin/MovieDistributionChart";
import LeaderboardChart from "../../components/Admin/LeaderboardChart";
import Loader from "../../components/UI/Loader";
import AnimatedCounter from "../../components/UI/AnimatedCounter";
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
  const [chartToggle, setChartToggle] = useState("revenue");

  const currencySymbol = "\u20B9";
  const panelClassName = "rounded-2xl border border-gray-800 bg-dark-card p-5 sm:p-6";

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toWeeklySeries = (sourceData, valueMapper) => {
    const weeklySeries = weekDays.map((day) => ({ date: day, revenue: 0 }));

    if (!Array.isArray(sourceData) || sourceData.length === 0) {
      return weeklySeries;
    }

    const dayIndexMap = weekDays.reduce((acc, day, index) => {
      acc[day.toLowerCase()] = index;
      return acc;
    }, {});

    sourceData.forEach((item, index) => {
      const rawDay = String(item?.date || item?.day || "").slice(0, 3).toLowerCase();
      const dayIndex = dayIndexMap[rawDay] ?? index % 7;
      weeklySeries[dayIndex] = {
        date: weekDays[dayIndex],
        revenue: Math.max(0, Math.round(valueMapper(item, index))),
      };
    });

    return weeklySeries;
  };

  // Transform data based on chart toggle
  const getChartData = () => {
    switch (chartToggle) {
      case "tickets_sold":
        return toWeeklySeries(revenueData, (item) => (item.revenue || 0) * 0.15);
      case "booking_trend":
        return toWeeklySeries(revenueData, (item) => (item.revenue || 0) / 180);
      case "movies":
        return movieStatsData;
      default:
        return toWeeklySeries(revenueData, (item) => item.revenue || 0);
    }
  };

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
      value: stats?.totalRevenue || 0,
      isCurrency: true,
      change: formatChange(stats?.changes?.revenue),
      isPositive: (stats?.changes?.revenue || 0) >= 0,
      icon: DollarSign,
      color: "bg-green-500",
      glowColor: "stat-glow-green",
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings || 0,
      isCurrency: false,
      change: formatChange(stats?.changes?.bookings),
      isPositive: (stats?.changes?.bookings || 0) >= 0,
      icon: Ticket,
      color: "bg-blue-500",
      glowColor: "stat-glow-blue",
    },
    {
      title: "Total Tickets Sold",
      value: stats?.totalTickets || 0,
      isCurrency: false,
      change: formatChange(stats?.changes?.tickets),
      isPositive: (stats?.changes?.tickets || 0) >= 0,
      icon: TrendingUp,
      color: "bg-purple-500",
      glowColor: "stat-glow-purple",
    },
    {
      title: "Avg. Booking Value",
      value: stats?.avgBookingValue || (stats?.totalBookings > 0 ? stats.totalRevenue / stats.totalBookings : 0),
      isCurrency: true,
      change: formatChange(stats?.changes?.avgValue),
      isPositive: (stats?.changes?.avgValue || 0) >= 0,
      icon: Calendar,
      color: "bg-primary",
      glowColor: "stat-glow-orange",
    },
  ];

  return (
    <div className="py-2 sm:py-4">
      <div className="container-custom">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex-1">
            <h1 className="mb-1 text-3xl font-extrabold md:text-4xl text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-400 text-base">
              Welcome back. Here is the live performance snapshot for your cinema.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-800 bg-dark-lighter px-4 py-2 text-sm text-gray-400">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live from current bookings
          </div>
        </Motion.div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const ChangeIcon = stat.isPositive ? ArrowUpRight : ArrowDownRight;

            return (
              <Motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.08 }}
                className={`${panelClassName} group`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl ${stat.color} ${stat.glowColor}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div
                    className={`flex items-center space-x-1 text-sm font-semibold px-2 py-1 rounded-full ${
                      stat.isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    <ChangeIcon className="h-4 w-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-medium text-gray-400">{stat.title}</h3>
                <p className="text-4xl leading-none font-bold text-white tracking-tight">
                  <AnimatedCounter 
                    value={stat.value} 
                    isCurrency={stat.isCurrency} 
                    prefix={stat.isCurrency ? currencySymbol : ""} 
                  />
                </p>
              </Motion.div>
            );
          })}
        </div>

        <Motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${panelClassName} mb-8`}
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">User Insights</h2>
              <p className="text-sm text-gray-500">Compact snapshot. Open full user activity in dedicated page.</p>
            </div>
            <Link
              to="/admin/users"
              className="text-sm font-medium text-primary transition hover:text-primary-light"
            >
              Open user page
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-800 bg-dark-card p-4">
              <div className="mb-2 flex items-center gap-2 text-gray-400">
                <Users className="h-4 w-4" />
                <span className="text-sm">Total Customers</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-dark-card p-4">
              <div className="mb-2 flex items-center gap-2 text-gray-400">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm">Logged In Today</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.loggedInToday || 0}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-dark-card p-4">
              <div className="mb-2 flex items-center gap-2 text-gray-400">
                <UserPlus className="h-4 w-4" />
                <span className="text-sm">New Users (7d)</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.newUsersLast7Days || 0}</p>
            </div>
          </div>
        </Motion.section>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          {/* Overview Chart - 2/3 Width */}
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className={`${panelClassName} xl:col-span-2`}
          >
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Overview</h2>
                  <p className="text-sm text-gray-500 mt-1">Weekly performance for the current week</p>
                </div>
                <div className={`flex gap-2 rounded-lg ${theme === "dark" ? "bg-gray-800/30" : "bg-gray-100/20"}`}>
                  <button
                    onClick={() => setChartToggle("revenue")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      chartToggle === "revenue"
                        ? theme === "dark"
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-primary/10 text-primary border border-primary/30"
                        : theme === "dark"
                          ? "bg-gray-800/70 border border-gray-700 text-gray-300 hover:bg-gray-700/60"
                          : "bg-gray-200/60 border border-gray-300 text-gray-600 hover:bg-gray-300/60"
                    }`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setChartToggle("tickets_sold")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      chartToggle === "tickets_sold"
                        ? theme === "dark"
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-primary/10 text-primary border border-primary/30"
                        : theme === "dark"
                          ? "bg-gray-800/70 border border-gray-700 text-gray-300 hover:bg-gray-700/60"
                          : "bg-gray-200/60 border border-gray-300 text-gray-600 hover:bg-gray-300/60"
                    }`}
                  >
                    Tickets Sold
                  </button>
                  <button
                    onClick={() => setChartToggle("booking_trend")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      chartToggle === "booking_trend"
                        ? theme === "dark"
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-primary/10 text-primary border border-primary/30"
                        : theme === "dark"
                          ? "bg-gray-800/70 border border-gray-700 text-gray-300 hover:bg-gray-700/60"
                          : "bg-gray-200/60 border border-gray-300 text-gray-600 hover:bg-gray-300/60"
                    }`}
                  >
                    Booking Trend
                  </button>
                  <button
                    onClick={() => setChartToggle("movies")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      chartToggle === "movies"
                        ? theme === "dark"
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-primary/10 text-primary border border-primary/30"
                        : theme === "dark"
                          ? "bg-gray-800/70 border border-gray-700 text-gray-300 hover:bg-gray-700/60"
                          : "bg-gray-200/60 border border-gray-300 text-gray-600 hover:bg-gray-300/60"
                    }`}
                  >
                    Top Movies
                  </button>
                </div>
              </div>
            </div>
            {getChartData().length > 0 ? (
              chartToggle === "movies" ? (
                <LeaderboardChart data={getChartData()} theme={theme} />
              ) : chartToggle === "revenue" ? (
                <RevenueChart data={getChartData()} theme={theme} />
              ) : (
                <LineChart data={getChartData()} isCurrency={chartToggle === "revenue"} theme={theme} />
              )
            ) : (
              <p className="flex h-[350px] items-center justify-center text-gray-500">
                No data yet
              </p>
            )}
          </Motion.div>

          {/* Format Distribution - 1/3 Width */}
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className={panelClassName}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Format Revenue</h2>
              <p className="text-sm text-gray-500 mt-1">Earnings across screen types</p>
            </div>
            {formatStatsData.length > 0 ? (
              <MovieDistributionChart data={formatStatsData} theme={theme} />
            ) : (
              <p className="flex h-[300px] items-center justify-center text-gray-500">
                No data yet
              </p>
            )}
          </Motion.div>
        </Motion.div>

        <Motion.div
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
                      className="table-row-premium border-b border-gray-800/50 last:border-0"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-gray-300">{booking.bookingId}</td>
                      <td className="px-4 py-4 text-sm text-white font-medium">{booking.user?.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-300">{booking.movie?.title}</td>
                      <td className="px-4 py-4 text-sm text-gray-300">{booking.seats?.length}</td>
                      <td className="px-4 py-4 text-sm font-bold money-value text-white">
                        {currencySymbol}
                        {booking.totalAmount?.toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${
                            booking.status === "confirmed"
                              ? "bg-green-500/10 text-green-500 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                              : booking.status === "cancelled"
                                ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                                : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]"
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
        </Motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
