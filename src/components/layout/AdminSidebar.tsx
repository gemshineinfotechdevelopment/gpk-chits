import companyLogo from "@/assets/gpk-logo.svg";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Users, Settings, ArrowLeft, LogOut, Menu, Tag, BarChart3, Gift, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin-dashboard-panel" },
  { label: "Chit Scheme", icon: Gift, href: "/admin-dashboard-panel/chit-scheme" },
  { label: "Settings", icon: Settings, href: "/admin-dashboard-panel/settings" },
];

interface AdminSidebarProps {
  activeTab?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return sessionStorage.getItem("adminSidebarCollapsed") === "true";
  });
  
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    sessionStorage.setItem("adminSidebarCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("adminSidebarScroll");
    if (savedScroll && navRef.current) {
      navRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem("adminSidebarScroll", String(e.currentTarget.scrollTop));
  };

  const handleLogout = () => {
    logout();
    navigate("/admin-dashboard-panel");
  };

  return (
    <>
      {/* Fixed Sidebar */}
      <aside className={cn(
        "border-r border-border bg-sidebar h-screen fixed top-0 left-0 hidden lg:flex flex-col transition-all duration-300 z-40",
        isCollapsed ? "w-20" : "w-64"
      )}>
      <div className={cn("p-4 shrink-0 flex flex-col gap-2", !isCollapsed && "p-6")}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <Link to="/admin" className="flex items-center gap-2.5 overflow-hidden">
              <img src={companyLogo} alt="GPK Crackers" className="h-8 w-auto object-contain shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-display text-sm font-black text-[#A1CB35] whitespace-nowrap leading-tight">GPK CRACKERS</span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Admin Panel</span>
              </div>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="shrink-0 h-8 w-8 text-white hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        {!isCollapsed ? (
          <Link to="/chit-scheme" className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#A1CB35] transition-colors mt-1 font-medium">
            <ArrowLeft className="h-3 w-3 shrink-0" /> Back to Chit Scheme
          </Link>
        ) : (
          <Link to="/chit-scheme" className="flex items-center justify-center mt-1" title="Back to Chit Scheme">
            <ArrowLeft className="h-4 w-4 text-gray-400 hover:text-[#A1CB35] transition-colors" />
          </Link>
        )}
      </div>
      
      <nav 
        ref={navRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 space-y-1 pb-4 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                isCollapsed ? "justify-center" : "gap-3",
                isActive
                  ? "bg-[#A1CB35] text-gray-950 font-black shadow-xs"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      
      <div className={cn("shrink-0 border-t border-border mt-auto", isCollapsed ? "p-3 flex justify-center" : "p-4")}>
        <Button 
          onClick={handleLogout} 
          variant="default" 
          className={cn("flex items-center justify-center bg-white/10 hover:bg-rose-500/20 text-gray-300 hover:text-rose-300 border border-white/10 transition-colors font-bold text-xs rounded-xl", isCollapsed ? "w-10 h-10 p-0" : "w-full gap-2")}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
      
      {/* Spacer to push main content to the right so it doesn't get hidden under the fixed sidebar */}
      <div className={cn(
        "shrink-0 hidden lg:block transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )} />
    </>
  );
};

export default AdminSidebar;
