import React, { useCallback, useEffect, useState } from "react";
import { Users, UserPlus, ArrowUpRight, CalendarClock } from "lucide-react";
import Button from "../../components/UI/Button";
import Loader from "../../components/UI/Loader";
import { apiRequest } from "../../services/api";
import { API_ENDPOINTS } from "../../utils/constants";
import toast from "react-hot-toast";

const UsersPage = () => {
  const [insights, setInsights] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: false,
    total: 0,
  });

  const fetchUsers = useCallback(async (resetPage = true, pageToLoad = 1) => {
    const currentPage = resetPage ? 1 : pageToLoad;

    try {
      if (resetPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await apiRequest.get(API_ENDPOINTS.ADMIN_USERS, {
        params: { page: currentPage, limit: 10 },
      });

      if (response.success) {
        setInsights(response.insights || null);

        if (resetPage) {
          setUsers(response.users || []);
        } else {
          setUsers((prev) => [...prev, ...(response.users || [])]);
        }

        setPagination({
          page: response.pagination?.page || currentPage,
          hasMore: Boolean(response.pagination?.hasMore),
          total: response.pagination?.total || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load user insights");
    } finally {
      if (resetPage) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchUsers(true, 1);
  }, [fetchUsers]);

  const handleLoadMore = () => {
    if (!loadingMore && pagination.hasMore) {
      fetchUsers(false, pagination.page + 1);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <Loader fullScreen message="Loading user insights..." />;
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">User Insights</h1>
          <p className="text-gray-400">Track total users, logins, and recent user activity.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-800 bg-dark-card p-5">
            <div className="mb-2 flex items-center gap-2 text-gray-400 text-sm">
              <Users className="w-4 h-4" /> Total Customers
            </div>
            <p className="text-3xl font-bold text-white">{insights?.totalUsers || 0}</p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-dark-card p-5">
            <div className="mb-2 flex items-center gap-2 text-gray-400 text-sm">
              <CalendarClock className="w-4 h-4" /> Logged In Today
            </div>
            <p className="text-3xl font-bold text-white">{insights?.loggedInToday || 0}</p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-dark-card p-5">
            <div className="mb-2 flex items-center gap-2 text-gray-400 text-sm">
              <UserPlus className="w-4 h-4" /> New Users (7d)
            </div>
            <p className="text-3xl font-bold text-white">{insights?.newUsersLast7Days || 0}</p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-dark-card p-5">
            <div className="mb-2 flex items-center gap-2 text-gray-400 text-sm">
              <ArrowUpRight className="w-4 h-4" /> Ever Logged In
            </div>
            <p className="text-3xl font-bold text-white">{insights?.totalLoggedInUsers || 0}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-dark-card p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Recent User Activity</h2>
            <p className="text-sm text-gray-400">{pagination.total} total customers</p>
          </div>

          {users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Joined</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className="table-row-premium border-b border-gray-800/50 last:border-0"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-white">{user.name}</td>
                        <td className="px-4 py-4 text-sm text-gray-300">{user.email}</td>
                        <td className="px-4 py-4 text-sm text-gray-300">{user.phone || "-"}</td>
                        <td className="px-4 py-4 text-sm text-gray-300">{formatDateTime(user.createdAt)}</td>
                        <td className="px-4 py-4 text-sm text-gray-300">{formatDateTime(user.lastLoginAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.hasMore && (
                <div className="mt-6 flex justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleLoadMore}
                    loading={loadingMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-gray-400">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
