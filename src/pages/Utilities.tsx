import { useI18n } from "@/hooks/useI18n";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Calendar,
  Star,
  Coins,
  TrendingUp,
  Plane,
  Bitcoin,
  Pickaxe,
  Building2,
  ExternalLink,
  Briefcase,
  GraduationCap,
  MessageCircle,
  ImagePlus,
  Video,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LunarCalendarFull from "@/components/LunarCalendarFull";
import FlightSearchWidget from "@/components/flight/FlightSearchWidget";
import HoroscopeWidget from "@/components/widgets/HoroscopeWidget";
import GoldPriceWidget from "@/components/widgets/GoldPriceWidget";
import StockMarketWidget from "@/components/widgets/StockMarketWidget";
import TaxDebtLookupWidget from "@/components/widgets/TaxDebtLookupWidget";
import TaxCodeLookupWidget from "@/components/widgets/TaxCodeLookupWidget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tool = {
  id: string;
  icon: React.ElementType;
  title: string;
  external?: string;
  available?: boolean;
  render?: () => React.ReactNode;
};

const Utilities = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  usePageTitle(t("meta.utilities_title") || "Tiện ích - Huy's");

  const tools: Tool[] = useMemo(
    () => [
      {
        id: "tax-code",
        icon: Building2,
        title: "Tra cứu mã số thuế",
        available: true,
        render: () => (
          <div className="space-y-8">
            <TaxCodeLookupWidget />
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">
                Danh sách doanh nghiệp trạng thái 06 (nợ thuế)
              </h3>
              <TaxDebtLookupWidget />
            </div>
          </div>
        ),
      },
      { id: "image-gen", icon: ImagePlus, title: "Tạo ảnh", available: false },
      { id: "video-gen", icon: Video, title: "Tạo video", available: false },
      { id: "chatbot", icon: MessageCircle, title: "Chatbox", available: false },
      {
        id: "lunar-calendar",
        icon: Calendar,
        title: "Lịch âm",
        available: true,
        render: () => <LunarCalendarFull />,
      },
      {
        id: "horoscope",
        icon: Star,
        title: "Xem tử vi",
        available: true,
        render: () => <HoroscopeWidget />,
      },
      {
        id: "gold-price",
        icon: Coins,
        title: "Giá vàng",
        available: true,
        render: () => <GoldPriceWidget />,
      },
      { id: "homework", icon: GraduationCap, title: "Giải bài tập", available: false },
      { id: "jobs", icon: Briefcase, title: "Việc làm", available: false },
      {
        id: "flight-booking",
        icon: Plane,
        title: "Vé máy bay",
        available: true,
        render: () => (
          <div className="max-w-xl">
            <FlightSearchWidget />
          </div>
        ),
      },
      {
        id: "crypto",
        icon: Bitcoin,
        title: "Thị trường Crypto",
        available: true,
        external: "/crypto",
      },
      {
        id: "stock-market",
        icon: TrendingUp,
        title: "Chứng khoán",
        available: true,
        render: () => <StockMarketWidget />,
      },
      {
        id: "mining-explorer",
        icon: Pickaxe,
        title: "Mining Explorer",
        available: true,
        external: "/explorer",
      },
    ],
    []
  );

  const [activeId, setActiveId] = useState<string>(tools[0].id);

  useEffect(() => {
    const tool = searchParams.get("tool");
    if (!tool) return;
    const found = tools.find((x) => x.id === tool);
    if (!found || found.available === false) return;
    if (found.external) {
      navigate(found.external, { replace: true });
    } else {
      setActiveId(tool);
    }
  }, [searchParams, tools, navigate]);

  const handleSelect = (tool: Tool) => {
    if (tool.available === false) return;
    if (tool.external) {
      navigate(tool.external);
      return;
    }
    setActiveId(tool.id);
    const next = new URLSearchParams(searchParams);
    next.set("tool", tool.id);
    setSearchParams(next, { replace: true });
  };

  const active = tools.find((x) => x.id === activeId) ?? tools[0];

  return (
    <div className="min-h-[calc(100vh-88px)] bg-background">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block bg-muted/40 border-r border-border/60 lg:sticky lg:top-[88px] lg:self-start">
          <div className="px-3 py-5">
            <p className="px-4 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Tiện ích
            </p>
            <nav className="flex flex-col gap-1">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const disabled = tool.available === false;
                const isActive = !tool.external && !disabled && tool.id === activeId;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleSelect(tool)}
                    disabled={disabled}
                    aria-disabled={disabled}
                    className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all ${
                      disabled
                        ? "text-muted-foreground/70 cursor-not-allowed select-none"
                        : isActive
                          ? "bg-background text-foreground font-semibold shadow-sm ring-1 ring-border/60"
                          : "text-muted-foreground hover:bg-background/70 hover:text-foreground font-medium"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : ""}`}
                      strokeWidth={isActive ? 2.25 : 1.75}
                    />
                    <span className="flex-1 text-[16px] leading-tight truncate">{tool.title}</span>
                    {tool.external && !disabled && (
                      <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile selector */}
        <div className="lg:hidden sticky top-[64px] z-30 bg-background/95 backdrop-blur border-b border-border/60 px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-left">
              <active.icon className="h-5 w-5 text-primary shrink-0" />
              <span className="flex-1 text-[17px] font-semibold truncate">{active.title}</span>
              <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const disabled = tool.available === false;
                return (
                  <DropdownMenuItem
                    key={tool.id}
                    disabled={disabled}
                    onSelect={() => handleSelect(tool)}
                    className="gap-3 py-3 text-[16px]"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 truncate">{tool.title}</span>
                    {tool.external && !disabled && <ExternalLink className="h-4 w-4 opacity-60" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main */}
        <section className="min-w-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-10">
            <h1 className="hidden lg:block text-2xl font-bold mb-4">{active.title}</h1>
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 lg:p-8 shadow-sm text-[16px] leading-relaxed [&_.grid]:gap-3">
              {active.render?.()}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Utilities;
