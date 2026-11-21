import React from "react";
import companyLogo from "@/assets/gpk-logo.svg";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  Facebook,
  Instagram,
  Youtube,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  Gift,
  Clock,
  MessageCircle,
} from "lucide-react";

const UserFooter: React.FC = () => {
  const { settings } = useSiteSettings();

  const contactPhone = settings?.chitConfig?.whatsappNumber || settings?.contact?.phone || settings?.billing?.whatsapp || "9488073004";
  const cleanPhone = contactPhone.replace(/\D/g, "").slice(-10);
  const rawMsg = settings?.chitConfig?.whatsappMessage || "Hello GPK Crackers, I have an enquiry regarding Diwali Chit Scheme";
  const whatsappMsg = encodeURIComponent(rawMsg);

  const socialLinks = [
    {
      name: "Facebook",
      icon: <Facebook className="w-4 h-4" />,
      url: settings?.socialLinks?.facebook,
    },
    {
      name: "Instagram",
      icon: <Instagram className="w-4 h-4" />,
      url: settings?.socialLinks?.instagram,
    },
    {
      name: "YouTube",
      icon: <Youtube className="w-4 h-4" />,
      url: settings?.socialLinks?.youtube,
    },
  ];

  return (
    <footer className="mt-auto bg-white border-t border-gray-200/80 font-sans text-gray-800">
      {/* Top Value Strip */}
      <div className="bg-[#F8FAF2] border-b border-[#A1CB35]/25 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#A1CB35]/40 flex items-center justify-center text-[#35520D] shadow-2xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-black text-gray-950">10-Month Fixed Savings</h5>
              <p className="text-[11px] text-gray-500 font-medium">Predictable, stress-free monthly installments</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#A1CB35]/40 flex items-center justify-center text-[#35520D] shadow-2xs shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-black text-gray-950">Guaranteed Bonus Fireworks</h5>
              <p className="text-[11px] text-gray-500 font-medium">Exclusive Diwali cracker gift hampers included</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#A1CB35]/40 flex items-center justify-center text-[#35520D] shadow-2xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-black text-gray-950">Direct Factory Sivakasi</h5>
              <p className="text-[11px] text-gray-500 font-medium">Licensed &amp; 100% verified factory supply</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content: Balanced 3-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Column 1: Brand & Bio (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/chit-scheme" className="flex items-center gap-3 group w-max">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F4F9EA] to-white border border-[#A1CB35]/50 flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                <img src={companyLogo} alt="GPK Crackers" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-gray-950 group-hover:text-[#35520D] transition-colors leading-none">
                  GPK <span className="text-[#35520D]">CRACKERS</span>
                </span>
                <span className="text-[10px] font-extrabold text-[#35520D] uppercase tracking-widest mt-1">
                  Diwali 2027 Chit Scheme • Sivakasi
                </span>
              </div>
            </Link>

            <p className="text-xs text-gray-600 leading-relaxed font-medium max-w-sm">
              {settings?.siteDescription ||
                "Sivakasi's trusted fireworks monthly chit savings portal. Plan ahead for a memorable Diwali with guaranteed cracker bundles, zero hidden fees, and transparent online passbooks."}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((item) => {
                const url = item.url && item.url.trim().length > 0 ? item.url : null;
                if (!url) return null;
                return (
                  <a
                    key={item.name}
                    href={url.startsWith("http") ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.name}
                    className="w-9 h-9 rounded-xl bg-white border border-gray-200 hover:border-[#A1CB35] hover:bg-[#F4F9EA] text-gray-700 hover:text-[#35520D] flex items-center justify-center transition-all shadow-2xs hover:shadow-xs"
                  >
                    {item.icon}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Chit Scheme Features & Highlights (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#35520D]" />
              <span>Chit Scheme</span>
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 font-medium">
              <li>
                <Link
                  to="/chit-scheme"
                  className="hover:text-[#35520D] font-bold text-gray-900 transition-colors inline-flex items-center gap-1"
                >
                  <span>→ Available Chit Schemes</span>
                </Link>
              </li>
              <li className="flex items-center gap-1.5 text-gray-500">
                <Clock className="w-3.5 h-3.5 text-[#35520D] shrink-0" />
                <span>10-Month Installments</span>
              </li>
              <li className="flex items-center gap-1.5 text-gray-500">
                <Gift className="w-3.5 h-3.5 text-[#35520D] shrink-0" />
                <span>Bonus Gift Hampers</span>
              </li>
              <li className="flex items-center gap-1.5 text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5 text-[#35520D] shrink-0" />
                <span>Verified WhatsApp Login</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Factory Address & Direct Support (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-950 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#35520D]" />
              <span>Factory &amp; Support</span>
            </h4>

            <div className="space-y-2.5 text-xs text-gray-600 font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#35520D] shrink-0 mt-0.5" />
                <span>
                  {settings?.contact?.address ||
                    "GPK Crackers, Sivakasi Main Road, Sivakasi - 626123, Virudhunagar Dist., Tamil Nadu."}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#35520D] shrink-0" />
                <span>
                  GST Registration: <strong className="text-gray-900 font-bold">33CAFPR4172K1ZG</strong>
                </span>
              </div>

              {cleanPhone && (
                <div className="pt-1 flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/91${cleanPhone.slice(-10)}?text=${whatsappMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 font-black px-3.5 py-2 rounded-xl text-xs transition-all shadow-2xs hover:shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp Enquiry</span>
                  </a>

                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-[#A1CB35] text-gray-900 font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-2xs hover:shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#35520D]" />
                    <span>{contactPhone}</span>
                  </a>
                </div>
              )}

              {settings?.contact?.email && (
                <div className="flex items-center gap-2 pt-0.5">
                  <Mail className="w-4 h-4 text-[#35520D] shrink-0" />
                  <a
                    href={`mailto:${settings.contact.email}`}
                    className="hover:text-[#35520D] transition-colors font-medium"
                  >
                    {settings.contact.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-[#111827] text-gray-400 border-t border-gray-800 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-medium text-center sm:text-left">
          <div>
            © 2027 <strong className="text-white font-bold">{settings?.siteName || "GPK Crackers"}</strong>. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-gray-500 text-[10px] uppercase tracking-wider">
            <span>Sivakasi Licensed Manufacturer</span>
            <span>•</span>
            <span className="text-[#A1CB35]">Diwali 2027 Chit Scheme</span>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Help Button (cleanly positioned) */}
      {cleanPhone && (
        <a
          href={`https://wa.me/91${cleanPhone}?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group cursor-pointer"
          title="Chat with GPK Crackers on WhatsApp"
        >
          <MessageCircle className="w-6 h-6 fill-current" />
          <span className="hidden sm:inline max-w-0 overflow-hidden group-hover:max-w-[140px] transition-all duration-300 ease-in-out font-black text-xs uppercase tracking-wider whitespace-nowrap">
            WhatsApp Help
          </span>
        </a>
      )}
    </footer>
  );
};

export default UserFooter;
