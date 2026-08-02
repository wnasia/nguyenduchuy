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
              <h3 className="text-base font-semibold mb-3">
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
          <div className="max-w-lg">
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
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="bg-primary lg:sticky lg:top-[88px] lg:self-start lg:h-[calc(100vh-88px)] lg:overflow-hidden">
          <div className="px-3 py-6 h-full">
            <nav className="flex flex-col gap-0.5">
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
                    className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-full text-left transition-all ${
                      disabled
                        ? "text-white/25 cursor-not-allowed"
                        : isActive
                          ? "bg-white/15 text-white font-semibold"
                          : "text-white/80 hover:bg-white/10 hover:text-white font-normal"
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${
                        disabled ? "text-white/25" : isActive ? "text-white" : "text-white/70"
                      }`}
                      strokeWidth={isActive ? 2.25 : 1.75}
                    />
                    <span className="flex-1 text-[14px] truncate">{tool.title}</span>
                    {tool.external && !disabled && (
                      <ExternalLink className="h-3.5 w-3.5 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <section className="min-w-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-8">
            <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm [&_.grid]:gap-3">
              {active.render?.()}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Utilities;
