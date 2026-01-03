import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChatContext } from "../context/ChatContext";
import { NotificationContext } from "../context/NotificationContext";
import api from "../utils/api";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notifications, unreadCount: notificationUnreadCount } =
    useContext(NotificationContext);
  const { conversations, unreadCount: messageUnreadCount } =
    useContext(ChatContext);
  const [rewardPoints, setRewardPoints] = useState(0);

  useEffect(() => {
    // Check if user is logged in from localStorage or sessionStorage
    const checkAuth = () => {
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error("Error parsing user data:", err);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();

    // Listen for storage changes (for multi-tab sync)
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  // Fetch user's reward points
  useEffect(() => {
    const fetchRewardPoints = async () => {
      if (user && user.role === "renter") {
        try {
          const response = await api.get("/user/profile");
          setRewardPoints(response.data?.user?.rewardPoints || 0);
        } catch (err) {
          console.error("Failed to fetch reward points:", err);
        }
      }
    };
    fetchRewardPoints();
  }, [user]);

  // Use context unread counts (they track properly now)
  const unreadNotifications =
    notificationUnreadCount || notifications.filter((n) => !n.read).length;
  const unreadMessages =
    messageUnreadCount || conversations.filter((c) => c.isUnread).length;

  const handleLogout = () => {
    setShowLogoutModal(true);
    setIsUserMenuOpen(false);
  };

  const confirmLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken"); // Clear refresh token
    sessionStorage.removeItem("user");
    setUser(null);
    setShowLogoutModal(false);
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const getDashboardRoute = () => {
    if (!user) return "/user-dashboard";
    switch (user.role) {
      case "admin":
        return "/admin-dashboard";
      case "owner":
        return "/owner-dashboard";
      case "renter":
      default:
        return "/user-dashboard";
    }
  };

  const profileOptions = [
    {
      label: "Dashboard",
      route: getDashboardRoute(),
      roles: ["renter", "owner", "admin"],
    },
    {
      label: "My Profile",
      route: "/profile",
      roles: ["renter", "owner", "admin"],
    },
    {
      label: "Logout",
      action: handleLogout,
      roles: ["renter", "owner", "admin"],
    },
  ];

  const filteredOptions = user
    ? profileOptions.filter((opt) => opt.roles.includes(user.role))
    : [];

  if (loading) {
    return (
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 002 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Wheels Rent</span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 002 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Wheels Rent
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                to="/vehicles"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Browse Vehicles
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                About
              </Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {/* Reward Points Badge (for renters) */}
                  {user.role === "renter" && (
                    <Link
                      to="/rewards"
                      className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold hover:from-yellow-500 hover:to-orange-600 transition-all shadow-sm"
                      title="Your Reward Points"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {rewardPoints}
                    </Link>
                  )}

                  {/* Messages */}
                  <Link
                    to="/messages"
                    className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
                    title="Messages"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 animate-pulse">
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    )}
                  </Link>

                  {/* Notifications */}
                  <Link
                    to="/notifications"
                    className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
                    title="Notifications"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                    </svg>
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 animate-pulse">
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </span>
                    )}
                  </Link>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.fullname
                          ? user.fullname.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <span className="hidden sm:inline text-sm font-semibold text-gray-900 max-w-[100px] truncate">
                        {user.fullname || user.username || "User"}
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="font-semibold text-gray-900">
                            {user.fullname || user.username}
                          </p>
                          <p className="text-sm text-gray-600">
                            @{user.username}
                          </p>
                        </div>
                        <Link
                          to={getDashboardRoute()}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          to={`/profile/${user.username}`}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          View Profile
                        </Link>
                        {user.role === "owner" && (
                          <Link
                            to="/my-vehicles"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            My Vehicles
                          </Link>
                        )}
                        {user.role === "renter" && (
                          <Link
                            to="/bookings"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            My Bookings
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 font-semibold transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                  ) : (
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col gap-2">
                <Link
                  to="/"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/vehicles"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Browse Vehicles
                </Link>
                <Link
                  to="/about"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            <div className="p-6">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Logout Confirmation
              </h2>

              {/* Message */}
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to logout? You will need to sign in again
                to access your account.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
				@keyframes scale-in {
					from {
						transform: scale(0.9);
						opacity: 0;
					}
					to {
						transform: scale(1);
						opacity: 1;
					}
				}
				.animate-scale-in {
					animation: scale-in 0.2s ease-out;
				}
			`}</style>
    </>
  );
};

export default Header;
