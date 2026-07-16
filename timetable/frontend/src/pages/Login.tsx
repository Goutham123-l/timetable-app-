import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@college.edu");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="https://res.cloudinary.com/n45xawtg/image/upload/v1784209550/TimelyCampus_logo_jaa6jq.jpg"
            alt="Timely Campus Logo"
            className="w-56 h-auto object-contain mb-3"
          />

          <p className="text-slate-500 text-sm">
            Sign in to continue
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Email */}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        {/* Password */}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 rounded-lg transition duration-200 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        {/* Demo Accounts */}
        <div className="mt-6 text-xs text-slate-500 bg-slate-50 p-4 rounded-lg leading-relaxed border border-slate-200">
          <strong className="block mb-2">Demo Accounts</strong>

          <div>
            <strong>Password:</strong> password123
          </div>

          <div className="mt-2">
            <strong>Admin:</strong> admin@college.edu
          </div>

          <div>
            <strong>Teacher:</strong> kumar@college.edu
          </div>

          <div>
            <strong>Student:</strong> student@college.edu
          </div>
        </div>
      </form>
    </div>
  );
}
