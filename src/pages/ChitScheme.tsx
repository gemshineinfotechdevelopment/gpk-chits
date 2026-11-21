import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import {
  Gift, Users, ArrowRight, ShieldCheck, CheckCircle2, Clock,
  AlertCircle, ChevronRight, Phone, Mail, MapPin, User, LogIn, Lock,
  Plus, Minus, Trash2, Calendar, DollarSign, FileText, ArrowLeft,
  Sparkles, Check, X, Printer, Download, Receipt, Calculator, Award, TrendingUp, SlidersHorizontal,
  Eye, ZoomIn, Image as ImageIcon
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import {
  getChitSchemes,
  submitChitSubscription,
  getChitSubscriptions,
  ChitSchemeItem,
  ChitSubscriptionItem,
  ChitSubscribedSchemeItem,
  trackCustomerAction
} from "@/lib/api";
import { toast } from "sonner";
import { calculatePaymentTimingStatus, downloadChitReceiptPDF } from "@/lib/chitUtils";
import { ChitReceiptModal, ChitReceiptData } from "@/components/admin/ChitReceiptModal";

interface SchemeOption {
  id: string;
  title: string;
  description: string;
  startDate: string;
  totalMonths: number;
  dueDateDay: number;
  monthlyAmount: number;
  url?: string;
}

interface BannerImage {
  id: string;
  url: string;
  title: string;
  monthlyAmount?: number;
}

interface SelectedSchemeEnrollment {
  schemeId: string;
  schemeName: string;
  monthlyAmount: number;
  totalMonths: number;
  dueDateDay: number;
  personCount: number;
}

export const getMonthNameForIndex = (
  monthIndex: number,
  startDateStr?: string
): { monthName: string; dueDateStr: string } => {
  if (startDateStr && startDateStr.trim()) {
    const parts = startDateStr.trim().split('-');
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        const targetDate = new Date(y, m + (monthIndex - 1), 1);
        const monthName = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        return { monthName, dueDateStr: monthName };
      }
    }

    const start = new Date(startDateStr);
    if (!isNaN(start.getTime())) {
      const targetDate = new Date(start.getFullYear(), start.getMonth() + (monthIndex - 1), 1);
      const monthName = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      return { monthName, dueDateStr: monthName };
    }
  }
  return { monthName: `Month ${monthIndex}`, dueDateStr: `Month ${monthIndex}` };
};

