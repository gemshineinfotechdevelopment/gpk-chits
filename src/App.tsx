import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
// import Index from "./pages/Index";
// import ComboPacks from "./pages/ComboPacks";
// import Catalog from "./pages/Catalog";
// import ProductDetail from "./pages/ProductDetail";
// import Cart from "./pages/Cart";
// import CartDrawer from "./components/cart/CartDrawer";
// import WishlistDrawer from "./components/wishlist/WishlistDrawer";
// import SafetyTips from "./pages/SafetyTips";
// import Contact from "./pages/Contact";
// import QuickEnquiry from "./pages/QuickEnquiry";
// import ProductList from "./pages/ProductList";
// import AboutUs from "./pages/AboutUs";
import ChitScheme from "./pages/ChitScheme";
// import MyEnquiry from "./pages/MyEnquiry";
// import MyAccount from "./pages/MyAccount";
// import Terms from "./pages/Terms";
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
// import AdminBrands from "./pages/admin/AdminBrands";
// import AdminProducts from "./pages/admin/AdminProducts";
// import AdminOrders from "./pages/admin/AdminOrders";
// import AdminCategories from "./pages/admin/AdminCategories";
// import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminChitScheme from "./pages/admin/AdminChitScheme";
import AdminSettings from "./pages/admin/AdminSettings";
// import AdminReports from "./pages/admin/AdminReports";
// import AdminContent from "./pages/admin/AdminContent";
// import AdminPriceList from "./pages/admin/AdminPriceList";
// import AdminPageContent from "./pages/admin/AdminPageContent";

// import NotFound from "./pages/NotFound";

import { SettingsProvider } from "@/context/SettingsContext";
import ScrollToTop from "@/components/ScrollToTop";
import GlobalLoginModal from "@/components/auth/GlobalLoginModal";
import ErrorBoundary from "@/components/ErrorBoundary";
// import FloatingCartTotal from "@/components/FloatingCartTotal";
// import FloatingQuickEnquiry from "@/components/FloatingQuickEnquiry";

const queryClient = new QueryClient();

const AdminEntryRoute = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FBFDF8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A1CB35] mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold text-xs">Loading admin session...</p>
        </div>
      </div>
    );
  }
  return isAuthenticated && isAdmin ? (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  ) : (
    <AdminLogin />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SiteSettingsProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <SettingsProvider>
                <Toaster />
                <Sonner />
                <ScrollToTop />
                <GlobalLoginModal />
                {/* <FloatingCartTotal /> */}
                {/* <FloatingQuickEnquiry /> */}
                <ErrorBoundary>
                  <Routes>
                    {/* Root redirects to Chit Scheme */}
                  <Route path="/" element={<Navigate to="/chit-scheme" replace />} />
                  {/* <Route path="/" element={<Index />} /> */}
                  {/* <Route path="/combo-packs" element={<ComboPacks />} /> */}
                  <Route path="/chit-scheme" element={<ChitScheme />} />
                  {/* <Route path="/my-enquiry" element={<MyEnquiry />} /> */}
                  {/* <Route path="/my-account" element={<MyAccount />} /> */}
                  {/* <Route path="/catalog" element={<Catalog />} /> */}
                  {/* <Route path="/cart" element={<Cart />} /> */}
                  {/* <Route path="/view-cart" element={<Navigate to="/cart" replace />} /> */}
                  {/* <Route path="/product/:id" element={<ProductDetail />} /> */}
                  {/* <Route path="/safety-tips" element={<SafetyTips />} /> */}
                  {/* <Route path="/contact" element={<Contact />} /> */}
                  {/* <Route path="/quick-enquiry" element={<QuickEnquiry />} /> */}
                  {/* <Route path="/price-list" element={<ProductList />} /> */}
                  {/* <Route path="/quick-enquery" element={<Navigate to="/quick-enquiry" replace />} /> */}
                  {/* <Route path="/about" element={<AboutUs />} /> */}
                  {/* <Route path="/about-us" element={<AboutUs />} /> */}
                  {/* <Route path="/terms" element={<Terms />} /> */}
                  {/* <Route path="/terms-and-conditions" element={<Terms />} /> */}
                  {/* <Route path="/privacy-policy" element={<Terms defaultTab="privacy" />} /> */}
                  
                  {/* ── Secret Admin Route: ONLY accessible via /admin-dashboard-panel ── */}
                  <Route path="/admin-dashboard-panel" element={<AdminEntryRoute />} />
                  <Route
                    path="/admin-dashboard-panel/chit-scheme"
                    element={
                      <ProtectedRoute>
                        <AdminChitScheme />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-dashboard-panel/settings"
                    element={
                      <ProtectedRoute>
                        <AdminSettings />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/admin-dashboard-panel/*" element={<Navigate to="/admin-dashboard-panel" replace />} />

                  {/* ── Block /admin and all public guesses: redirect to /chit-scheme ── */}
                  <Route path="/admin" element={<Navigate to="/chit-scheme" replace />} />
                  <Route path="/admin/*" element={<Navigate to="/chit-scheme" replace />} />
                  <Route path="/admin-login" element={<Navigate to="/chit-scheme" replace />} />
                  <Route path="/admin-panel" element={<Navigate to="/chit-scheme" replace />} />
                  <Route path="/admin/login" element={<Navigate to="/chit-scheme" replace />} />

                  <Route path="*" element={<Navigate to="/chit-scheme" replace />} />
                </Routes>
                </ErrorBoundary>
                {/* <CartDrawer /> */}
                {/* <WishlistDrawer /> */}
              </SettingsProvider>
            </WishlistProvider>
          </CartProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
