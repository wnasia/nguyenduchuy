 import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Bell, Sun, Moon } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import LanguageSelector from "./LanguageSelector";
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

  // Fetch unread notifications count
  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      };

      fetchUnreadCount();

      // Subscribe to realtime updates
      const channel = supabase
        .channel("notifications-count")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchUnreadCount();
          }
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

  const utilityItems = [
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

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleNavigateToModule = (module: string) => {
    navigate("/dashboard", { state: { module } });
  };

  return (
     <nav className="bg-background/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo - Responsive sizing */}
          <div className="flex items-center flex-shrink-0">
            <a 
              href="/" 
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  window.location.reload();
                }
              }}
              className="flex items-center group"
            >
              <img 
                src={huyLogo} 
                alt="HUY" 
                className="h-9 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-200" 
              />
            </a>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                     ? "text-primary bg-primary/10"
                     : "text-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Utilities dropdown (hover) */}
            <div className="relative group">
              <Link
                to="/utilities"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors inline-flex items-center ${
                  isActive("/utilities")
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                {t("common.utilities") || "Tiện ích"}
              </Link>
              <div className="absolute left-0 top-full pt-2 w-56 hidden group-hover:block z-50">
                <div className="bg-popover border border-border rounded-md shadow-lg py-1">
                  {utilityItems.map((u) => (
                    <Link
                      key={u.id}
                      to={u.href ?? `/utilities?tool=${u.id}`}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      {u.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

             {/* Dark Mode Toggle - Icon only */}
             <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="p-2 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            ) : user ? (
              <div className="flex items-center gap-2">
                {/* User Avatar Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
                        <AvatarFallback>
                          {getUserInitials(user.user_metadata?.full_name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-popover" align="end" forceMount>
                    <div className="px-3 py-2 border-b">
                      <div className="text-sm font-medium">{user.user_metadata?.full_name || 'User'}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    <DropdownMenuItem onClick={() => handleNavigateToModule("profile")}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigateToModule("profile")}>
                      Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigateToModule("notifications")}>
                      Notifications
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] px-1.5 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="w-full">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link to="/login">
                 <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                   Đăng nhập
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
             <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="p-2 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        {isOpen && (
           <div className="md:hidden bg-background border-t border-border animate-fade-in">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? "text-primary bg-primary/10"
                       : "text-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile: Utilities group */}
              <Link
                to="/utilities"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  isActive("/utilities")
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                {t("common.utilities") || "Tiện ích"}
              </Link>
              <div className="pl-4 space-y-1">
                {utilityItems.map((u) => (
                  <Link
                    key={u.id}
                    to={u.href ?? `/utilities?tool=${u.id}`}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                  >
                    {u.name}
                  </Link>
                ))}
              </div>
              
              
              {loading ? (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : user ? (
                 <div className="space-y-1 pt-2 border-t border-border">
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
                        <AvatarFallback>
                          {getUserInitials(user.user_metadata?.full_name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{user.user_metadata?.full_name || 'User'}</div>
                         <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => {
                      handleNavigateToModule("profile");
                      setIsOpen(false);
                    }}
                  >
                    Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => {
                      handleNavigateToModule("profile");
                      setIsOpen(false);
                    }}
                  >
                    Wallet
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => {
                      handleNavigateToModule("notifications");
                      setIsOpen(false);
                    }}
                  >
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                 <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                   Đăng nhập
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
