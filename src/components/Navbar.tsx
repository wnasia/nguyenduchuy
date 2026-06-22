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

  return (
    <div className="sticky top-0 z-50 px-3 sm:px-4 lg:px-6 pt-3 pb-2 bg-background/60 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto bg-background border border-border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
              className="h-9 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </a>
        </div>

        {/* Desktop categories */}
        <ul className="hidden lg:flex items-center gap-x-7 h-full">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.name} className="h-full flex items-center relative">
                <Link
                  to={item.href}
                  className={`text-[15px] transition-colors duration-200 relative ${
                    active
                      ? "font-semibold text-foreground"
                      : "font-medium text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.name}
                  {active && (
                    <span className="absolute -bottom-[22px] left-0 w-full h-[3px] rounded-full bg-gradient-to-r from-primary to-primary/60" />
                  )}
                </Link>
              </li>
            );
          })}

          {/* Tiện ích dropdown */}
          <li className="relative group h-full flex items-center">
            <Link
              to="/utilities"
              className={`flex items-center gap-1.5 text-[15px] transition-colors duration-200 relative ${
                utilitiesActive
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("common.utilities") || "Tiện ích"}
              <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
              {utilitiesActive && (
                <span className="absolute -bottom-[22px] left-0 w-[calc(100%-20px)] h-[3px] rounded-full bg-gradient-to-r from-primary to-primary/60" />
              )}
            </Link>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-60 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50">
              <div className="bg-popover border border-border rounded-xl shadow-2xl overflow-hidden py-2">
                {utilityItems.map((u) => (
                  <Link
                    key={u.id}
                    to={u.href ?? `/utilities?tool=${u.id}`}
                    className="block px-5 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors"
                  >
                    {u.name}
                  </Link>
                ))}
              </div>
            </div>
          </li>
        </ul>

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
                    <AvatarFallback>{getUserInitials(user.user_metadata?.full_name || user.email)}</AvatarFallback>
                  </Avatar>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover" align="end" forceMount>
                <div className="px-3 py-2 border-b">
                  <div className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <DropdownMenuItem onClick={() => handleNavigateToModule("profile")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigateToModule("profile")}>Wallet</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigateToModule("notifications")}>
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] px-1.5 text-xs">{unreadCount}</Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="w-full">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button className="rounded-full px-6 h-10 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                Đăng nhập
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile right controls */}
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden max-w-7xl mx-auto mt-2 bg-background border border-border rounded-2xl shadow-xl animate-fade-in overflow-hidden">
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
