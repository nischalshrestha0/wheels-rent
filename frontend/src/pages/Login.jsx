import React, { useState } from "react";
import api from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNotification } from "../hooks/useNotification";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { email, password } = formData;
      const response = await api.post("/user/login", { email, password });

      const backendUser = response.data.user || response.data;
      const userData = {
        id: backendUser.id || backendUser._id,
        _id: backendUser._id || backendUser.id,
        username: backendUser.username,
        fullname: backendUser.fullname,
        email: backendUser.email,
        phone: backendUser.phone,
        role: backendUser.role,
      };

      console.log("  Login successful, user role:", userData.role);

      localStorage.setItem("user", JSON.stringify(userData));

      // Store both access and refresh tokens
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        console.log("✓ Access token stored");
      }

      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
        console.log("✓ Refresh token stored");
      }

      addNotification("Login successful! Redirecting...", "success");

      // Role-based redirect with proper checks
      const userRole = userData.role.toLowerCase();

      if (userRole === "admin") {
        console.log(" Redirecting admin to /admin-dashboard");
        setTimeout(() => navigate("/admin-dashboard"), 1500);
      } else if (userRole === "owner") {
        console.log(" Redirecting owner to /owner-dashboard");
        setTimeout(() => navigate("/owner-dashboard"), 1500);
      } else if (userRole === "renter") {
        console.log(" Redirecting renter to /user-dashboard");
        setTimeout(() => navigate("/user-dashboard"), 1500);
      } else {
        console.log(" Unknown role, redirecting to home");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Backend unreachable. Make sure Express is running on http://localhost:5000"
          : "Login failed. Please try again.");
      setError(errorMsg);
      addNotification(errorMsg, "error");
      console.error("  Login error:", err);
      // Log backend response body if present for debugging 500s
      console.error("  Backend response data:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-xl px-6 py-4">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
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
            </div>

            <h1 className="text-xl font-bold text-center text-gray-900 mb-1">
              Welcome Back
            </h1>
            <p className="text-center text-gray-600 text-xs mb-3">
              Sign in to your Wheels Rent account
            </p>

            {error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-xs text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Password
                </label>
                {/* <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                /> */}

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Create a strong password"
                    className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      // Eye-off icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
                        <path d="M9.88 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a18.16 18.16 0 0 1-2.2 3.2" />
                        <path d="M6.1 6.1C3.2 8.2 2 12 2 12s3.5 7 10 7c1.3 0 2.5-.2 3.6-.6" />
                        <path d="M2 2l20 20" />
                      </svg>
                    ) : (
                      // Eye icon
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-white text-sm transition-all duration-200 mt-3 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-gray-800 active:scale-[0.98]"
                }`}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-700">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Login;
