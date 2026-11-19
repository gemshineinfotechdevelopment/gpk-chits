import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard, Package, FolderTree, ShoppingBag, Users, Settings, Tag, BarChart3, Gift, Image, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import companyLogo from "@/assets/gpk-logo.svg";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  // { label: "Brands", icon: Tag, href: "/admin/brands" },
  // { label: "Products", icon: Package, href: "/admin/products" },
  // { label: "Categories", icon: FolderTree, href: "/admin/categories" },
  // { label: "Orders", icon: ShoppingBag, href: "/admin/orders" },
  // { label: "Customers", icon: Users, href: "/admin/customers" },
  { label: "Chit Scheme", icon: Gift, href: "/admin/chit-scheme" },
  // { label: "Reports", icon: BarChart3, href: "/admin/reports" },
  // { label: "Page Content", icon: Image, href: "/admin/page-content" },
  // { label: "Content", icon: Settings, href: "/admin/content" },
  // { label: "Price List", icon: FileText, href: "/admin/price-list" },
];

const AdminNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin-dashboard-panel");
  };

  return (
    <nav className="lg:hidden sticky top-0 z-50 border-b border-border bg-sidebar">
      <div className="flex items-center justify-between p-4">
        <Link to="/admin" className="flex items-center gap-2.5">
          <img src={companyLogo} alt="GPK Crackers" className="h-10 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="font-display font-black text-[#A1CB35] text-base leading-tight">GPK CRACKERS</span>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Admin Panel</span>
          </div>
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-white hover:bg-sidebar-accent hover:text-white rounded-lg transition-colors"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-0 z-[60] ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        {/* Backdrop overlay */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer content */}
        <div
          className={`absolute top-0 left-0 h-full w-[75vw] max-w-[300px] bg-sidebar shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="p-4 border-b border-border flex justify-between items-center bg-sidebar-accent/50">
            <div className="flex items-center gap-2.5">
              <img src={companyLogo} alt="GPK Crackers" className="h-10 w-auto object-contain" />
              <div className="flex flex-col">
                <span className="font-display font-black text-[#A1CB35] text-base leading-tight">GPK CRACKERS</span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Admin</span>
              </div>
            </div>
            <button onClick={() => setMenuOpen(false)} className="p-2 text-sidebar-foreground hover:text-white hover:bg-sidebar-accent rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-1.5 overflow-y-auto scrollbar-thin flex-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                    isActive
                      ? "bg-[#A1CB35] text-gray-950 font-black shadow-xs"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-border mt-auto bg-sidebar">
            <Link
              to="/chit-scheme"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center px-3 py-2.5 mb-3 rounded-xl text-xs font-semibold text-gray-400 hover:text-[#A1CB35] hover:bg-white/10 transition-colors"
            >
              ← Back to Chit Scheme
            </Link>

            <Button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              variant="default"
              className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-rose-500/20 text-gray-300 hover:text-rose-300 border border-white/10 text-xs font-bold rounded-xl"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
