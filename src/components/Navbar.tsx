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

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className={`p-2 rounded-full transition-colors ${isHome ? "text-white/90 hover:text-white hover:bg-white/15" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Login / User — outside dropdown */}
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`relative h-10 w-10 rounded-full p-0 ${isHome ? "ring-2 ring-white/40 hover:ring-white/70" : ""}`}>
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
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="w-full">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigateToModule("profile")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigateToModule("notifications")}>
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] px-1.5 text-xs">{unreadCount}</Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button
                variant="ghost"
                className={`rounded-full h-10 px-5 font-bold shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all ${
                  isHome
                    ? "!bg-white !text-blue-600 hover:!bg-white hover:!text-blue-700 ring-2 ring-white/60 hover:ring-white"
                    : "!bg-primary !text-primary-foreground hover:!bg-primary/90"
                }`}
              >
                Đăng nhập
              </Button>
            </Link>
          )}

          {/* Hamburger — always visible, white on home with dark pill for contrast */}
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full h-11 w-11 ${
              isHome
                ? "text-white bg-black/35 hover:bg-black/55 hover:text-white backdrop-blur-md ring-1 ring-white/30 shadow-lg"
                : "text-foreground hover:bg-muted"
            }`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? <X className="h-6 w-6" strokeWidth={2.75} /> : <Menu className="h-6 w-6" strokeWidth={2.75} />}
          </Button>
        </div>
      </nav>


      {/* Mega menu panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 animate-fade-in" onClick={() => setIsOpen(false)} />
          <div className="absolute right-3 sm:right-4 lg:right-6 top-full mt-2 w-[min(560px,calc(100vw-1.5rem))] z-50 bg-popover border border-border rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {/* Categories column */}
              <div className="p-4">
                <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Chuyên mục
                </div>
                <div className="space-y-0.5">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-3 py-2 text-[15px] rounded-lg transition-colors ${
                        isActive(item.href)
                          ? "text-primary bg-primary/10 font-semibold"
                          : "text-foreground hover:bg-muted hover:text-primary"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Utilities column */}
              <div className="p-4">
                <div className="px-2 pb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("common.utilities") || "Tiện ích"}
                  </span>
                  <Link
                    to="/utilities"
                    onClick={() => setIsOpen(false)}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Xem tất cả →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-0.5">
                  {utilityItems.map((u) => (
                    <Link
                      key={u.id}
                      to={u.href ?? `/utilities?tool=${u.id}`}
                      onClick={() => setIsOpen(false)}
                      className="px-3 py-2 text-sm text-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors truncate"
                    >
                      {u.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {user && (
              <div className="border-t border-border bg-muted/30 px-4 py-3 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
                  <AvatarFallback>{getUserInitials(user.user_metadata?.full_name || user.email)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.user_metadata?.full_name || "User"}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button size="sm" variant="outline" className="rounded-full">Dashboard</Button>
                </Link>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default Navbar;
