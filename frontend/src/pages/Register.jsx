import React, { useState } from "react";
import api from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNotification } from "../hooks/useNotification";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
    phone: "",
    role: "renter",
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
      console.log(" Submitting registration...");

      const response = await api.post("/user", formData);

      console.log(" Registration response:", response.data);

      // Store user data and token in localStorage
      // Backend returns _id, so we need to map it to id
      const backendUser = response.data.user || response.data;
      const userData = {
        id: backendUser.id || backendUser._id, // Use _id if id doesn't exist
        _id: backendUser._id || backendUser.id,
        username:
          backendUser.username ||
          formData.username ||
          formData.email.split("@")[0],
        fullname: backendUser.fullname || formData.fullname,
        email: backendUser.email || formData.email,
        phone: backendUser.phone || formData.phone,
        role: backendUser.role || formData.role,
      };

      console.log("Storing user data:", userData);
      localStorage.setItem("user", JSON.stringify(userData));

      // Store token if returned
      if (response.data.token) {
        console.log(
          "Storing auth token:",
          response.data.token.substring(0, 20) + "..."
        );
        localStorage.setItem("token", response.data.token);
      }

      addNotification(
        "Registration successful! Redirecting to dashboard...",
        "success"
      );

      // Redirect based on role
      const userRole = formData.role.toLowerCase();

      if (userRole === "admin") {
        console.log(" New admin registered, redirecting to admin dashboard");
        setTimeout(() => navigate("/admin-dashboard"), 1500);
      } else if (userRole === "owner") {
        console.log(" New owner registered, redirecting to my vehicles");
        setTimeout(() => navigate("/my-vehicles"), 1500);
      } else {
        console.log(" New renter registered, redirecting to home");
        setTimeout(() => navigate("/user-dashboard"), 1500);
      }
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error response:", err.response?.data);

      let errorMsg = "Registration failed. Please try again.";

      // Handle specific error cases
      if (err.response?.data) {
        const errorData = err.response.data;

        // Validation errors (array of messages)
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMsg = errorData.errors.join("\n");
        }
        // Single detailed message
        else if (errorData.details) {
          errorMsg = errorData.details;
        }
        // Generic message from backend
        else if (errorData.message) {
          errorMsg = errorData.message;
        }

        // Duplicate email/username
        if (err.response.status === 409) {
          const field = errorData.field || "email/username";
          errorMsg = `This ${field} is already registered. Please use a different one or login.`;
        }
      }
      // Network errors
      else if (err.code === "ERR_NETWORK") {
        errorMsg =
          "Cannot connect to server. Make sure the backend is running on http://localhost:5000";
      }

      setError(errorMsg);
      addNotification(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-lg">
          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-xl px-6 py-4">
            {/* Logo/Icon */}
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

            {/* Title */}
            <h1 className="text-xl font-bold text-center text-gray-900 mb-1">
              Create Account
            </h1>
            <p className="text-center text-gray-600 text-xs mb-3">
              Join Wheels Rent and start renting or listing vehicles
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-xs text-center">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullname"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Email */}
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
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+977 98XXXXXXXXX"
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Password
                </label>
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
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Username (Optional) */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Username{" "}
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="username"
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  I want to
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center cursor-pointer group px-1">
                    <input
                      type="radio"
                      name="role"
                      value="renter"
                      checked={formData.role === "renter"}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      Rent vehicles
                    </span>
                  </label>

                  <label className="flex items-center cursor-pointer group px-1">
                    <input
                      type="radio"
                      name="role"
                      value="owner"
                      checked={formData.role === "owner"}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      List my vehicles for rent
                    </span>
                  </label>

                  {/* 
                <label className="flex items-center cursor-pointer group px-1">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    disabled
                  />
                  <span className="ml-3 text-sm font-medium text-gray-400 group-hover:text-blue-600 transition-colors">
                    Administrator (platform management)
                  </span>
                </label>
                */}
                </div>
                {/* 
              <p className="text-xs text-gray-500 mt-2 px-1">
                 <strong>Note:</strong> Admin accounts have full platform access. Only create admin accounts if authorized.
              </p>
              */}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start pt-1 px-1">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />
                <label
                  htmlFor="terms"
                  className="ml-3 text-xs text-gray-700 leading-relaxed"
                >
                  I agree to the{" "}
                  <button
                    type="button"
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-white text-sm transition-all duration-200 mt-3 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-gray-800 active:scale-[0.98] shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-700">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Sign in
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

export default Register;
