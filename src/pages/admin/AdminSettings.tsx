import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { 
  Settings as SettingsIcon,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  QrCode,
  Building2,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  BellRing,
  Sparkles,
  Edit3,
  X,
  Lock,
  Unlock
} from "lucide-react";
import { getSettings, updateSettings, SiteSettings } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { toast } from "sonner";

export const AdminSettings: React.FC = () => {
  const { updateSettings: updateContextSettings } = useSiteSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [siteName, setSiteName] = useState("GPK Crackers");
  const [whatsappNumber, setWhatsappNumber] = useState("9488073004");
  const [whatsappMessage, setWhatsappMessage] = useState("Hello GPK Crackers, I have an enquiry regarding Diwali Chit Scheme");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("admin@gpkcrackers.com");
  const [address, setAddress] = useState("123, Factory Road, Sivakasi, Tamil Nadu - 626123");
  const [gstNumber, setGstNumber] = useState("33CAFPR4172K1ZG");

  // Payment & UPI
  const [upiId, setUpiId] = useState("");
  const [upiPayeeName, setUpiPayeeName] = useState("GPK Crackers");
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [defaultDueDay, setDefaultDueDay] = useState(10);

  // Enrollment & Announcements
  const [announcementNotice, setAnnouncementNotice] = useState("");
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(true);

  // Snapshot for cancelling edits
  const [snapshot, setSnapshot] = useState<any>(null);

  const applyDataToState = (data: any) => {
    let sName = "GPK Crackers";
    let sEmail = "admin@gpkcrackers.com";
    let sPhone2 = "";
    let sAddress = "123, Factory Road, Sivakasi, Tamil Nadu - 626123";
    let sGst = "33CAFPR4172K1ZG";
    let sWp = "9488073004";
    let sWpMsg = "Hello GPK Crackers, I have an enquiry regarding Diwali Chit Scheme";
    let sUpi = "";
    let sUpiPayee = "GPK Crackers";
    let sBankName = "";
    let sBankAcc = "";
    let sBankIfsc = "";
    let sDueDay = 10;
    let sNotice = "";
    let sEnrollOpen = true;

    if (data) {
      if (data.siteName) sName = data.siteName;
      if (data.contact?.email) sEmail = data.contact.email;
      if (data.contact?.phone2) sPhone2 = data.contact.phone2;
      if (data.contact?.address) sAddress = data.contact.address;
      if (data.billing?.gstNumber) sGst = data.billing.gstNumber;

      const cfg = data.chitConfig || {};
      const primaryWp = cfg.whatsappNumber || data.contact?.phone || data.billing?.whatsapp || "9488073004";
      sWp = primaryWp.replace(/\D/g, "").slice(-10);

      if (cfg.whatsappMessage) sWpMsg = cfg.whatsappMessage;
      if (cfg.upiId !== undefined) sUpi = cfg.upiId;
      if (cfg.upiPayeeName) sUpiPayee = cfg.upiPayeeName;
      if (cfg.bankName !== undefined) sBankName = cfg.bankName;
      if (cfg.bankAccountNo !== undefined) sBankAcc = cfg.bankAccountNo;
      if (cfg.bankIfsc !== undefined) sBankIfsc = cfg.bankIfsc;
      if (cfg.defaultDueDay !== undefined) sDueDay = cfg.defaultDueDay;
      if (cfg.announcementNotice !== undefined) sNotice = cfg.announcementNotice;
      if (cfg.isEnrollmentOpen !== undefined) sEnrollOpen = cfg.isEnrollmentOpen;
    }

    setSiteName(sName);
    setEmail(sEmail);
    setPhone2(sPhone2);
    setAddress(sAddress);
    setGstNumber(sGst);
    setWhatsappNumber(sWp);
    setWhatsappMessage(sWpMsg);
    setUpiId(sUpi);
    setUpiPayeeName(sUpiPayee);
    setBankName(sBankName);
    setBankAccountNo(sBankAcc);
    setBankIfsc(sBankIfsc);
    setDefaultDueDay(sDueDay);
    setAnnouncementNotice(sNotice);
    setIsEnrollmentOpen(sEnrollOpen);

    setSnapshot({
      siteName: sName,
      email: sEmail,
      phone2: sPhone2,
      address: sAddress,
      gstNumber: sGst,
      whatsappNumber: sWp,
      whatsappMessage: sWpMsg,
      upiId: sUpi,
      upiPayeeName: sUpiPayee,
      bankName: sBankName,
      bankAccountNo: sBankAcc,
      bankIfsc: sBankIfsc,
      defaultDueDay: sDueDay,
      announcementNotice: sNotice,
      isEnrollmentOpen: sEnrollOpen,
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data: any = await getSettings();
      applyDataToState(data);
    } catch (err: any) {
      console.error("Failed to load settings:", err);
      toast.error("Failed to load settings from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = () => {
    if (snapshot) {
      setSiteName(snapshot.siteName);
      setEmail(snapshot.email);
      setPhone2(snapshot.phone2);
      setAddress(snapshot.address);
      setGstNumber(snapshot.gstNumber);
      setWhatsappNumber(snapshot.whatsappNumber);
      setWhatsappMessage(snapshot.whatsappMessage);
      setUpiId(snapshot.upiId);
      setUpiPayeeName(snapshot.upiPayeeName);
      setBankName(snapshot.bankName);
      setBankAccountNo(snapshot.bankAccountNo);
      setBankIfsc(snapshot.bankIfsc);
      setDefaultDueDay(snapshot.defaultDueDay);
      setAnnouncementNotice(snapshot.announcementNotice);
      setIsEnrollmentOpen(snapshot.isEnrollmentOpen);
    }
    setIsEditing(false);
    toast.info("Edits cancelled. Returned to view mode.");
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    const cleanWp = whatsappNumber.replace(/\D/g, "").slice(-10);
    if (!cleanWp || cleanWp.length !== 10) {
      toast.error("Please enter a valid 10-digit WhatsApp number");
      setSaving(false);
      return;
    }

    try {
      const payload: Partial<SiteSettings> = {
        siteName: siteName.trim(),
        contact: {
          email: email.trim(),
          phone: cleanWp,
          phone2: phone2.trim(),
          address: address.trim(),
        },
        billing: {
          companyName: siteName.trim(),
          whatsapp: cleanWp,
          email: email.trim(),
          gstNumber: gstNumber.trim(),
        },
        chitConfig: {
          whatsappNumber: cleanWp,
          whatsappMessage: whatsappMessage.trim(),
          upiId: upiId.trim(),
          upiPayeeName: upiPayeeName.trim(),
          bankName: bankName.trim(),
          bankAccountNo: bankAccountNo.trim(),
          bankIfsc: bankIfsc.trim().toUpperCase(),
          defaultDueDay: Number(defaultDueDay) || 10,
          announcementNotice: announcementNotice.trim(),
          isEnrollmentOpen: Boolean(isEnrollmentOpen),
        }
      };

      await updateSettings(payload);
      if (updateContextSettings) {
        await updateContextSettings(payload as any);
      }
      window.dispatchEvent(new CustomEvent('site_settings_updated', { detail: payload }));
      
      // Update local snapshot with newly saved data
      setSnapshot({
        siteName: siteName.trim(),
        email: email.trim(),
        phone2: phone2.trim(),
        address: address.trim(),
        gstNumber: gstNumber.trim(),
        whatsappNumber: cleanWp,
        whatsappMessage: whatsappMessage.trim(),
        upiId: upiId.trim(),
        upiPayeeName: upiPayeeName.trim(),
        bankName: bankName.trim(),
        bankAccountNo: bankAccountNo.trim(),
        bankIfsc: bankIfsc.trim().toUpperCase(),
        defaultDueDay: Number(defaultDueDay) || 10,
        announcementNotice: announcementNotice.trim(),
        isEnrollmentOpen: Boolean(isEnrollmentOpen),
      });

      setIsEditing(false);
      toast.success("Settings saved successfully! WhatsApp & details updated.");
    } catch (err: any) {
      console.error("Error saving settings:", err);
      toast.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const cleanCurrentWp = whatsappNumber.replace(/\D/g, "").slice(-10);
  const testWpUrl = `https://wa.me/91${cleanCurrentWp}?text=${encodeURIComponent(whatsappMessage || "Hello GPK Crackers")}`;

  const getInputClass = (extra: string = "") => `w-full text-xs font-bold p-3 rounded-xl transition-all outline-none ${
    isEditing 
      ? "bg-white border border-gray-300 focus:ring-2 focus:ring-[#A1CB35]/25 focus:border-[#A1CB35] text-gray-950 shadow-2xs" 
      : "bg-gray-100/70 border border-gray-200 text-gray-700 cursor-not-allowed select-none"
  } ${extra}`;

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen bg-gray-50/50">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto max-w-7xl">
          {/* Top Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="bg-[#F4F9EA] text-[#2D4505] p-2.5 rounded-2xl border border-[#A1CB35]/40 shadow-2xs">
                  <SettingsIcon className="w-5 h-5" />
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-xl sm:text-2xl font-black text-gray-950">
                    Settings &amp; Configuration
                  </h1>
                  {isEditing ? (
                    <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Unlock className="w-3 h-3 text-amber-700" />
                      <span>Edit Mode Active</span>
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span>View Mode (Locked)</span>
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {isEditing 
                  ? "Make your adjustments below and click Save Settings to publish changes."
                  : "Click the 'Edit Settings' button to modify WhatsApp number, payment details & store rules."
                }
              </p>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap w-full sm:w-auto">
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={loadData}
                    disabled={loading}
                    className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Refresh settings from server"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#2D4505]" : ""}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      toast.success("Edit Mode enabled! You can now edit the settings.");
                    }}
                    className="flex-1 sm:flex-none justify-center bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 uppercase tracking-wider"
                  >
                    <Edit3 className="w-4 h-4 stroke-[2.5]" />
                    <span>Edit Settings</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="p-2.5 px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                    <span>Cancel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={saving}
                    className="flex-1 sm:flex-none justify-center bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 uppercase tracking-wider disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Saving..." : "Save Settings"}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Notice Banner When Locked */}
          {!isEditing && (
            <div className="mb-6 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-[#F4F9EA] border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-gray-950">
                    Settings are currently protected in View Mode
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium">
                    To change the WhatsApp number, UPI details, or addresses, click <strong>Edit Settings</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  toast.success("Edit Mode enabled! You can now edit the settings.");
                }}
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#2D4505]" />
                <span>Unlock &amp; Edit</span>
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#35520D]" />
              <span className="text-xs font-bold text-gray-500">Loading settings...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* SECTION 1: WHATSAPP & SUPPORT COMMUNICATION (MAIN FEATURE) */}
              <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-5 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-2xs">
                      <MessageCircle className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-gray-950 flex items-center gap-2">
                        <span>WhatsApp &amp; Support Contact</span>
                        <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Live Active
                        </span>
                      </h2>
                      <p className="text-xs text-gray-500 font-medium">
                        This number powers the navbar Support button, footer WhatsApp help &amp; enquiry quick-chat.
                      </p>
                    </div>
                  </div>

                  {cleanCurrentWp && (
                    <a
                      href={testWpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 bg-[#F4F9EA] hover:bg-[#EAF5D4] text-[#2D4505] border border-[#A1CB35]/60 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer shrink-0"
                      title="Test WhatsApp Link in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Test WhatsApp Link</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* WhatsApp Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                      Primary WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-gray-400 select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9488073004"
                        disabled={!isEditing}
                        className={getInputClass("pl-12 font-mono")}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium">
                      Enter 10-digit mobile number. Currently configured: <strong className="text-gray-900 font-mono">+91 {cleanCurrentWp || "—"}</strong>
                    </p>
                  </div>

                  {/* Alternative Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                      Alternative Calling Phone
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={phone2}
                        onChange={(e) => setPhone2(e.target.value)}
                        placeholder="e.g. 04562 220000"
                        disabled={!isEditing}
                        className={getInputClass("pl-10")}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium">Optional landline or second mobile contact.</p>
                  </div>

                  {/* Pre-filled Message */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                      Default WhatsApp Pre-filled Chat Message
                    </label>
                    <input
                      type="text"
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      placeholder="Hello GPK Crackers, I have an enquiry regarding Diwali Chit Scheme"
                      disabled={!isEditing}
                      className={getInputClass()}
                    />
                    <p className="text-[11px] text-gray-400 font-medium">
                      This text automatically opens in the customer's WhatsApp chat when they click Support.
                    </p>
                  </div>

                  {/* Support Email */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                      Customer Support Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="support@gpkcrackers.com"
                        disabled={!isEditing}
                        className={getInputClass("pl-10")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: BUSINESS PROFILE & STORE DETAILS */}
              <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-5 sm:p-7 space-y-5">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#F4F9EA] text-[#2D4505] border border-[#A1CB35]/40 flex items-center justify-center shadow-2xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-gray-950">
                      Business Details &amp; Location
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      Store name, factory address &amp; GST identification for digital receipts.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Store Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                      Brand / Store Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="GPK Crackers"
                      disabled={!isEditing}
                      className={getInputClass()}
                      required
                    />
                  </div>

                  {/* GST Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                      GST Registration Number
                    </label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 33CAFPR4172K1ZG"
                      disabled={!isEditing}
                      className={getInputClass("font-mono uppercase")}
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                      Factory / Store Physical Address
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <textarea
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123, Factory Road, Sivakasi, Tamil Nadu - 626123"
                        disabled={!isEditing}
                        className={getInputClass("pl-10 leading-relaxed font-medium")}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium">Printed on payment receipts, passbooks &amp; the footer.</p>
                  </div>
                </div>
              </div>

              {/* SECTION 4: ENROLLMENT STATUS & ANNOUNCEMENT */}
              <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-5 sm:p-7 space-y-5">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-800 border border-purple-200 flex items-center justify-center shadow-2xs">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-gray-950">
                      Enrollment Rules &amp; Announcements
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      Control registration availability and customer notice banners.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200">
                    <div>
                      <div className="font-extrabold text-xs text-gray-900">
                        Chit Scheme Online Applications
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {isEnrollmentOpen ? "Customers can currently view schemes & submit enrollment applications." : "Applications are paused. Customers will see a notification that enrollment is opening soon."}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!isEditing}
                      onClick={() => setIsEnrollmentOpen(!isEnrollmentOpen)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs ${
                        !isEditing ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-95"
                      } ${
                        isEnrollmentOpen
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      {isEnrollmentOpen ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Open for Enrollment</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>Enrollment Paused</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Notice text */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                      Public Announcement / Alert Notice (Optional)
                    </label>
                    <input
                      type="text"
                      value={announcementNotice}
                      onChange={(e) => setAnnouncementNotice(e.target.value)}
                      placeholder="e.g. Diwali 2027 Chit Bookings are closing on 10th of this month! Register now."
                      disabled={!isEditing}
                      className={getInputClass()}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              {isEditing ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span>You have unsaved changes in Edit Mode</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 sm:flex-none justify-center bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 uppercase tracking-wider disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">
                    To modify WhatsApp, payment methods or business info, click <strong>Edit Settings</strong>.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      toast.success("Edit Mode enabled! You can now edit the settings.");
                    }}
                    className="bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 font-black text-xs px-5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 uppercase tracking-wider"
                  >
                    <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Edit Settings</span>
                  </button>
                </div>
              )}
            </form>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminSettings;
