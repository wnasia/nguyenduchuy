import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon, ChevronDown } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import huyLogo from "@/assets/huy-logo.png";
import { useTheme } from "@/hooks/useTheme";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, signOut, loading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);
        if (!error && count !== null) setUnreadCount(count);
      };
      fetchUnreadCount();
      const channel = supabase
        .channel("notifications-count")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          () => fetchUnreadCount()
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  const navigation = [
    { name: "Công nghệ", href: "/?topic=cong-nghe" },
    { name: "Đời sống", href: "/?topic=doi-song" },
    { name: "Kinh tế", href: "/?topic=kinh-te" },
    { name: "Giải trí", href: "/?topic=giai-tri" },
    { name: "Thể thao", href: "/?topic=the-thao" },
    { name: "Câu chuyện", href: "/stories" },
  ];

  const utilityItems: { id: string; name: string; href?: string }[] = [
    { id: "gallery", name: "Thư viện ảnh", href: "/gallery" },
    { id: "videos", name: "Video", href: "/videos" },
    { id: "lunar-calendar", name: "Lịch âm dương" },
    { id: "horoscope", name: "Xem tử vi" },
    { id: "gold-price", name: "Giá vàng" },
    { id: "stock-market", name: "Chứng khoán VN" },
    { id: "flight-booking", name: "Vé máy bay" },
    { id: "crypto", name: "Crypto Tracker" },
    { id: "mining-explorer", name: "Mining Explorer" },
    { id: "tax-debt", name: "Tra cứu nợ thuế" },
  ];

  const currentPathSearch = location.pathname + location.search;
  const isActive = (path: string) => {
    if (path.includes("?")) return currentPathSearch === path;
    return location.pathname === path;
  };
  const utilitiesActive =
    location.pathname.startsWith("/utilities") ||
    location.pathname.startsWith("/gallery") ||
    location.pathname.startsWith("/videos");

  const handleSignOut = async () => {
    try { await signOut(); } catch (error) { console.error("Error signing out:", error); }
  };

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleNavigateToModule = (module: string) => {
    navigate("/dashboard", { state: { module } });
  };

  const isHome = location.pathname === "/";

  return (
    <div className={isHome ? "relative w-full px-3 sm:px-4 lg:px-6 pt-1 pb-3" : "absolute top-0 left-0 right-0 z-50 px-3 sm:px-4 lg:px-6 pt-3 pb-2"}>
      <nav className={`max-w-7xl mx-auto px-2 sm:px-4 h-16 flex items-center justify-between ${isHome ? "" : "bg-background/70 backdrop-blur-md border border-border/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)]"}`}>
        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <a
            href="/"
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                window.location.reload();
              }
            }}
            className="flex items-center group"
          >
            <img
              src={huyLogo}
              alt="HUY"
              className={`h-9 w-auto object-contain group-hover:scale-105 transition-transform duration-200 ${isHome ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" : ""}`}
            />
          </a>
        </div>

        {/* Right controls — always hamburger style */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className={`p-2 rounded-full transition-colors ${isHome ? "text-white/90 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Button variant="ghost" size="icon" className={`rounded-full relative ${isHome ? "text-white hover:text-white hover:bg-white/10" : ""}`} onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            {user && unreadCount > 0 && !isOpen && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
            )}
          </Button>
        </div>
      </nav>


      {/* Mobile menu */}
      {isOpen && (
        <div className="max-w-7xl mx-auto mt-2 bg-background border border-border rounded-2xl shadow-xl animate-fade-in overflow-hidden">
          <div className="p-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-4 py-2.5 text-base font-medium rounded-xl transition-colors ${
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-muted"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            <Link
              to="/utilities"
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2.5 text-base font-medium rounded-xl transition-colors ${
                utilitiesActive ? "text-primary bg-primary/10" : "text-foreground hover:text-primary hover:bg-muted"
              }`}
            >
              {t("common.utilities") || "Tiện ích"}
            </Link>
            <div className="pl-3 space-y-0.5">
              {utilityItems.map((u) => (
                <Link
                  key={u.id}
                  to={u.href ?? `/utilities?tool=${u.id}`}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                >
                  {u.name}
                </Link>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : user ? (
              <div className="space-y-1 pt-2 mt-2 border-t border-border">
                <div className="px-3 py-2 flex items-center space-x-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
                    <AvatarFallback>{getUserInitials(user.user_metadata?.full_name || user.email)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start rounded-xl">Dashboard</Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start rounded-xl" onClick={() => { handleNavigateToModule("profile"); setIsOpen(false); }}>Profile</Button>
                <Button variant="ghost" className="w-full justify-start rounded-xl" onClick={() => { handleNavigateToModule("profile"); setIsOpen(false); }}>Wallet</Button>
                <Button variant="ghost" className="w-full justify-start rounded-xl" onClick={() => { handleNavigateToModule("notifications"); setIsOpen(false); }}>
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">{unreadCount}</Badge>
                  )}
                </Button>
                <Button variant="ghost" className="w-full justify-start rounded-xl" onClick={() => { handleSignOut(); setIsOpen(false); }}>Logout</Button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="block px-2 pt-2">
                <Button className="w-full rounded-full h-11 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                  Đăng nhập
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
