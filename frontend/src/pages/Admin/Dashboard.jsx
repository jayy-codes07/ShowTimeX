import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';



import { 
  DollarSign, 
  Users, 
  Ticket, 
  Film, 
  TrendingUp, 
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Loader from '../../components/UI/Loader';
import { apiRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import toast from 'react-hot-toast';

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
        apiRequest.get(API_ENDPOINTS.ADMIN_BOOKINGS + '?limit=5'),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      if (bookingsRes.success) {
        setRecentBookings(bookingsRes.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading dashboard..." />;
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats?.totalRevenue?.toLocaleString() || '0'}`,
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings?.toLocaleString() || '0',
      change: '+8.2%',
      isPositive: true,
      icon: Ticket,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Users',
      value: stats?.totalUsers?.toLocaleString() || '0',
      change: '+5.7%',
      isPositive: true,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Movies',
      value: stats?.totalMovies?.toLocaleString() || '0',
      change: '+2',
      isPositive: true,
      icon: Film,
      color: 'bg-primary',
    },
  ];

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
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
                className="bg-dark-card rounded-xl p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
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

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-dark-card rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Revenue Overview</h2>
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-700 rounded-lg">
              <p className="text-gray-500">Revenue chart will be displayed here</p>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-dark-card rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/admin/movies"
                className="block p-4 bg-dark-lighter rounded-lg hover:bg-dark hover:border hover:border-primary transition group"
              >
                <div className="flex items-center space-x-3">
                  <Film className="w-5 h-5 text-primary" />
                  <div className="flex-grow">
                    <p className="text-white font-semibold group-hover:text-primary transition">
                      Manage Movies
                    </p>
                    <p className="text-gray-500 text-xs">Add or edit movies</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/admin/shows"
                className="block p-4 bg-dark-lighter rounded-lg hover:bg-dark hover:border hover:border-primary transition group"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div className="flex-grow">
                    <p className="text-white font-semibold group-hover:text-primary transition">
                      Manage Shows
                    </p>
                    <p className="text-gray-500 text-xs">Schedule showtimes</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/admin/reports"
                className="block p-4 bg-dark-lighter rounded-lg hover:bg-dark hover:border hover:border-primary transition group"
              >
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <div className="flex-grow">
                    <p className="text-white font-semibold group-hover:text-primary transition">
                      View Reports
                    </p>
                    <p className="text-gray-500 text-xs">Sales analytics</p>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-dark-card rounded-xl p-6"
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
                      <td className="py-3 px-4 text-primary font-semibold text-sm">
                        ₹{booking.totalAmount?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                          booking.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                          'bg-yellow-500/20 text-yellow-500'
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
      </div>
    </div>
  );
};

export default Dashboard;