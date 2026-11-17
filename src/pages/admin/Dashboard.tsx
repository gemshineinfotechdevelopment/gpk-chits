import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { Link } from "react-router-dom";
import {
  Gift, Users, CheckCircle2, Clock, AlertCircle, ArrowRight,
  TrendingUp, DollarSign, Wallet, Sparkles, RefreshCw, ChevronRight,
  Calendar, Check, UserCheck, ShieldAlert
} from "lucide-react";
import {
  getChitSchemes,
  getChitSubscriptions,
  ChitSchemeItem,
  ChitSubscriptionItem
} from "@/lib/api";
import { toast } from "sonner";

export const Dashboard: React.FC = () => {
  const [schemes, setSchemes] = useState<ChitSchemeItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<ChitSubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [schemesData, subsData] = await Promise.all([
        getChitSchemes().catch((err) => {
          console.error("Failed to load schemes for dashboard:", err);
          return [];
        }),
        getChitSubscriptions().catch((err) => {
          console.error("Failed to load subscriptions for dashboard:", err);
          return [];
        })
      ]);

      setSchemes(Array.isArray(schemesData) ? schemesData : []);
      setSubscriptions(Array.isArray(subsData) ? subsData : []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      toast.error("Failed to refresh dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute Chit Scheme KPIs
  const activeSchemes = schemes.filter(s => s.isActive !== false && s.status !== 'Closed');
  const totalApplications = subscriptions.length;
  
  const pendingSubscriptions = subscriptions.filter(
    s => s.status === 'Pending' || s.approvalStatus === 'Pending'
  );
  const pendingCount = pendingSubscriptions.length;

  const approvedSubscriptions = subscriptions.filter(
    s => s.status === 'Approved' || s.status === 'Paid'
  );
  const approvedCount = approvedSubscriptions.length;

  // Total enrolled persons across approved/active applications
  const totalPersonsEnrolled = subscriptions.reduce((sum, sub) => {
    if (sub.status === 'Rejected') return sum;
    if (Array.isArray(sub.schemes) && sub.schemes.length > 0) {
      return sum + sub.schemes.reduce((acc, s) => acc + (s.personCount || 1), 0);
    }
    return sum + (sub.totalPersons || sub.personCount || 1);
  }, 0);

  // Expected monthly collection (sum of monthly amount * persons for all active/approved applications)
  const totalMonthlyExpected = subscriptions.reduce((sum, sub) => {
    if (sub.status === 'Rejected') return sum;
    if (Array.isArray(sub.schemes) && sub.schemes.length > 0) {
      return sum + sub.schemes.reduce((acc, s) => {
        const monthly = s.totalMonthlyAmount || ((s.monthlyAmountPerPerson || s.monthlyAmount || 0) * (s.personCount || 1));
        return acc + monthly;
      }, 0);
    }
    return sum + (sub.combinedMonthlyAmount || sub.monthlyAmount || 0);
  }, 0);

  // Total collected money so far (from payment logs)
  const totalCollectedSoFar = subscriptions.reduce((sum, sub) => {
    if (sub.totalPaidAmount !== undefined && sub.totalPaidAmount > 0) {
      return sum + sub.totalPaidAmount;
    }
    const payments = sub.monthlyPayments || [];
    const subPaid = payments
      .filter(p => ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(p.status))
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    return sum + subPaid;
  }, 0);

  // Recent 5 applications sorted by creation
  const recentSubscriptions = [...subscriptions]
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.date || 0).getTime();
      const db = new Date(b.createdAt || b.date || 0).getTime();
      return db - da;
    })
    .slice(0, 6);

  // Scheme subscriber distribution
  const schemeStats = schemes.map(sch => {
    const schemeName = sch.title || sch.schemeName || '';
    const matchingSubs = subscriptions.filter(sub => {
      if (sub.status === 'Rejected') return false;
      if (Array.isArray(sub.schemes) && sub.schemes.length > 0) {
        return sub.schemes.some(s => s.schemeName === schemeName);
      }
      return sub.schemeName === schemeName || sub.chitSchemeName === schemeName;
    });

    const enrolledPersons = matchingSubs.reduce((sum, sub) => {
      if (Array.isArray(sub.schemes) && sub.schemes.length > 0) {
        const item = sub.schemes.find(s => s.schemeName === schemeName);
        return sum + (item?.personCount || 1);
      }
      return sum + (sub.totalPersons || sub.personCount || 1);
    }, 0);

    const monthlyAmount = sch.monthlyAmount || 0;
    const expectedIntake = enrolledPersons * monthlyAmount;

    return {
      ...sch,
      enrolledSubscribers: matchingSubs.length,
      enrolledPersons,
      expectedIntake
    };
  });

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen bg-gray-50/50">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-[#7A1416] p-2 rounded-xl">
                  <Gift className="w-5 h-5" />
                </span>
                <h1 className="font-display text-2xl font-black text-[#2A1B54]">
                  Dashboard
                </h1>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Overview of savings schemes, member registrations, and monthly collection progress
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                title="Refresh Dashboard"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#7A1416]" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <Link
                to="/admin/chit-scheme"
                className="bg-[#7A1416] hover:bg-[#5C0F11] text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 uppercase tracking-wider"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Manage Schemes</span>
              </Link>
            </div>
          </div>

          {/* Pending Approvals Alert Banner */}
          {pendingCount > 0 && (
            <div className="mb-6 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-orange-500/10 border-2 border-amber-400/80 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                  <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-amber-950">
                    {pendingCount} New Chit Application{pendingCount > 1 ? "s" : ""} Waiting for Approval!
                  </h3>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">
                    Customers have submitted enrollment requests. Please review and approve their applications.
                  </p>
                </div>
              </div>

              <Link
                to="/admin/chit-scheme"
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 uppercase tracking-wider"
              >
                <span>Review Now ({pendingCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Main 5 KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
            {/* KPI 1: Expected Monthly Collection */}
            <div className="bg-white border border-gray-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Monthly Expected
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
                  ₹{totalMonthlyExpected.toLocaleString()}
                </p>
                <span className="text-[10px] text-gray-400 font-medium">Per month intake</span>
              </div>
            </div>

            {/* KPI 2: Total Collected */}
            <div className="bg-white border border-gray-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Collected So Far
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#2A1B54] tracking-tight">
                  ₹{totalCollectedSoFar.toLocaleString()}
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold">Verified payments</span>
              </div>
            </div>

            {/* KPI 3: Total Enrolled Persons */}
            <div className="bg-white border border-gray-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Total Persons
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {totalPersonsEnrolled}
                </p>
                <span className="text-[10px] text-gray-400 font-medium">Across all schemes</span>
              </div>
            </div>

            {/* KPI 4: Active Schemes */}
            <div className="bg-white border border-gray-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Total Schemes
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {schemes.length}
                </p>
                <span className="text-[10px] text-purple-700 font-semibold">{activeSchemes.length} Active in catalog</span>
              </div>
            </div>

            {/* KPI 5: Applications Status */}
            <div className="bg-white border border-gray-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Applications
                </span>
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#7A1416] flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {totalApplications}
                </p>
                <span className="text-[10px] text-emerald-600 font-bold">{approvedCount} Approved</span>
                {pendingCount > 0 && (
                  <span className="text-[10px] text-amber-600 font-black ml-1.5">• {pendingCount} Pending</span>
                )}
              </div>
            </div>
          </div>

          {/* Two-Column Analytics & Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Left 7 Columns: Scheme Overview Cards */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#7A1416]" />
                  <h2 className="font-extrabold text-sm sm:text-base text-gray-900 uppercase tracking-wide">
                    Chit Scheme Overview ({schemes.length})
                  </h2>
                </div>
                <Link
                  to="/admin/chit-scheme"
                  className="text-xs text-[#7A1416] font-extrabold hover:underline flex items-center gap-1"
                >
                  <span>Edit Schemes</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {schemeStats.map((sch) => (
                  <div
                    key={sch._id || sch.id}
                    className="bg-white border border-gray-200 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                          {sch.totalMonths || sch.numberOfMonths || 10} Months
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          sch.status === 'Active' || sch.isActive !== false
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {sch.status || 'Active'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm text-[#2A1B54] line-clamp-1" title={sch.title || sch.schemeName}>
                        {sch.title || sch.schemeName}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-0.5">
                        {sch.description || "Diwali monthly savings scheme"}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-3 text-xs space-y-1.5 border border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Monthly / Person:</span>
                        <strong className="text-emerald-700 font-extrabold">₹{(sch.monthlyAmount || 0).toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Enrolled Persons:</span>
                        <strong className="text-gray-900 font-bold">{sch.enrolledPersons} Members</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-200">
                        <span className="text-gray-600 font-bold">Monthly Intake:</span>
                        <strong className="text-[#2A1B54] font-black">₹{sch.expectedIntake.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Columns: Recent Applications */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#7A1416]" />
                  <h2 className="font-extrabold text-sm sm:text-base text-gray-900 uppercase tracking-wide">
                    Recent Applications
                  </h2>
                </div>
                <Link
                  to="/admin/chit-scheme"
                  className="text-xs text-[#7A1416] font-extrabold hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-2xs divide-y divide-gray-100">
                {recentSubscriptions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 font-medium">
                    No customer applications yet.
                  </div>
                ) : (
                  recentSubscriptions.map((sub) => {
                    const enrolledCount = Array.isArray(sub.schemes) && sub.schemes.length > 0
                      ? sub.schemes.reduce((acc, s) => acc + (s.personCount || 1), 0)
                      : (sub.totalPersons || sub.personCount || 1);

                    const monthly = sub.combinedMonthlyAmount || sub.monthlyAmount || 0;

                    return (
                      <div key={sub._id || sub.id} className="py-3 flex items-center justify-between gap-3 first:pt-1 last:pb-1">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-[#2A1B54] truncate">
                              {sub.name || sub.customerName || "Customer"}
                            </h4>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                              sub.status === 'Approved' || sub.status === 'Paid'
                                ? "bg-emerald-100 text-emerald-800"
                                : sub.status === 'Pending'
                                ? "bg-amber-100 text-amber-900"
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              {sub.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">
                            📞 +91 {sub.phone} • {enrolledCount} Person{enrolledCount > 1 ? "s" : ""}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-emerald-700">
                            ₹{monthly.toLocaleString()}/mo
                          </div>
                          <Link
                            to="/admin/chit-scheme"
                            className="text-[10px] text-[#7A1416] font-bold hover:underline"
                          >
                            Details →
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/admin/chit-scheme"
                  className="bg-white hover:bg-amber-50/50 border border-gray-200 hover:border-amber-300 rounded-2xl p-3.5 transition-all flex items-center gap-2.5 shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#7A1416] flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-gray-900 group-hover:text-[#7A1416]">
                      Approvals
                    </h5>
                    <p className="text-[10px] text-gray-400 font-medium">Verify requests</p>
                  </div>
                </Link>

                <Link
                  to="/chit-scheme"
                  target="_blank"
                  className="bg-white hover:bg-red-50/50 border border-gray-200 hover:border-red-300 rounded-2xl p-3.5 transition-all flex items-center gap-2.5 shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#7A1416] flex items-center justify-center font-bold shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-gray-900 group-hover:text-[#7A1416]">
                      Store View
                    </h5>
                    <p className="text-[10px] text-gray-400 font-medium">Customer portal</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
