import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from 'xlsx';
import {
  Download,
  TrendingUp,
  DollarSign,
  Ticket,
  Calendar,
} from "lucide-react";
import Button from "../../components/UI/Button";
import Loader from "../../components/UI/Loader";
import { apiRequest } from "../../services/api";
import { API_ENDPOINTS } from "../../utils/constants";
import { formatDate } from "../../utils/formatDate";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: true,
    total: 0,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async (resetPage = true) => {
    try {
      if (resetPage) {
        setLoading(true);
        setTransactions([]); // clear on new date filter
      } else {
        setLoadingMore(true);
      }

      const currentPage = resetPage ? 1 : pagination.page + 1;

      const response = await apiRequest.get(API_ENDPOINTS.ADMIN_REPORTS, {
        params: { ...dateRange, page: currentPage, limit: 10 },
      });

      if (response.success) {
        setReportData(response.report);

        if (resetPage) {
          setTransactions(response.report.recentTransactions); // fresh load
        } else {
          setTransactions((prev) => [
            ...prev,
            ...response.report.recentTransactions,
          ]); // append
        }

        setPagination({
          page: currentPage,
          hasMore: response.report.pagination.hasMore,
          total: response.report.pagination.total,
        });
      }
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more handler
  const handleLoadMore = () => {
    fetchReports(false); // false = don't reset, just load next page
  };

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value,
    });
  };

  const handleDownloadCSV = () => {
  if (!reportData) return toast.error("No data to download");

  const wb = XLSX.utils.book_new();

  // ─── SHEET 1: SUMMARY ───────────────────────────────────────
  const summaryData = [
    ["ShowTimeX - Sales Report"],
    [`Period: ${dateRange.startDate}  to  ${dateRange.endDate}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ["Metric", "Value", "Change vs Previous Period"],
    ["Total Revenue", `Rs.${Math.round(reportData.totalRevenue || 0).toLocaleString()}`, `${reportData.changes?.revenue || 0}%`],
    ["Total Bookings", reportData.totalBookings || 0, `${reportData.changes?.bookings || 0}%`],
    ["Total Tickets", reportData.totalTickets || 0, `${reportData.changes?.tickets || 0}%`],
    ["Avg Booking Value", `Rs.${Math.round(reportData.avgBookingValue || 0).toLocaleString()}`, `${reportData.changes?.avgValue || 0}%`],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // ─── SHEET 2: TOP MOVIES ────────────────────────────────────
  const moviesData = [
    ["Top Performing Movies"],
    [`Period: ${dateRange.startDate}  to  ${dateRange.endDate}`],
    [],
    ["Rank", "Movie", "Bookings", "Tickets Sold", "Revenue"],
    ...(reportData.topMovies || []).map((movie, i) => [
      i + 1,
      movie.title,
      movie.bookings,
      movie.tickets,
      `Rs.${movie.revenue?.toLocaleString()}`,
    ]),
  ];
  const moviesSheet = XLSX.utils.aoa_to_sheet(moviesData);
  moviesSheet['!cols'] = [
    { wch: 6 }, { wch: 35 }, { wch: 12 }, { wch: 14 }, { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, moviesSheet, "Top Movies");

  // ─── SHEET 3: ALL TRANSACTIONS ──────────────────────────────
  const txData = [
    ["All Transactions"],
    [`Period: ${dateRange.startDate}  to  ${dateRange.endDate}`],
    [`Total: ${pagination.total} transactions`],
    [],
    ["Date", "Booking ID", "Customer", "Movie", "Tickets", "Amount", "Status"],
    ...(transactions || []).map((t) => [
      formatDate(t.date),
      t.bookingId,
      t.customer,
      t.movie,
      t.tickets,
      `Rs.${t.amount?.toFixed(2)}`,
      t.status?.toUpperCase(),
    ]),
  ];
  const txSheet = XLSX.utils.aoa_to_sheet(txData);
  txSheet['!cols'] = [
    { wch: 14 }, // Date
    { wch: 20 }, // Booking ID
    { wch: 16 }, // Customer
    { wch: 35 }, // Movie
    { wch: 10 }, // Tickets
    { wch: 14 }, // Amount
    { wch: 12 }, // Status
  ];
  XLSX.utils.book_append_sheet(wb, txSheet, "All Transactions");

  // ─── DOWNLOAD ───────────────────────────────────────────────
  XLSX.writeFile(wb, `ShowTimeX_Report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`);
  toast.success("Excel Downloaded!");
};

  const handleDownloadPDF = () => {
    if (!reportData) return toast.error("No data to download");

    const doc = new jsPDF();
    doc.setFont("helvetica");

    // ✅ Replace ₹ with Rs. throughout PDF (most reliable fix)
    const formatAmount = (amount) => `Rs.${amount}`;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(220, 50, 50);
    doc.text("ShowTimeX", 14, 18);

    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text("Sales Report", 14, 26);

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 14, 33);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

    // Summary Table
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Summary", 14, 48);

    autoTable(doc, {
      startY: 52,
      head: [["Metric", "Value", "Change"]],
      body: [
        [
          "Total Revenue",
          `Rs.${Math.round(reportData.totalRevenue || 0).toLocaleString()}`,
          `${reportData.changes?.revenue || 0}%`,
        ],
        [
          "Total Bookings",
          String(reportData.totalBookings || 0),
          `${reportData.changes?.bookings || 0}%`,
        ],
        [
          "Total Tickets",
          String(reportData.totalTickets || 0),
          `${reportData.changes?.tickets || 0}%`,
        ],
        [
          "Avg Booking Value",
          `Rs.${Math.round(reportData.avgBookingValue || 0).toLocaleString()}`,
          `${reportData.changes?.avgValue || 0}%`,
        ],
      ],
      headStyles: { fillColor: [220, 50, 50], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    // Top Movies Table
    doc.text("Top Performing Movies", 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [["Rank", "Movie", "Bookings", "Tickets", "Revenue"]],
      body: (reportData.topMovies || []).map((movie, i) => [
        i + 1,
        movie.title,
        movie.bookings,
        movie.tickets,
        `Rs.${movie.revenue?.toLocaleString()}`, // ✅ Rs. instead of ₹
      ]),
      headStyles: { fillColor: [220, 50, 50], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    // All Transactions Table
    doc.text("All Transactions", 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [
        [
          "Date",
          "Booking ID",
          "Customer",
          "Movie",
          "Tickets",
          "Amount",
          "Status",
        ],
      ],
      body: (transactions || []).map((t) => [
        formatDate(t.date),
        t.bookingId,
        t.customer,
        t.movie,
        t.tickets,
        `Rs.${t.amount?.toFixed(2)}`, // ✅ Rs. instead of ₹
        t.status,
      ]),
      headStyles: { fillColor: [220, 50, 50], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      styles: { fontSize: 7 },
      columnStyles: { 1: { cellWidth: 28 } },
    });

    doc.save(
      `ShowTimeX_Report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`,
    );
    toast.success("✅ PDF Downloaded!");
  };

  if (loading) {
    return <Loader fullScreen message="Loading reports..." />;
  }

  // Helper to format the change string (adds a '+' if positive)
  const formatChange = (val) => `${val > 0 ? "+" : ""}${val || 0}%`;

  const summaryCards = [
    {
      title: "Total Revenue",
      value: `₹${Math.round(reportData?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500",
      // 🟢 DYNAMIC: Read the revenue change from the backend
      change: formatChange(reportData?.changes?.revenue),
      isPositive: (reportData?.changes?.revenue || 0) >= 0,
    },
    {
      title: "Total Bookings",
      value: reportData?.totalBookings?.toLocaleString() || "0",
      icon: Ticket,
      color: "bg-blue-500",
      // 🟢 DYNAMIC: Read the bookings change from the backend
      change: formatChange(reportData?.changes?.bookings),
      isPositive: (reportData?.changes?.bookings || 0) >= 0,
    },
    {
      title: "Total Tickets",
      value: reportData?.totalTickets?.toLocaleString() || "0",
      icon: TrendingUp,
      color: "bg-purple-500",
      // 🟢 DYNAMIC: Read the tickets change from the backend
      change: formatChange(reportData?.changes?.tickets),
      isPositive: (reportData?.changes?.tickets || 0) >= 0,
    },
    {
      title: "Avg. Booking Value",
      value: `₹${Math.round(reportData?.avgBookingValue || 0).toLocaleString()}`,
      icon: Calendar,
      color: "bg-primary",
      // 🟢 DYNAMIC: Read the average value change from the backend
      change: formatChange(reportData?.changes?.avgValue),
      isPositive: (reportData?.changes?.avgValue || 0) >= 0,
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Sales Reports
            </h1>
            <p className="text-gray-400">
              View detailed analytics and revenue reports
            </p>
          </div>
          {/* Replace the single Button with these two */}
          <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:mt-0">
            <Button
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleDownloadCSV}
            >
              CSV
            </Button>
            <Button
              variant="primary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleDownloadPDF}
            >
              PDF
            </Button>
          </div>
        </motion.div>

        {/* Date Range Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-card rounded-xl p-4 sm:p-6 mb-8"
        >
          <h3 className="text-lg font-bold text-white mb-4">Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="bg-dark-card rounded-xl p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-green-500 text-sm font-semibold">
                    {card.change}
                  </span>
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
          className="bg-dark-card rounded-xl p-4 sm:p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-6">
            Top Performing Movies
          </h2>
          {reportData?.topMovies && reportData.topMovies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                      Rank
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                      Movie
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                      Bookings
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                      Tickets Sold
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topMovies.map((movie, index) => (
                    <tr
                      key={index}
                      className="admin-table-row border-b border-gray-800"
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            index === 0
                              ? "bg-yellow-500 text-white"
                              : index === 1
                                ? "bg-gray-400 text-white"
                                : index === 2
                                  ? "bg-orange-600 text-white"
                                  : "bg-dark-lighter text-gray-400"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">
                        {movie.title}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {movie.bookings}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {movie.tickets}
                      </td>
                      <td className="py-3 px-4 money-value font-bold">
                        ₹{movie.revenue?.toLocaleString()}
                      </td>
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
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-dark-card rounded-xl p-4 sm:p-6"
        >
          {/* Header with count */}
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-white">
              Recent Transactions
            </h2>
            <span className="text-gray-400 text-sm">
              Showing {transactions.length} of {pagination.total}
            </span>
          </div>

          {transactions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead className="border-b border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                        Booking ID
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                        Movie
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                        Tickets
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ✅ Now uses local transactions state */}
                    {transactions.map((transaction, index) => (
                      <tr
                        key={index}
                        className="admin-table-row border-b border-gray-800"
                      >
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="py-3 px-4 text-white text-sm">
                          {transaction.bookingId}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {transaction.customer}
                        </td>
                        <td className="py-3 px-4 text-white text-sm">
                          {transaction.movie}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {transaction.tickets}
                        </td>
                        <td className="py-3 px-4 money-value font-semibold text-sm">
                          ₹{transaction.amount?.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              transaction.status === "confirmed"
                                ? "bg-green-500/20 text-green-500"
                                : transaction.status === "cancelled"
                                  ? "bg-red-500/20 text-red-500"
                                  : "bg-yellow-500/20 text-yellow-500"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ✅ Load More Button */}
              {pagination.hasMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full sm:w-auto rounded-lg bg-dark-lighter px-6 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 border-2 border-white/30 border-t-white 
                                 rounded-full animate-spin"
                        />
                        Loading...
                      </span>
                    ) : (
                      `Load More (${pagination.total - transactions.length} remaining)`
                    )}
                  </button>
                </div>
              )}

              {/* All loaded message */}
              {!pagination.hasMore && transactions.length > 10 && (
                <p className="text-center text-gray-500 text-sm mt-4">
                  ✅ All {pagination.total} transactions loaded
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No transactions found
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;
