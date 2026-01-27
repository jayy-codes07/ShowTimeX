import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, TrendingUp, DollarSign, Ticket, Calendar } from 'lucide-react';
import Button from '../../components/UI/Button';
import Loader from '../../components/UI/Loader';
import { apiRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await apiRequest.get(API_ENDPOINTS.ADMIN_REPORTS, {
        params: dateRange,
      });

      if (response.success) {
        setReportData(response.report);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value,
    });
  };

  const handleDownloadReport = () => {
    toast.success('Report download started');
    // Implement CSV or PDF download
  };

  if (loading) {
    return <Loader fullScreen message="Loading reports..." />;
  }

  const summaryCards = [
    {
      title: 'Total Revenue',
      value: `₹${reportData?.totalRevenue?.toLocaleString() || '0'}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+15.3%',
    },
    {
      title: 'Total Bookings',
      value: reportData?.totalBookings?.toLocaleString() || '0',
      icon: Ticket,
      color: 'bg-blue-500',
      change: '+8.7%',
    },
    {
      title: 'Total Tickets',
      value: reportData?.totalTickets?.toLocaleString() || '0',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+12.1%',
    },
    {
      title: 'Avg. Booking Value',
      value: `₹${reportData?.avgBookingValue?.toFixed(2) || '0'}`,
      icon: Calendar,
      color: 'bg-primary',
      change: '+6.4%',
    },
  ];

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Sales Reports</h1>
            <p className="text-gray-400">View detailed analytics and revenue reports</p>
          </div>
          <Button
            variant="primary"
            icon={<Download className="w-5 h-5" />}
            onClick={handleDownloadReport}
            className="mt-4 md:mt-0"
          >
            Download Report
          </Button>
        </motion.div>

        {/* Date Range Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-card rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-bold text-white mb-4">Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="input-field"
              />
            </div>
            <Button variant="primary" onClick={fetchReports}>
              Apply Filter
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="bg-dark-card rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-green-500 text-sm font-semibold">{card.change}</span>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">{card.title}</h3>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Top Movies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-dark-card rounded-xl p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-6">Top Performing Movies</h2>
          {reportData?.topMovies && reportData.topMovies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Rank</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Movie</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Bookings</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Tickets Sold</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topMovies.map((movie, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-dark-lighter transition">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-dark-lighter text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">{movie.title}</td>
                      <td className="py-3 px-4 text-gray-300">{movie.bookings}</td>
                      <td className="py-3 px-4 text-gray-300">{movie.tickets}</td>
                      <td className="py-3 px-4 text-primary font-bold">₹{movie.revenue?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No data available</p>
          )}
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-dark-card rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6">Recent Transactions</h2>
          {reportData?.recentTransactions && reportData.recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Booking ID</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Customer</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Movie</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Tickets</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.recentTransactions.map((transaction, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-dark-lighter transition">
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="py-3 px-4 text-white text-sm">{transaction.bookingId}</td>
                      <td className="py-3 px-4 text-gray-300 text-sm">{transaction.customer}</td>
                      <td className="py-3 px-4 text-white text-sm">{transaction.movie}</td>
                      <td className="py-3 px-4 text-gray-300 text-sm">{transaction.tickets}</td>
                      <td className="py-3 px-4 text-primary font-semibold text-sm">
                        ₹{transaction.amount?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          transaction.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                          transaction.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No transactions found</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;