const ChitScheme: React.FC = () => {
  const { isUserLoggedIn, userPhone, userName, loginWithPhone, openLoginModal } = useAuth();
  const [schemes, setSchemes] = useState<SchemeOption[]>([]);
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [activeZoomImage, setActiveZoomImage] = useState<BannerImage | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<ChitSubscriptionItem[]>([]);

  // Multi-Scheme Enrollment State
  const [selectedSchemes, setSelectedSchemes] = useState<SelectedSchemeEnrollment[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPurchasedModal, setShowPurchasedModal] = useState(false);
  const [selectedPassbookSub, setSelectedPassbookSub] = useState<ChitSubscriptionItem | null>(null);
  const [selectedPassbookScheme, setSelectedPassbookScheme] = useState<ChitSubscribedSchemeItem | null>(null);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<ChitReceiptData | null>(null);

  // Modern Fintech UI State: Drawer & Interactive Calculator
  const [isEnrollmentDrawerOpen, setIsEnrollmentDrawerOpen] = useState(false);
  const [calcSchemeId, setCalcSchemeId] = useState<string>("");
  const [calcPersons, setCalcPersons] = useState<number>(1);
  const [cardPersonCounts, setCardPersonCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (schemes.length > 0 && !calcSchemeId) {
      setCalcSchemeId(schemes[0].id);
    }
  }, [schemes, calcSchemeId]);

  const formRef = useRef<HTMLDivElement>(null);
  const previousPhoneRef = useRef<string | null>(userPhone);

  // Auto-fill customer form from login or clear on logout / account switch
  useEffect(() => {
    const cleanCurrent = userPhone ? userPhone.replace(/\D/g, "").slice(-10) : "";
    const cleanPrev = previousPhoneRef.current ? previousPhoneRef.current.replace(/\D/g, "").slice(-10) : "";

    // Clear selected schemes and person counts whenever logging out or switching to a different account
    if (!isUserLoggedIn) {
      setSelectedSchemes([]);
      setCardPersonCounts({});
      setIsEnrollmentDrawerOpen(false);
      previousPhoneRef.current = null;
    } else if (previousPhoneRef.current && cleanCurrent !== cleanPrev) {
      setSelectedSchemes([]);
      setCardPersonCounts({});
      setIsEnrollmentDrawerOpen(false);
      previousPhoneRef.current = userPhone;
    } else {
      previousPhoneRef.current = userPhone;
    }

    // Clean up any legacy sticky location cached in browser storage
    try {
      localStorage.removeItem("user_location");
      localStorage.removeItem("user_email");
    } catch {}

    if (isUserLoggedIn && userPhone) {
      setFormData(prev => ({
        name: userName || prev.name || "",
        phone: userPhone || prev.phone || "",
        email: prev.email || "",
        location: prev.location || ""
      }));
    } else {
      // Clear sensitive customer data and subscriptions when logged out
      setFormData({
        name: "",
        phone: "",
        email: "",
        location: ""
      });
      setUserSubscriptions([]);
      setShowPurchasedModal(false);
      setSelectedPassbookSub(null);
      setSelectedPassbookScheme(null);
    }
  }, [isUserLoggedIn, userPhone, userName]);

  // Fetch logged in user subscriptions (STRICTLY for authenticated users only)
  const loadUserSubscriptions = () => {
    if (!isUserLoggedIn || !userPhone) {
      setUserSubscriptions([]);
      return;
    }

    const cleanPhone = userPhone.replace(/\D/g, "").slice(-10);
    if (cleanPhone && cleanPhone.length === 10) {
      getChitSubscriptions()
        .then(allSubs => {
          const mySubs = allSubs.filter(s => {
            const p = String(s.phone || "").replace(/\D/g, "").slice(-10);
            return p === cleanPhone;
          });
          setUserSubscriptions(mySubs);
        })
        .catch(err => console.warn("Failed to fetch user subscriptions:", err));
    } else {
      setUserSubscriptions([]);
    }
  };

  useEffect(() => {
    loadUserSubscriptions();
  }, [isUserLoggedIn, userPhone]);

  useEffect(() => {
    if (isUserLoggedIn && userPhone) {
      trackCustomerAction({
        phone: userPhone,
        name: userName || undefined,
        source: "chit_scheme"
      }).catch(err => console.warn("Failed to track chit scheme action:", err));
    }
  }, [isUserLoggedIn, userPhone, userName]);

  // Load Active Schemes from Backend
  useEffect(() => {
    const loadChit = () => {
      getChitSchemes()
        .then((data) => {
          if (Array.isArray(data)) {
            const isCustomUploadedImage = (url?: string) => {
              if (!url || typeof url !== 'string') return false;
              const trimmed = url.trim();
              return trimmed.length > 0 && !trimmed.includes('unsplash.com');
            };

            const schemeList = data
              .filter((item: ChitSchemeItem) => item.title || item.schemeName)
              .map((item: ChitSchemeItem) => ({
                id: item._id || item.id || '',
                title: item.title || item.schemeName || '',
                description: item.description || '',
                startDate: item.startDate || '',
                totalMonths: item.totalMonths || item.numberOfMonths || 10,
                dueDateDay: item.dueDateDay || item.paymentDueDay || 10,
                monthlyAmount: item.monthlyAmount || 0,
                url: isCustomUploadedImage(item.url) ? item.url : ''
              }));

            const imageList = data
              .filter((item: ChitSchemeItem) => isCustomUploadedImage(item.url))
              .map((item: ChitSchemeItem) => ({
                id: item._id || item.id || '',
                url: item.url || '',
                title: item.title || item.schemeName || '',
                monthlyAmount: item.monthlyAmount || 0
              }));

            setSchemes(schemeList);
            setBannerImages(imageList);
          } else {
            setSchemes([]);
            setBannerImages([]);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch chit schemes from API:", err);
          setSchemes([]);
        });
    };

    loadChit();
    const interval = setInterval(loadChit, 15000);
    return () => clearInterval(interval);
  }, []);

  // Multi-Scheme Management Helpers
  const handleAddScheme = (schemeTitle: string) => {
    const matched = schemes.find(s => s.title === schemeTitle);
    if (!matched) return;

    setSelectedSchemes(prev => {
      const existingIdx = prev.findIndex(s => s.schemeName === matched.title);
      if (existingIdx > -1) {
        // Increment person count if already present
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          personCount: updated[existingIdx].personCount + 1
        };
        toast.info(`Increased person count for ${matched.title} to ${updated[existingIdx].personCount}`);
        return updated;
      } else {
        toast.success(`Added ${matched.title} to your enrollment`);
        return [
          ...prev,
          {
            schemeId: matched.id,
            schemeName: matched.title,
            monthlyAmount: matched.monthlyAmount,
            totalMonths: matched.totalMonths || 10,
            dueDateDay: matched.dueDateDay || 10,
            personCount: 1
          }
        ];
      }
    });

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRemoveScheme = (index: number) => {
    setSelectedSchemes(prev => prev.filter((_, i) => i !== index));
    toast.info("Scheme removed from your selection.");
  };

  const handlePersonCountChange = (index: number, newCount: number) => {
    const count = Math.max(1, parseInt(String(newCount), 10) || 1);
    setSelectedSchemes(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], personCount: count };
      }
      return updated;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getCardCount = (schemeId: string, schemeName: string) => {
    const selected = selectedSchemes.find(s => s.schemeName === schemeName);
    if (selected) return selected.personCount;
    return cardPersonCounts[schemeId] || 1;
  };

  const updateCardCount = (sch: SchemeOption, delta: number) => {
    const existingIdx = selectedSchemes.findIndex(s => s.schemeName === sch.title);
    if (existingIdx > -1) {
      const current = selectedSchemes[existingIdx].personCount;
      const next = Math.max(1, current + delta);
      handlePersonCountChange(existingIdx, next);
    } else {
      setCardPersonCounts(prev => {
        const cur = prev[sch.id] || 1;
        return { ...prev, [sch.id]: Math.max(1, cur + delta) };
      });
    }
  };

  const handleCardToggle = (sch: SchemeOption) => {
    const existingIdx = selectedSchemes.findIndex(s => s.schemeName === sch.title);
    if (existingIdx > -1) {
      handleRemoveScheme(existingIdx);
    } else {
      const count = cardPersonCounts[sch.id] || 1;
      setSelectedSchemes(prev => [
        ...prev,
        {
          schemeId: sch.id,
          schemeName: sch.title,
          monthlyAmount: sch.monthlyAmount,
          totalMonths: sch.totalMonths || 10,
          dueDateDay: sch.dueDateDay || 10,
          personCount: count
        }
      ]);
      toast.success(`Selected ${sch.title} (${count} Person${count > 1 ? 's' : ''})`);
    }
  };

  const handleEnrollDirectly = (sch: SchemeOption) => {
    const existingIdx = selectedSchemes.findIndex(s => s.schemeName === sch.title);
    if (existingIdx === -1) {
      const count = cardPersonCounts[sch.id] || 1;
      setSelectedSchemes(prev => [
        ...prev,
        {
          schemeId: sch.id,
          schemeName: sch.title,
          monthlyAmount: sch.monthlyAmount,
          totalMonths: sch.totalMonths || 10,
          dueDateDay: sch.dueDateDay || 10,
          personCount: count
        }
      ]);
    }
    if (isUserLoggedIn && userPhone) {
      setFormData(prev => ({
        ...prev,
        name: userName || prev.name || "",
        phone: userPhone || prev.phone || ""
      }));
    }
    setIsEnrollmentDrawerOpen(true);
  };

  // Aggregated Calculations
  const totalPersons = selectedSchemes.reduce((sum, s) => sum + (s.personCount || 1), 0);
  const combinedMonthlyAmount = selectedSchemes.reduce((sum, s) => sum + (s.monthlyAmount * (s.personCount || 1)), 0);
  const combinedGrandTotal = selectedSchemes.reduce(
    (sum, s) => sum + (s.monthlyAmount * (s.personCount || 1) * (s.totalMonths || 10)),
    0
  );

  // Validate and open confirmation dialog
  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isUserLoggedIn) {
      toast.error("Please log in with your mobile number to enroll in chit schemes.");
      openLoginModal();
      return;
    }

    if (selectedSchemes.length === 0) {
      toast.error("Please select at least one chit scheme");
      return;
    }
    const effectiveName = (formData.name || userName || "").trim();
    const effectivePhone = (formData.phone || userPhone || "").trim();

    if (!effectiveName) {
      toast.error("Please enter your full name");
      return;
    }
    if (!effectivePhone || effectivePhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!formData.location.trim()) {
      toast.error("Please enter your location (City/District)");
      return;
    }

    setShowConfirmModal(true);
  };

  // Submit Application
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      const effectiveName = (formData.name || userName || "").trim();
      const effectivePhone = (formData.phone || userPhone || "").trim();

      const payload = {
        name: effectiveName,
        phone: effectivePhone,
        email: formData.email.trim(),
        location: formData.location.trim(),
        schemes: selectedSchemes.map(s => ({
          schemeId: s.schemeId,
          schemeName: s.schemeName,
          monthlyAmountPerPerson: s.monthlyAmount,
          monthlyAmount: s.monthlyAmount,
          personCount: s.personCount,
          totalMonths: s.totalMonths,
          durationMonths: s.totalMonths,
          dueDateDay: s.dueDateDay
        })),
        totalPersons,
        combinedMonthlyAmount,
        combinedGrandTotal
      };

      const result = await submitChitSubscription(payload);

      // Auto login user with credentials if not logged in
      if (!isUserLoggedIn) {
        loginWithPhone(formData.phone.trim(), formData.name.trim());
      }

      setSubmittedData(result);
      setIsEnrollmentDrawerOpen(false);
      setShowSuccessModal(true);
      toast.success("Chit scheme application submitted successfully! 🎉");

      // Refresh subscriptions list
      loadUserSubscriptions();
      setSelectedSchemes([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit chit scheme application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDF8]">
      <UserHeader />

      {/* Breadcrumb Header Bar */}
      <div className="bg-[#F5F9EC] border-b border-[#A1CB35]/30 py-3.5 px-4 sm:px-12">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-gray-600 font-medium">
          <Link to="/" className="hover:text-[#35520D] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#35520D] font-bold">Chit Scheme</span>
        </div>
      </div>

      {!isUserLoggedIn ? (
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-[60vh]">
          <div className="bg-white border-2 border-[#A1CB35]/40 rounded-3xl p-8 sm:p-12 shadow-sm text-center max-w-md w-full space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#F4F9EA] text-[#35520D] flex items-center justify-center mx-auto border-2 border-[#A1CB35]/40 shadow-2xs">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#F4F9EA] text-[#2D4505] px-3 py-1 rounded-full border border-[#A1CB35]/40 inline-block">
                Diwali 2026 Chit Scheme
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
                Login / Register
              </h2>
              <p className="text-xs text-gray-600 font-medium leading-relaxed max-w-xs mx-auto">
                Please login with your WhatsApp mobile number to view our chit schemes and enroll.
              </p>
            </div>

            <button
              type="button"
              onClick={openLoginModal}
              className="w-full bg-[#A1CB35] hover:bg-[#8FB82B] active:scale-95 text-gray-950 text-xs font-black py-4 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <LogIn className="w-4 h-4 text-gray-950" />
              <span>Login / Register</span>
            </button>
          </div>
        </main>
      ) : (
        <main className="flex-1 pb-32 sm:pb-28 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 pt-4 sm:pt-6">
        {/* Top Header / Account Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white/90 backdrop-blur-sm p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#A1CB35]/30 shadow-2xs">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#A1CB35]/20 text-[#35520D] flex items-center justify-center border border-[#A1CB35]/40 shadow-2xs shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#A1CB35]/20 text-[#2D4505] px-2.5 py-0.5 rounded-full border border-[#A1CB35]/40">
                  Diwali 2026 Savings
                </span>
                <span className="text-xs font-semibold text-gray-500 hidden sm:inline">• 10 Months Fixed Scheme</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
                GPK Chit Scheme
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-2.5 w-full sm:w-auto">
            {isUserLoggedIn && (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F4F9EA] border border-[#A1CB35]/40 text-[#2D4505] px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#35520D] shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-none"><span className="text-gray-500 font-normal hidden sm:inline">Account:</span> <strong className="text-gray-950 font-bold">{userName || 'Customer'}</strong></span>
              </div>
            )}
            {isUserLoggedIn && userSubscriptions.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPurchasedModal(true)}
                className="bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 font-black px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs transition-all shadow-sm flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-950" />
                <span>My Passbook ({userSubscriptions.length})</span>
              </button>
            )}
            {!isUserLoggedIn && (
              <button
                type="button"
                onClick={openLoginModal}
                className="bg-white hover:bg-[#F4F9EA] text-[#35520D] border border-[#A1CB35] px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#35520D]" />
                <span>Login / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* 3-COLUMN AVAILABLE SCHEMES GRID */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-4">
            <div>
              <h3 className="text-2xl font-black text-gray-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#35520D]" />
                <span>Available Chit Schemes ({schemes.length})</span>
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Choose one or multiple schemes. Adjust person counts per plan to match your savings goal.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-white px-3.5 py-1.5 rounded-full border border-gray-200 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#35520D]" />
              <span>Standard 10-Month Tenures</span>
            </div>
          </div>

          {schemes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-gray-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#F7FBEF] text-[#35520D] mx-auto flex items-center justify-center border border-[#A1CB35]/30 shadow-2xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-gray-950 text-lg">New Chit Schemes Opening Soon!</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                Currently all scheme batches are finalizing. New savings schemes for Diwali 2026 will be available for registration shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {schemes.map((sch) => {
                const isSelected = selectedSchemes.some(s => s.schemeName === sch.title);
                const selectedItem = selectedSchemes.find(s => s.schemeName === sch.title);
                const currentCount = getCardCount(sch.id, sch.title);
                const cardMonthlyTotal = sch.monthlyAmount * currentCount;
                const cardMaturityTotal = cardMonthlyTotal * (sch.totalMonths || 10);

                return (
                  <div
                    key={sch.id}
                    className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 transition-all duration-300 flex flex-col justify-between group shadow-sm ${
                      isSelected
                        ? "border-[#A1CB35] bg-[#F7FBEF]/50 ring-4 ring-[#A1CB35]/20 shadow-md"
                        : "border-gray-200 hover:border-[#A1CB35] hover:shadow-xl"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="bg-[#F4F9EA] text-[#2D4505] border border-[#A1CB35]/40 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                          {sch.totalMonths || 10} Months Plan
                        </span>
                        {isSelected ? (
                          <span className="bg-[#A1CB35] text-gray-950 font-black text-[10px] px-3 py-1 rounded-full inline-flex items-center gap-1 border border-[#8FB82B] shadow-2xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Added ({selectedItem?.personCount} Person{selectedItem && selectedItem.personCount > 1 ? 's' : ''})
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-gray-400 group-hover:text-[#2D4505] transition-colors">
                            Open for Enrollment
                          </span>
                        )}
                      </div>

                      {/* Scheme Image Banner if assigned */}
                      {sch.url && sch.url.trim().length > 0 && !sch.url.includes("unsplash.com") && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveZoomImage({ id: sch.id, url: sch.url!, title: sch.title, monthlyAmount: sch.monthlyAmount });
                          }}
                          className="relative w-full h-44 sm:h-48 mb-4 rounded-2xl overflow-hidden border border-[#A1CB35]/30 bg-gray-50 group/img cursor-pointer shadow-2xs hover:border-[#A1CB35] transition-all"
                          title="Click to zoom image"
                        >
                          <img
                            src={sch.url}
                            alt={sch.title}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white/95 text-gray-950 text-xs font-black px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                              <ZoomIn className="w-3.5 h-3.5 text-[#2D4505]" />
                              <span>View Full Poster</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Title & Description */}
                      <h4 className="text-lg font-black text-gray-950 group-hover:text-[#2D4505] transition-colors line-clamp-1" title={sch.title}>
                        {sch.title}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-2 min-h-[2.5rem]">
                        {sch.description || "Join our monthly savings scheme & unlock exclusive Diwali bonus perks!"}
                      </p>

                      {/* Pricing Focus */}
                      <div className="my-5 p-4 rounded-2xl bg-gradient-to-br from-[#F4F9EA] to-white border border-[#A1CB35]/40">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                          Monthly Installment
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-3xl font-black text-gray-950">
                            ₹{sch.monthlyAmount.toLocaleString()}
                          </span>
                          <span className="text-xs font-semibold text-gray-500">
                            / person / mo
                          </span>
                        </div>
                      </div>

                      {/* Inline Person Stepper */}
                      <div className="flex items-center justify-between bg-gray-50/80 p-3 rounded-2xl border border-gray-200/80 mb-4">
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#35520D]" />
                          <span>Persons:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCardCount(sch, -1);
                            }}
                            disabled={currentCount <= 1}
                            className="w-7 h-7 bg-white hover:bg-gray-100 disabled:opacity-40 border border-gray-300 rounded-lg flex items-center justify-center font-bold text-gray-700 cursor-pointer shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-black text-xs text-gray-900">
                            {currentCount}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCardCount(sch, 1);
                            }}
                            className="w-7 h-7 bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 font-black rounded-lg flex items-center justify-center cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Specification Details */}
                      <div className="space-y-2 text-xs border-t border-gray-100 pt-3 mb-5">
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Tenure:</span>
                          <strong className="text-gray-900 font-bold">{sch.totalMonths || 10} Months</strong>
                        </div>
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Payment Due:</span>
                          <strong className="text-gray-900 font-bold">Before {sch.dueDateDay || 10}th of month</strong>
                        </div>
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Subtotal for {currentCount} Person{currentCount > 1 ? 's' : ''}:</span>
                          <strong className="text-[#2D4505] font-black">₹{cardMonthlyTotal.toLocaleString()} / mo</strong>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                          <span className="font-extrabold text-gray-900">10-Month Maturity:</span>
                          <strong className="text-gray-950 font-black text-sm">₹{cardMaturityTotal.toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleCardToggle(sch)}
                        className={`h-11 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <X className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Select</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEnrollDirectly(sch)}
                        className="h-11 rounded-2xl bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <span>Enroll Now →</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* BOTTOM STICKY FLOATING SUMMARY BAR */}
        {selectedSchemes.length > 0 && (
          <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-40 bg-gray-950/95 backdrop-blur-md text-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-2.5 sm:gap-3.5 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#A1CB35] text-gray-950 flex items-center justify-center font-black shrink-0 shadow-sm">
                <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#A1CB35]">
                    {selectedSchemes.length} Scheme{selectedSchemes.length > 1 ? "s" : ""}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-[11px] sm:text-xs text-gray-300 font-bold truncate">
                    {totalPersons} Person{totalPersons > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="text-base sm:text-xl font-extrabold text-white truncate">
                  ₹{combinedMonthlyAmount.toLocaleString()} <span className="text-xs font-normal text-gray-400">/ mo</span>
                  <span className="hidden sm:inline text-xs text-gray-400 font-normal ml-3">
                    (10-Mo Total: ₹{combinedGrandTotal.toLocaleString()})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (isUserLoggedIn && userPhone) {
                    setFormData(prev => ({
                      ...prev,
                      name: userName || prev.name || "",
                      phone: userPhone || prev.phone || ""
                    }));
                  }
                  setIsEnrollmentDrawerOpen(true);
                }}
                className="w-full sm:w-auto bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 font-black text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 uppercase tracking-wider"
              >
                <span>Proceed to Application</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* SLIDE-OVER ENROLLMENT DRAWER (SHEET) */}
        <Sheet open={isEnrollmentDrawerOpen} onOpenChange={setIsEnrollmentDrawerOpen}>
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col bg-white border-l border-gray-200">
            <div className="p-6 border-b border-gray-100 bg-[#F7FBEF]">
              <SheetHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#A1CB35] text-gray-950 px-2.5 py-0.5 rounded-full border border-[#8FB82B]">
                    Application Form
                  </span>
                  <span className="text-xs text-gray-600 font-semibold">• Diwali 2026</span>
                </div>
                <SheetTitle className="text-2xl font-black text-gray-950">
                  Chit Scheme Enrollment
                </SheetTitle>
                <SheetDescription className="text-xs text-gray-600 font-medium">
                  Review selected schemes, enter your verified mobile number, and submit your registration.
                </SheetDescription>
              </SheetHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Account / Verification Banner */}
              {!isUserLoggedIn && (
                <div className="bg-[#F4F9EA] border border-[#A1CB35]/50 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-[#2D4505] block">Have an existing account?</span>
                    <span className="text-[11px] text-gray-600">Login with your mobile number to auto-fill details.</span>
                  </div>
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="bg-white hover:bg-gray-100 text-[#35520D] border border-[#A1CB35] font-black text-xs px-3.5 py-2 rounded-xl shrink-0 cursor-pointer shadow-2xs"
                  >
                    Login
                  </button>
                </div>
              )}

              <form onSubmit={handleInitiateSubmit} className="space-y-6">
                {/* STEP 1: CUSTOMER INFORMATION */}
                <div className="space-y-3 bg-[#F7FBEF]/60 p-4 rounded-2xl border border-[#A1CB35]/30">
                  <div className="font-extrabold text-[#35520D] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Step 1: Customer Details</span>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase">
                        Full Name *
                      </label>
                      {isUserLoggedIn && (userName || formData.name) && (
                        <span className="text-[10px] text-[#2D4505] font-bold bg-[#A1CB35]/20 px-2 py-0.5 rounded border border-[#A1CB35]/40">
                          ✓ Verified Account
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name || userName || ""}
                        onChange={handleInputChange}
                        readOnly={Boolean(isUserLoggedIn)}
                        className={`w-full text-xs font-bold p-2.5 pl-8 rounded-xl outline-none border ${
                          isUserLoggedIn
                            ? "bg-gray-100 text-gray-700 border-gray-300 cursor-not-allowed select-none"
                            : "bg-white border-gray-300 focus:ring-2 focus:ring-[#A1CB35]/25 focus:border-[#A1CB35]"
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase">
                        Mobile Number *
                      </label>
                      {userPhone && (
                        <span className="text-[10px] text-[#2D4505] font-bold bg-[#A1CB35]/20 px-2 py-0.5 rounded border border-[#A1CB35]/40">
                          ✓ Verified WhatsApp
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 font-bold text-xs text-gray-500">
                        +91
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="10-digit mobile number"
                        value={formData.phone || userPhone || ""}
                        onChange={handleInputChange}
                        maxLength={10}
                        readOnly={Boolean(isUserLoggedIn && userPhone)}
                        className={`w-full text-xs font-bold p-2.5 pl-11 rounded-xl outline-none border ${
                          isUserLoggedIn && userPhone
                            ? "bg-gray-100 text-gray-700 border-gray-300 cursor-not-allowed select-none"
                            : "bg-white border-gray-300 focus:border-[#A1CB35]"
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Email & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase">
                        Email ID
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="Email (optional)"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A1CB35]/25 focus:border-[#A1CB35] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase">
                        Location / City *
                      </label>
                      <input
                        type="text"
                        name="location"
                        placeholder="City / District"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full text-xs font-medium p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A1CB35]/25 focus:border-[#A1CB35] outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* STEP 2: SELECTED SCHEMES REVIEW */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-[#35520D] text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5" />
                      <span>Step 2: Selected Schemes ({selectedSchemes.length})</span>
                    </div>
                    <span className="text-[11px] text-gray-500 font-bold">
                      Total Persons: <strong className="text-[#2D4505] font-extrabold">{totalPersons}</strong>
                    </span>
                  </div>

                  {selectedSchemes.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
                      <p className="text-xs text-amber-900 font-medium">
                        No schemes selected yet. Please select at least 1 scheme from the catalogue.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsEnrollmentDrawerOpen(false)}
                        className="text-xs font-black text-[#2D4505] underline decoration-[#A1CB35] cursor-pointer"
                      >
                        Browse Schemes Catalogue →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedSchemes.map((s, idx) => {
                        const subMonthly = s.monthlyAmount * (s.personCount || 1);

                        return (
                          <div
                            key={idx}
                            className="bg-[#F7FBEF] border border-[#A1CB35]/40 rounded-2xl p-3.5 space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-black text-gray-950">{s.schemeName}</h5>
                                <span className="text-[11px] text-gray-500 font-medium">
                                  ₹{s.monthlyAmount.toLocaleString()} / person / mo • {s.totalMonths || 10} Mos
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveScheme(idx)}
                                className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove Scheme"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between border-t border-[#A1CB35]/20 pt-2 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-gray-600">Persons:</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handlePersonCountChange(idx, s.personCount - 1)}
                                    disabled={s.personCount <= 1}
                                    className="w-6 h-6 rounded-md bg-white border border-gray-300 disabled:opacity-40 font-bold text-gray-700 flex items-center justify-center cursor-pointer shadow-2xs"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center font-black text-xs text-gray-950">
                                    {s.personCount}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handlePersonCountChange(idx, s.personCount + 1)}
                                    className="w-6 h-6 rounded-md bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 font-black flex items-center justify-center cursor-pointer shadow-2xs"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[11px] font-black text-[#2D4505]">
                                  ₹{subMonthly.toLocaleString()} / mo
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* STEP 3: FINANCIAL SUMMARY */}
                {selectedSchemes.length > 0 && (
                  <div className="bg-gray-950 text-white rounded-2xl p-4 space-y-2.5 text-xs">
                    <div className="font-extrabold uppercase tracking-wider text-[11px] border-b border-white/10 pb-1.5 flex justify-between items-center text-[#A1CB35]">
                      <span>Application Financial Summary</span>
                      <span className="bg-white/10 text-white px-2 py-0.5 rounded font-black text-[10px]">
                        {totalPersons} Person{totalPersons > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-1 text-gray-300 text-[11px]">
                      <div className="flex justify-between">
                        <span>Combined Monthly Payable:</span>
                        <strong className="text-white font-mono text-xs">₹{combinedMonthlyAmount.toLocaleString()} / mo</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Standard Tenure:</span>
                        <span className="text-white">10 Months</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total 10-Month Maturity:</span>
                        <strong className="text-[#A1CB35] font-mono text-xs">₹{combinedGrandTotal.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: SUBMIT CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting || selectedSchemes.length === 0}
                  className="w-full bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 font-black text-xs py-4 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 uppercase tracking-wider"
                >
                  <ShieldCheck className="w-4 h-4 text-gray-950" />
                  <span>
                    {isSubmitting
                      ? "Submitting Application..."
                      : selectedSchemes.length === 0
                      ? "Select at Least 1 Scheme"
                      : `Submit Application (₹${combinedMonthlyAmount.toLocaleString()} / mo)`}
                  </span>
                </button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </main>
      )}

      {/* CONFIRMATION DIALOG BEFORE SUBMISSION */}
      {showConfirmModal && (
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="max-w-md p-6 bg-white rounded-3xl space-y-4 font-sans">
            <DialogHeader className="space-y-1 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F7FBEF] text-[#35520D] mx-auto flex items-center justify-center border-4 border-[#A1CB35]/30">
                <Gift className="w-7 h-7 stroke-[2.5]" />
              </div>
              <DialogTitle className="text-xl font-extrabold text-gray-950">
                Confirm Chit Scheme Application
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 font-medium">
                Please review your selected schemes and total persons before confirming.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-[#F7FBEF]/60 border border-[#A1CB35]/30 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Customer:</span>
                <strong className="text-gray-950 font-bold">{formData.name} ({formData.phone})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Location:</span>
                <span className="text-gray-800 font-semibold">{formData.location}</span>
              </div>
              <div className="border-t border-[#A1CB35]/20 pt-2 space-y-1">
                <span className="text-[11px] font-black text-[#2D4505] uppercase block">
                  Enrolled Schemes ({selectedSchemes.length}):
                </span>
                {selectedSchemes.map((s, idx) => (
                  <div key={idx} className="flex justify-between text-gray-700">
                    <span>• {s.schemeName} ({s.personCount} Person{s.personCount > 1 ? "s" : ""}):</span>
                    <strong className="text-gray-950">₹{(s.monthlyAmount * s.personCount).toLocaleString()}/mo</strong>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#A1CB35]/20 pt-2 flex justify-between items-center">
                <span className="font-extrabold text-gray-900">Total Monthly Payment:</span>
                <strong className="text-[#2D4505] text-sm font-black">₹{combinedMonthlyAmount.toLocaleString()} / mo</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Back / Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="py-2.5 bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 rounded-xl text-xs font-black cursor-pointer transition-all shadow-md border border-[#8FB82B]/60 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* SUBMISSION SUCCESS DIALOG */}
      {showSuccessModal && (
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="max-w-md p-6 bg-white rounded-3xl text-center space-y-4 font-sans">
            <div className="w-16 h-16 rounded-full bg-[#F7FBEF] text-[#35520D] mx-auto flex items-center justify-center border-4 border-[#A1CB35]/30">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <DialogHeader className="space-y-1 text-center">
              <DialogTitle className="text-xl font-black text-gray-950">
                Application Submitted! 🎉
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 font-medium">
                Thank you <strong className="text-gray-950">{submittedData?.name}</strong>. Your application has been registered successfully!
              </DialogDescription>
            </DialogHeader>

            <div className="bg-[#F7FBEF]/60 border border-[#A1CB35]/30 rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Application No:</span>
                <span className="font-mono font-black text-[#2D4505]">{submittedData?.applicationNumber || "Registered"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Total Persons:</span>
                <span className="font-bold text-gray-950">{submittedData?.totalPersons || totalPersons} Person(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Combined Monthly:</span>
                <span className="font-black text-[#2D4505]">₹{(submittedData?.combinedMonthlyAmount || combinedMonthlyAmount).toLocaleString()} / month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Status:</span>
                <span className="bg-[#F7FBEF] text-[#2D4505] border border-[#A1CB35]/50 px-2.5 py-0.5 rounded-full font-black text-[11px]">
                  Pending Admin Approval
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                setShowPurchasedModal(true);
              }}
              className="w-full bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 font-black py-3 rounded-2xl text-xs transition-all shadow-md border border-[#8FB82B]/60 cursor-pointer"
            >
              View My Digital Passbook
            </button>
          </DialogContent>
        </Dialog>
      )}

      {/* CUSTOMER DIGITAL PASSBOOK & PURCHASED SCHEMES MODAL */}
      {showPurchasedModal && isUserLoggedIn && (
        <Dialog open={showPurchasedModal} onOpenChange={(open) => {
          setShowPurchasedModal(open);
          if (!open) {
            setSelectedPassbookSub(null);
            setSelectedPassbookScheme(null);
          }
        }}>
          <DialogContent className="max-w-4xl p-6 sm:p-8 bg-white rounded-3xl max-h-[90vh] overflow-y-auto space-y-6 font-sans">
            {!selectedPassbookScheme ? (
              /* VIEW 1: LIST OF ENROLLED SCHEMES */
              <div className="space-y-5">
                <DialogHeader className="border-b border-gray-100 pb-4">
                  <DialogTitle className="text-xl font-extrabold text-[#1F2937] flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-[#35520D]" />
                    My Digital Chit Passbook ({userSubscriptions.length} Applications)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-600 font-medium">
                    View all your enrolled schemes, person counts, installment progress, and official payment receipts.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {userSubscriptions.map((sub, sIdx) => {
                    const currentApproval = sub.approvalStatus || (sub.status === 'Paid' || sub.status === 'Approved' ? 'Approved' : (sub.status === 'Rejected' ? 'Rejected' : 'Pending'));
                    const enrolledSchemes: ChitSubscribedSchemeItem[] = (sub.schemes && sub.schemes.length > 0)
                      ? sub.schemes.map(sch => {
                          const persons = Math.max(1, sch.personCount || 1);
                          let monthly = sch.monthlyAmountPerPerson || sch.monthlyAmount || 0;
                          if (monthly === 0 && sch.schemeName) {
                            const match = sch.schemeName.match(/\d+/);
                            if (match) monthly = parseInt(match[0], 10);
                          }
                          const duration = sch.durationMonths || sch.totalMonths || 10;
                          const totalMonthly = sch.totalMonthlyAmount || (monthly * persons);
                          const totalScheme = sch.totalSchemeAmount || (totalMonthly * duration);
                          const validPaidStatuses = ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'];
                          const paidLogs = (sch.monthlyPayments || []).filter(p => validPaidStatuses.includes(p.status));
                          const paidAmount = sch.paidAmount !== undefined ? sch.paidAmount : paidLogs.reduce((sum, p) => sum + (p.amount || p.paidAmount || totalMonthly), 0);
                          return {
                            ...sch,
                            personCount: persons,
                            monthlyAmountPerPerson: monthly,
                            totalMonthlyAmount: totalMonthly,
                            durationMonths: duration,
                            totalMonths: duration,
                            totalSchemeAmount: totalScheme,
                            paidAmount: paidAmount,
                            remainingAmount: Math.max(0, totalScheme - paidAmount),
                            monthsPaid: sch.monthsPaid || paidLogs.length,
                            paidInstallments: sch.monthsPaid || paidLogs.length
                          };
                        })
                      : [{
                          _id: sub._id,
                          schemeId: sub.schemeId,
                          schemeName: sub.schemeName || "Chit Scheme",
                          personCount: Math.max(1, sub.personCount || 1),
                          monthlyAmountPerPerson: (() => {
                            let m = sub.monthlyAmount || 0;
                            if (m === 0 && sub.schemeName) {
                              const match = sub.schemeName.match(/\d+/);
                              if (match) m = parseInt(match[0], 10);
                            }
                            return m;
                          })(),
                          monthlyAmount: sub.monthlyAmount || 0,
                          totalMonthlyAmount: sub.combinedMonthlyAmount || sub.monthlyAmount || 0,
                          durationMonths: 10,
                          totalMonths: 10,
                          dueDateDay: 10,
                          totalSchemeAmount: sub.combinedGrandTotal || ((sub.monthlyAmount || 0) * 10),
                          paidAmount: (sub.monthlyPayments || []).filter(p => ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(p.status)).reduce((s, p) => s + (p.amount || 0), 0),
                          remainingAmount: Math.max(0, (sub.combinedGrandTotal || ((sub.monthlyAmount || 0) * 10)) - (sub.monthlyPayments || []).filter(p => ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(p.status)).reduce((s, p) => s + (p.amount || 0), 0)),
                          monthsPaid: sub.monthsPaid || 0,
                          approvalStatus: currentApproval as any,
                          status: sub.status || 'Pending',
                          stage: sub.stage || 'Pending Approval',
                          monthlyPayments: sub.monthlyPayments || []
                        }];

                    const appTotalPersons = enrolledSchemes.reduce((sum, s) => sum + (s.personCount || 1), 0);
                    const appCombinedMonthly = enrolledSchemes.reduce((sum, s) => sum + (s.totalMonthlyAmount || ((s.monthlyAmountPerPerson || 0) * (s.personCount || 1))), 0);
                    const appCombinedGrand = enrolledSchemes.reduce((sum, s) => sum + (s.totalSchemeAmount || ((s.totalMonthlyAmount || 0) * (s.durationMonths || 10))), 0);
                    const appTotalPaid = enrolledSchemes.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
                    const appRemainingBalance = Math.max(0, appCombinedGrand - appTotalPaid);

                    return (
                      <div key={sub._id || sub.id || sIdx} className="border-2 border-[#A1CB35]/30 rounded-3xl p-5 bg-white space-y-4 shadow-2xs">
                        {/* Application Header Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                          <div>
                            <span className="font-mono text-xs font-black text-[#2D4505]">
                              {sub.applicationNumber || `Application #${String(sub._id || sub.id).slice(-6)}`}
                            </span>
                            <span className="text-[11px] text-gray-500 ml-2">
                              Applied: {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                            </span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                            currentApproval === "Approved"
                              ? "bg-[#F7FBEF] text-[#2D4505] border border-[#A1CB35]"
                              : currentApproval === "Rejected"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-[#F7FBEF] text-[#2D4505] border border-[#A1CB35]/40"
                          }`}>
                            {currentApproval === "Approved" ? "Approved" : currentApproval === "Rejected" ? "Rejected" : "Pending Approval"}
                          </span>
                        </div>

                        {/* Combined Application Financial Summary Banner */}
                        <div className="bg-[#F7FBEF] border border-[#A1CB35]/30 rounded-2xl p-3.5 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-black text-gray-950 uppercase tracking-wide">
                              <Sparkles className="w-3.5 h-3.5 text-[#35520D]" />
                              <span>Combined Financial Summary</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-white text-[#2D4505] border border-[#A1CB35]/40 font-black text-[11px] px-2.5 py-0.5 rounded-full">
                                {enrolledSchemes.length} Scheme{enrolledSchemes.length > 1 ? 's' : ''} Selected
                              </span>
                              <span className="bg-[#A1CB35] text-gray-950 font-black text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[#8FB82B]">
                                <Users className="w-3 h-3" />
                                <span>{appTotalPersons} Total Person(s)</span>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-white p-3 rounded-xl border border-[#A1CB35]/30 shadow-2xs">
                            <div>
                              <span className="text-gray-500 text-[10px] block font-medium">Combined Monthly</span>
                              <strong className="text-[#2D4505] text-xs sm:text-sm font-black">₹{appCombinedMonthly.toLocaleString()} / mo</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 text-[10px] block font-medium">Grand Scheme Total</span>
                              <strong className="text-[#1F2937] text-xs sm:text-sm font-black">₹{appCombinedGrand.toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 text-[10px] block font-medium">Total Paid Till Date</span>
                              <strong className="text-[#2D4505] text-xs sm:text-sm font-black">₹{appTotalPaid.toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 text-[10px] block font-medium">Remaining Balance</span>
                              <strong className="text-rose-700 text-xs sm:text-sm font-black">₹{appRemainingBalance.toLocaleString()}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Item-wise Chit Calculation Formula Banner (User Request: 300 x 5 = 1500, 500 x 3 = 1500, etc.) */}
                        <div className="bg-[#F7FBEF] border border-[#A1CB35]/40 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#A1CB35]/25 pb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-[#A1CB35] text-gray-950 p-1 rounded-md">
                                <Receipt className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-black uppercase text-[#2D4505] tracking-wide">
                                Chits Calculation Formula Breakdown
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-gray-600">
                              Formula: Rate × Persons = Monthly Amount
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {enrolledSchemes.map((schItem, idx) => {
                              const rate = schItem.monthlyAmountPerPerson || schItem.monthlyAmount || 0;
                              const count = schItem.personCount || 1;
                              const subTot = schItem.totalMonthlyAmount || (rate * count);
                              return (
                                <div key={idx} className="bg-white border border-[#A1CB35]/30 rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
                                  <div>
                                    <div className="text-xs font-black text-[#1F2937] truncate max-w-[120px]">{schItem.schemeName}</div>
                                    <div className="text-[10px] text-gray-500 font-medium">₹{rate} / person</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-sans tabular-nums text-xs font-black text-[#2D4505] bg-[#F7FBEF] px-2.5 py-1 rounded-md border border-[#A1CB35]/40">
                                      ₹{rate.toLocaleString()} × {count} = ₹{subTot.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">{count} Person{count > 1 ? 's' : ''}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="bg-white/90 border border-[#A1CB35]/30 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="font-sans font-bold text-gray-800 text-[11px] tabular-nums">
                              <span className="text-gray-500 font-medium">Summary Calculation: </span>
                              <span className="text-[#2D4505] font-black">
                                {enrolledSchemes.map(s => {
                                  const rate = s.monthlyAmountPerPerson || s.monthlyAmount || 0;
                                  const count = s.personCount || 1;
                                  return `₹${rate.toLocaleString()} × ${count} = ₹${(rate * count).toLocaleString()}`;
                                }).join(" + ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="font-bold text-gray-700">
                                Total Persons: <span className="font-black text-[#2D4505] text-sm">{appTotalPersons}</span>
                              </div>
                              <div className="font-bold text-gray-700">
                                Monthly Payable: <span className="font-black text-[#2D4505] text-sm">₹{appCombinedMonthly.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Enrolled Schemes under this Application */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                            <Gift className="w-3.5 h-3.5 text-[#35520D]" />
                            <span>Enrolled Scheme Details ({enrolledSchemes.length})</span>
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {enrolledSchemes.map((schItem, schIdx) => {
                              const isApproved = schItem.approvalStatus === "Approved" || schItem.status === "Approved" || schItem.status === "Paid" || currentApproval === "Approved";
                              const duration = schItem.durationMonths || schItem.totalMonths || 10;
                              const paidCount = schItem.monthsPaid || 0;
                              const progressPercent = Math.min(100, Math.round((paidCount / duration) * 100));

                              return (
                                <div
                                  key={schItem._id || schIdx}
                                  className="bg-[#F7FBEF]/40 border border-[#A1CB35]/30 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-extrabold text-[#1F2937] text-sm">
                                        {schItem.schemeName}
                                      </h4>
                                      <span className="bg-[#F7FBEF] text-[#2D4505] font-black text-[11px] px-2.5 py-0.5 rounded-full border border-[#A1CB35]/40">
                                        {schItem.personCount} Person(s)
                                      </span>
                                    </div>

                                    <div className="text-xs space-y-1.5 bg-white p-3 rounded-xl border border-gray-200">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Monthly / Person:</span>
                                        <strong className="text-gray-800 font-bold">₹{schItem.monthlyAmountPerPerson?.toLocaleString()}</strong>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Scheme Monthly Total:</span>
                                        <strong className="text-[#2D4505] font-black">₹{schItem.totalMonthlyAmount?.toLocaleString()}</strong>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Duration:</span>
                                        <span className="text-gray-800 font-semibold">{duration} Months</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Scheme Grand Total:</span>
                                        <strong className="text-[#1F2937] font-extrabold">₹{schItem.totalSchemeAmount?.toLocaleString()}</strong>
                                      </div>
                                      <div className="flex justify-between border-t border-gray-100 pt-1">
                                        <span className="text-gray-500 font-medium">Installment Progress:</span>
                                        <strong className="text-gray-900 font-bold">{paidCount} / {duration} Months</strong>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Paid / Remaining:</span>
                                        <span className="text-xs font-bold">
                                          <span className="text-[#2D4505]">₹{schItem.paidAmount?.toLocaleString()}</span>
                                          <span className="text-gray-400 mx-1">/</span>
                                          <span className="text-rose-700">₹{schItem.remainingAmount?.toLocaleString()}</span>
                                        </span>
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[11px] font-bold text-gray-600">
                                        <span>Progress</span>
                                        <span>{progressPercent}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                        <div
                                          className="bg-[#A1CB35] h-2 rounded-full transition-all duration-500"
                                          style={{ width: `${progressPercent}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPassbookSub(sub);
                                      setSelectedPassbookScheme(schItem);
                                    }}
                                    className="w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 border border-[#8FB82B]/50"
                                  >
                                    <span>{isApproved ? "View Scheme Passbook & Receipts" : "View Scheme Schedule Preview"}</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* VIEW 2: DETAILED MONTHWISE PASSBOOK & RECEIPTS FOR A SCHEME */
              <div className="space-y-6">
                {(() => {
                  const sub = selectedPassbookSub ? (userSubscriptions.find(s => (s._id || s.id) === (selectedPassbookSub._id || selectedPassbookSub.id)) || selectedPassbookSub) : userSubscriptions[0];
                  const sch = (sub?.schemes && selectedPassbookScheme ? sub.schemes.find(s => String(s._id || s.schemeId) === String(selectedPassbookScheme._id || selectedPassbookScheme.schemeId)) : null) || selectedPassbookScheme;
                  const subApproval = sub?.approvalStatus || (sub?.status === 'Paid' || sub?.status === 'Approved' ? 'Approved' : 'Pending');
                  const isApproved = sch.approvalStatus === "Approved" || sch.status === "Approved" || sch.status === "Paid" || subApproval === "Approved";
                  const totalMonths = sch.durationMonths || sch.totalMonths || 10;
                  const dueDateDay = sch.dueDateDay || 10;
                  const monthlyPerPerson = sch.monthlyAmountPerPerson || sch.monthlyAmount || 0;
                  const personCount = Math.max(1, sch.personCount || 1);
                  const monthlyTotal = sch.totalMonthlyAmount || (monthlyPerPerson * personCount);
                  const grandTotal = sch.totalSchemeAmount || (monthlyTotal * totalMonths);
                  const monthList = Array.from({ length: totalMonths }, (_, i) => i + 1);
                  const allSiblingSchemes: ChitSubscribedSchemeItem[] = (sub?.schemes && sub.schemes.length > 0) ? sub.schemes : [sch];

                  return (
                    <>
                      <DialogHeader className="border-b border-gray-100 pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedPassbookScheme(null)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Enrolled Schemes</span>
                          </button>
                          <span className={`px-3 py-1 rounded-full font-black text-xs border ${
                            isApproved ? "bg-[#F7FBEF] text-[#2D4505] border-[#A1CB35]" : "bg-[#F7FBEF] text-[#2D4505] border-[#A1CB35]/40"
                          }`}>
                            {isApproved ? "Active Scheme" : "Pending Verification"}
                          </span>
                        </div>
                        <DialogTitle className="text-xl font-extrabold text-[#1F2937] mt-2">
                          {sch.schemeName} — Passbook Schedule
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-600 font-medium">
                          Enrolled for <strong className="text-[#2D4505]">{personCount} Person(s)</strong> • Amount / Person: <strong className="text-gray-900">₹{monthlyPerPerson.toLocaleString()}</strong> • Expected Monthly: <strong className="text-[#2D4505]">₹{monthlyTotal.toLocaleString()}</strong> • Scheme Total: <strong className="text-[#1F2937]">₹{grandTotal.toLocaleString()}</strong> • Due: Before {dueDateDay}th
                        </DialogDescription>

                        {/* Scheme Switcher Tabs when multiple schemes are present */}
                        {allSiblingSchemes.length > 1 && (
                          <div className="flex flex-wrap gap-2 items-center pt-2.5 border-t border-gray-100 mt-2">
                            <span className="text-xs font-bold text-gray-500">Switch Scheme:</span>
                            {allSiblingSchemes.map((sTab, tIdx) => {
                              const isTabActive = String(sTab._id || sTab.schemeId) === String(sch._id || sch.schemeId);
                              return (
                                <button
                                  key={tIdx}
                                  type="button"
                                  onClick={() => setSelectedPassbookScheme(sTab)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isTabActive
                                      ? "bg-[#A1CB35] text-gray-950 shadow-2xs border border-[#8FB82B]"
                                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  <span>{sTab.schemeName}</span>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                    isTabActive ? "bg-white/40 text-gray-950" : "bg-[#F7FBEF] text-[#2D4505]"
                                  }`}>
                                    {sTab.personCount || 1}p
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </DialogHeader>

                      {/* Chit Scheme Rate & Calculation Box for this Scheme */}
                      <div className="bg-[#F7FBEF] border border-[#A1CB35]/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#2D4505] bg-white px-2 py-1 rounded border border-[#A1CB35]/40">
                            {monthlyPerPerson} × {personCount} = ₹{monthlyTotal.toLocaleString()}
                          </span>
                          <span className="text-gray-600 font-medium">({personCount} Person{personCount > 1 ? 's' : ''} enrolled)</span>
                        </div>
                        <div className="text-gray-700 font-semibold">
                          Monthly Installment: <strong className="text-[#2D4505] font-black">₹{monthlyTotal.toLocaleString()}</strong>
                        </div>
                      </div>

                      {!isApproved && (
                        <div className="bg-[#F7FBEF] border border-[#A1CB35]/40 rounded-2xl p-3.5 text-xs text-[#2D4505] flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-[#35520D] shrink-0 mt-0.5" />
                          <div>
                            <strong className="block font-bold">Application Pending Admin Approval</strong>
                            <span>Your chit scheme application is currently being verified by the store admin. Monthly payment tracking and official receipts will be activated upon approval. Below is your 10-month installment plan preview.</span>
                          </div>
                        </div>
                      )}

                      {/* Month-Wise Payment Tracking Table */}
                      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-2xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-100 text-gray-700 uppercase font-extrabold tracking-wider border-b border-gray-200">
                              <th className="p-3.5 text-center w-16">Month</th>
                              <th className="p-3.5">Schedule</th>
                              <th className="p-3.5">Expected</th>
                              <th className="p-3.5">Paid</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5 text-right">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {monthList.map((mNum) => {
                              const isSchemeDone = (sch.remainingAmount !== undefined && sch.remainingAmount <= 0 && (sch.paidAmount || 0) > 0) || (sch.paidAmount !== undefined && sch.totalSchemeAmount && sch.paidAmount >= sch.totalSchemeAmount) || sch.stage === 'Completed';
                              const existingLog = (sch.monthlyPayments || []).find(p => p.monthNumber === mNum);
                              const isDirectlyPaid = existingLog && ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(existingLog.status);
                              const isPaid = isDirectlyPaid || isSchemeDone;
                              const paidDateStr = existingLog?.paidAt ? new Date(existingLog.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (isSchemeDone ? 'Settled' : '-');

                              return (
                                <tr key={mNum} className={`hover:bg-[#F7FBEF]/40 ${isPaid ? 'bg-[#F7FBEF]/30' : ''}`}>
                                  <td className="p-3.5 font-bold text-gray-500 text-center">
                                    #{mNum}
                                  </td>
                                  <td className="p-3.5 font-extrabold text-gray-900">
                                    Month {mNum}
                                  </td>
                                  <td className="p-3.5 font-semibold text-gray-700">
                                    ₹{monthlyTotal.toLocaleString()}
                                  </td>
                                  <td className="p-3.5 font-black text-[#2D4505]">
                                    {isPaid ? `₹${(existingLog?.amount || monthlyTotal).toLocaleString()}` : "₹0"}
                                  </td>
                                  <td className="p-3.5">
                                    {isPaid ? (
                                      <span className="bg-[#F7FBEF] text-[#2D4505] border border-[#A1CB35]/50 font-black text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-[#35520D]" />
                                        Paid ({paidDateStr})
                                      </span>
                                    ) : (
                                      <span className="bg-gray-100 text-gray-600 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-right">
                                    {isPaid ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveReceipt({
                                            receiptNumber: (existingLog?.receiptNumber ? existingLog.receiptNumber.replace(/^AB-CHIT-|^SY-CHIT-/i, "GPK-CHIT-") : `GPK-CHIT-000${mNum}`),
                                            applicationNumber: (sub?.applicationNumber ? sub.applicationNumber.replace(/^AB-APP-|^SY-APP-/i, "GPK-APP-") : `GPK-APP-${String(sub?._id).slice(-6)}`),
                                            customerName: sub?.name || "Customer",
                                            phone: sub?.phone || "",
                                            email: sub?.email,
                                            location: sub?.location,
                                            schemeName: sch.schemeName,
                                            personCount,
                                            monthlyAmountPerPerson: monthlyPerPerson,
                                            expectedMonthlyAmount: monthlyTotal,
                                            amountReceived: existingLog?.amount || monthlyTotal,
                                            paymentMethod: existingLog?.paymentMethod || "Cash",
                                            transactionId: existingLog?.transactionNumber || existingLog?.transactionId || "",
                                            paymentDate: existingLog?.paidAt || new Date(),
                                            paymentStatus: "PAID",
                                            installmentMonth: `Month ${mNum} / ${totalMonths}`,
                                            monthNumber: mNum,
                                            totalPaidTillDate: sch.paidAmount,
                                            remainingSchemeBalance: sch.remainingAmount,
                                            totalMonths,
                                            paidMonths: sch.monthsPaid,
                                            notes: existingLog?.notes,
                                            schemesBreakdown: allSiblingSchemes.map(s => {
                                              const rate = s.monthlyAmountPerPerson || s.monthlyAmount || 0;
                                              const count = s.personCount || 1;
                                              const subTotal = s.totalMonthlyAmount || (rate * count);
                                              return {
                                                schemeName: s.schemeName,
                                                rate,
                                                count,
                                                subTotal,
                                                monthlyAmountPerPerson: rate,
                                                personCount: count,
                                                totalMonthlyAmount: subTotal
                                              };
                                            }),
                                            totalPersons: allSiblingSchemes.reduce((sum, s) => sum + (s.personCount || 1), 0),
                                            combinedMonthlyPayable: allSiblingSchemes.reduce((sum, s) => sum + (s.totalMonthlyAmount || ((s.monthlyAmountPerPerson || 0) * (s.personCount || 1))), 0)
                                          });
                                        }}
                                        className="bg-[#A1CB35] hover:bg-[#8FB82B] text-gray-950 px-2.5 py-1 rounded-lg font-black text-[11px] inline-flex items-center gap-1 cursor-pointer transition-all shadow-2xs border border-[#8FB82B]/60"
                                        title="View Official Payment Receipt"
                                      >
                                        <FileText className="w-3 h-3" />
                                        <span>View Receipt</span>
                                      </button>
                                    ) : (
                                      <span className="text-gray-400 text-xs italic">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* ZOOM IMAGE BANNER MODAL */}
      {activeZoomImage && (
        <Dialog open={!!activeZoomImage} onOpenChange={(open) => !open && setActiveZoomImage(null)}>
          <DialogContent className="max-w-4xl p-4 bg-white rounded-3xl overflow-hidden font-sans border-0 shadow-2xl">
            <div className="relative w-full overflow-hidden rounded-2xl bg-gray-900 flex items-center justify-center max-h-[85vh]">
              <img
                src={activeZoomImage.url}
                alt="Banner Large View"
                className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* OFFICIAL PAYMENT RECEIPT MODAL (VIEW / DOWNLOAD PDF / PRINT) */}
      <ChitReceiptModal
        isOpen={!!activeReceipt}
        onClose={() => setActiveReceipt(null)}
        receipt={activeReceipt}
      />

      <UserFooter />
    </div>
  );
};

export default ChitScheme;
