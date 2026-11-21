import React from "react";
import companyLogo from "@/assets/gpk-logo.svg";
import { Link, useLocation } from "react-router-dom";
import { User, LogIn, LogOut, PhoneCall, Sparkles, ArrowRight } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";

interface UserHeaderProps {
  isHidden?: boolean;
}

const UserHeader: React.FC<UserHeaderProps> = ({ isHidden = false }) => {
  const { settings } = useSiteSettings();
  const { isUserLoggedIn, userPhone, userName, openLoginModal, logoutUser } = useAuth();
  const location = useLocation();

  const isChitSchemePage = location.pathname === "/chit-scheme";
  const contactPhone = settings?.chitConfig?.whatsappNumber || settings?.contact?.phone || settings?.billing?.whatsapp || "9488073004";
  const cleanPhone = contactPhone.replace(/\D/g, "").slice(-10);
  const whatsappMsg = encodeURIComponent(settings?.chitConfig?.whatsappMessage || "Hello GPK Crackers, I have an enquiry regarding Diwali Chit Scheme");

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 transition-transform duration-300 w-full shadow-2xs ${
          isHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 md:h-[72px] flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Identity */}
          <Link to="/chit-scheme" className="flex items-center gap-2 sm:gap-3 shrink-0 group min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-[#F4F9EA] to-white border border-[#A1CB35]/40 flex items-center justify-center p-1 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <img
                src={companyLogo}
                alt="GPK Crackers"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-base sm:text-lg md:text-xl tracking-tight text-gray-950 group-hover:text-[#35520D] transition-colors leading-none truncate">
                  GPK <span className="text-[#35520D]">CRACKERS</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 bg-[#F4F9EA] text-[#2D4505] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#A1CB35]/40">
                  Diwali 2026
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-0.5 truncate max-w-[120px] sm:max-w-none">
                Chit Savings • Sivakasi
              </span>
            </div>
          </Link>

          {/* Right: Only Support, Login, and Chit Scheme */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick Contact / Support */}
            {cleanPhone && (
              <a
                href={`https://wa.me/91${cleanPhone}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-gray-200 hover:border-[#A1CB35] text-gray-700 hover:text-[#35520D] text-xs font-bold transition-all bg-white shadow-2xs hover:shadow-xs"
                title="Contact Customer Support"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#35520D]" />
                <span className="hidden sm:inline">Support</span>
              </a>
            )}

            {/* Customer Account Pill or Login Button */}
            {isUserLoggedIn ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F4F9EA] border border-[#A1CB35]/50 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-gray-900 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-[#A1CB35] text-gray-950 flex items-center justify-center font-black text-[11px] shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left max-w-[75px] sm:max-w-[160px]">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none hidden sm:inline">
                    Customer
                  </span>
                  <span className="font-black leading-tight text-[#2D4505] truncate text-[11px] sm:text-xs">
                    {userName && userName !== "Customer" ? userName : (userPhone ? `+91 ${userPhone}` : "Account")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logoutUser}
                  title="Logout"
                  className="text-gray-400 hover:text-rose-600 transition-colors ml-0.5 sm:ml-1 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="bg-white hover:bg-[#F4F9EA] text-[#35520D] border border-[#A1CB35] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <LogIn className="w-4 h-4 text-[#35520D]" />
                <span>Login</span>
              </button>
            )}

            {/* Chit Scheme */}
            {!isChitSchemePage ? (
              <Link
                to="/chit-scheme"
                className="bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 uppercase tracking-wider"
              >
                <span>Chit Scheme</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-[#A1CB35] text-gray-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-2xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chit Scheme</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Clean Layout Spacer */}
      <div className="w-full shrink-0 h-16 md:h-[72px]" />
    </>
  );
};

export default UserHeader;
