import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import huyLogo from "@/assets/huy-logo.png";
import HeaderUserControls from "@/components/HeaderUserControls";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { t } = useI18n();
  const { user } = useAuth();

  const navigation = [
    { name: "Công nghệ", href: "/?topic=cong-nghe" },
    { name: "Đời sống", href: "/?topic=doi-song" },
    { name: "Kinh tế", href: "/?topic=kinh-te" },
    { name: "Giải trí", href: "/?topic=giai-tri" },
    { name: "Thể thao", href: "/?topic=the-thao" },
  ];

  const utilityItems: { id: string; name: string; href?: string }[] = [
    { id: "tax-code", name: "Tra cứu mã số thuế" },
    { id: "learn-english", name: "Luyện phát âm tiếng Anh" },
    { id: "lunar-calendar", name: "Lịch âm" },
    { id: "horoscope", name: "Xem tử vi" },
    { id: "gold-price", name: "Giá vàng" },
    { id: "flight-booking", name: "Vé máy bay" },
    { id: "crypto", name: "Thị trường Crypto" },
    { id: "stock-market", name: "Chứng khoán" },
    { id: "mining-explorer", name: "Mining Explorer" },
    { id: "gallery", name: "Thư viện ảnh", href: "/gallery" },
    { id: "videos", name: "Video", href: "/videos" },
  ];

  const currentPathSearch = location.pathname + location.search;
  const isActive = (path: string) => {
    if (path.includes("?")) return currentPathSearch === path;
    return location.pathname === path;
  };

  const isHome = location.pathname === "/";

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Track scroll for sticky/condensed state on home
  useEffect(() => {
    if (!isHome) { setScrolled(false); return; }
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Container styling
  // - Home + top: absolute over banner, transparent (logo white, hamburger dark pill)
  // - Home + scrolled: fixed top, white pill stuck — keep menu visible while scrolling
  // - Not home: absolute white pill (existing behavior)
  const homeTop = isHome && !scrolled;
  const homeStuck = isHome && scrolled;

  const containerClass = homeStuck
    ? "fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 lg:px-6 pt-2 pb-2 animate-fade-in"
    : homeTop
    ? "absolute top-[42px] left-0 right-0 z-40 px-3 sm:px-4 lg:px-6 pt-1 pb-2"
    : "absolute top-0 left-0 right-0 z-50 px-3 sm:px-4 lg:px-6 pt-3 pb-2";

  const navClass = homeStuck
    ? "max-w-7xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between bg-background/90 backdrop-blur-xl border border-border/60 rounded-full shadow-[0_10px_40px_rgb(0,0,0,0.12)]"
    : homeTop
    ? "max-w-7xl mx-auto px-2 sm:px-4 h-14 flex items-center justify-between"
    : "max-w-7xl mx-auto px-2 sm:px-4 h-16 flex items-center justify-between bg-background/70 backdrop-blur-md border border-border/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)]";

  return (
    <div className={containerClass}>
      <nav className={navClass}>
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
              className={`h-9 w-auto object-contain group-hover:scale-105 transition-transform duration-200 ${
                homeTop ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" : ""
              }`}
            />
          </a>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Theme + login: desktop inline (non-home); home top renders them in InfoBar. Mobile uses in-menu block. */}
          {!homeTop && <div className="hidden md:flex"><HeaderUserControls variant="dark" /></div>}

          {/* Hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full h-10 w-10 ${
              homeTop
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

      {/* Mega menu panel — Utilities first, Categories second, Stories featured */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-4 lg:right-6 top-[68px] sm:top-full sm:mt-3 sm:w-[min(780px,calc(100vw-2rem))] z-50 bg-background border border-border/60 rounded-2xl sm:rounded-3xl shadow-[0_30px_80px_rgb(0,0,0,0.25)] animate-fade-in overflow-hidden max-h-[calc(100vh-88px)] overflow-y-auto"
          >
            {/* Auth block — TOP on mobile so it's always visible without scrolling */}
            {user ? (
              <div className="bg-muted/40 px-5 sm:px-6 py-3 flex items-center gap-3 md:hidden border-b border-border/60">
                <Avatar className="h-10 w-10 ring-2 ring-background">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
                  <AvatarFallback>{getUserInitials(user.user_metadata?.full_name || user.email)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{user.user_metadata?.full_name || "User"}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button size="sm" className="rounded-full px-4">Dashboard</Button>
                </Link>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 sm:px-6 py-3 flex items-center gap-3 md:hidden border-b border-border/60">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">Chào bạn 👋</div>
                  <div className="text-xs text-muted-foreground">Đăng nhập để bắt đầu</div>
                </div>
                <Link to="/login" onClick={() => setIsOpen(false)} className="flex-shrink-0">
                  <Button size="sm" className="rounded-full px-5 font-semibold shadow-md">
                    Đăng nhập
                  </Button>
                </Link>
              </div>
            )}

            {/* Featured: Câu chuyện */}
            <Link
              to="/stories"
              onClick={() => setIsOpen(false)}
              className="group flex items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
                  Nổi bật
                </div>
                <div className="text-base sm:text-lg font-bold leading-tight mt-0.5">
                  Câu chuyện
                </div>
                <div className="text-xs opacity-80 mt-0.5 hidden sm:block">
                  Những bài viết truyền cảm hứng, được tuyển chọn
                </div>
              </div>
              <span className="text-2xl transition-transform group-hover:translate-x-1 flex-shrink-0">
                →
              </span>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-5">
              {/* Utilities — left/primary */}
              <div className="md:col-span-3 p-5 sm:p-6 border-b md:border-b-0 md:border-r border-border/60">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    {t("common.utilities") || "Tiện ích"}
                  </span>
                  <Link
                    to="/utilities"
                    onClick={() => setIsOpen(false)}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Xem tất cả →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {utilityItems.map((u) => (
                    <Link
                      key={u.id}
                      to={u.href ?? `/utilities?tool=${u.id}`}
                      onClick={() => setIsOpen(false)}
                      className="px-3 py-2.5 text-[13px] sm:text-[14px] text-foreground hover:text-primary hover:bg-muted rounded-xl transition-colors truncate border border-transparent hover:border-border/60"
                    >
                      {u.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Categories — right/secondary */}
              <div className="md:col-span-2 p-5 sm:p-6 bg-gradient-to-br from-muted/40 via-background to-background">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3 sm:mb-4">
                  Chuyên mục
                </div>
                <div className="flex flex-col gap-0.5">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="text-[14px] sm:text-[15px] leading-none">{item.name}</span>
                      <span
                        className={`text-base transition-transform group-hover:translate-x-1 ${
                          isActive(item.href)
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-60"
                        }`}
                      >
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;
