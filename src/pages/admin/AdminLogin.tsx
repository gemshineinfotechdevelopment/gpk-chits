import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import companyLogo from "@/assets/gpk-logo.svg";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Mail, Lock, ShieldCheck, Eye, EyeOff, ArrowRight } from "lucide-react";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin } = useAuth();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate("/admin");
    }
  }, [isAuthenticated, isAdmin, navigate]);

  if (isAuthenticated && isAdmin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password.trim());
      toast.success("Admin login successful! Welcome back.");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FBFDF8] via-[#F4F9EA]/60 to-[#EBF5D4]/40 p-4 relative overflow-hidden font-sans">
      {/* Decorative background glow accents */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#A1CB35]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#A1CB35]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-white border-2 border-[#A1CB35]/40 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-10 z-10 backdrop-blur-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F4F9EA] to-white border-2 border-[#A1CB35]/50 flex items-center justify-center p-2 mx-auto shadow-2xs mb-4">
            <img src={companyLogo} alt="GPK Crackers" className="w-full h-full object-contain" />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-[#F4F9EA] text-[#2D4505] text-[10px] font-black px-3 py-1 rounded-full border border-[#A1CB35]/40 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#35520D]" />
            <span>Secure Administration</span>
          </div>

          <h1 className="text-2xl font-black text-gray-950 tracking-tight">
            GPK Admin Portal
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Sign in to manage Chit Schemes, customer applications &amp; passbooks
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                placeholder="admin@gpkcrackers.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full text-xs font-semibold p-3 pl-10 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A1CB35]/25 focus:border-[#A1CB35] outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full text-xs font-semibold p-3 pl-10 pr-10 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A1CB35]/25 focus:border-[#A1CB35] outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 font-black text-xs py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In to Admin</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        {/* Footer / Back link */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
          <Link
            to="/chit-scheme"
            className="text-gray-600 hover:text-[#35520D] transition-colors flex items-center gap-1 font-bold"
          >
            ← Back to Customer Site
          </Link>
          <span className="text-[10px] text-gray-400 font-medium">
            🔒 256-Bit Encrypted
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
