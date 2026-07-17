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
  FileSearch,
  Building2,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LunarCalendarFull from "@/components/LunarCalendarFull";
import FlightSearchWidget from "@/components/flight/FlightSearchWidget";
import HoroscopeWidget from "@/components/widgets/HoroscopeWidget";
import GoldPriceHistoryWidget from "@/components/widgets/GoldPriceHistoryWidget";
import StockMarketWidget from "@/components/widgets/StockMarketWidget";
import TaxDebtLookupWidget from "@/components/widgets/TaxDebtLookupWidget";
import TaxCodeLookupWidget from "@/components/widgets/TaxCodeLookupWidget";

type Tool = {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  external?: string;
  badge?: string;
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
        description: "Nhập MST để xem tên, địa chỉ, ngành nghề, người đại diện pháp luật.",
        render: () => <TaxCodeLookupWidget />,
      },
      {
        id: "tax-debt",
        icon: FileSearch,
        title: "Tra cứu nợ thuế",
        description: "Danh sách doanh nghiệp đang nợ thuế theo MST hoặc tên.",
        render: () => <TaxDebtLookupWidget />,
      },
      {
        id: "lunar-calendar",
        icon: Calendar,
        title: "Lịch âm dương",
        description: "Xem ngày tốt xấu, giờ hoàng đạo theo truyền thống Việt Nam.",
        render: () => <LunarCalendarFull />,
      },
      {
        id: "horoscope",
        icon: Star,
        title: "Xem tử vi",
        description: "Tử vi hàng ngày theo cung hoàng đạo.",
        badge: "Mới",
        render: () => <HoroscopeWidget />,
      },
      {
        id: "gold-price",
        icon: Coins,
        title: "Giá vàng",
        description: "Giá vàng SJC, PNJ, DOJI và giá vàng thế giới.",
        render: () => <GoldPriceHistoryWidget />,
      },
      {
        id: "stock-market",
        icon: TrendingUp,
        title: "Chứng khoán Việt Nam",
        description: "Chỉ số VNINDEX, HNX và các cổ phiếu phổ biến.",
        render: () => <StockMarketWidget />,
      },
      {
        id: "flight-booking",
        icon: Plane,
        title: "Vé máy bay",
        description: "Tìm và so sánh giá vé máy bay nội địa và quốc tế.",
        render: () => (
          <div className="max-w-lg">
            <FlightSearchWidget />
          </div>
        ),
      },
      {
        id: "crypto",
        icon: Bitcoin,
        title: "Crypto Tracker",
        description: "Theo dõi giá Bitcoin, Ethereum và các altcoin.",
        external: "/crypto",
      },
      {
        id: "mining-explorer",
        icon: Pickaxe,
        title: "Mining Explorer",
        description: "Khám phá hệ thống mining token & phần thưởng.",
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
    if (!found) return;
    if (found.external) {
      navigate(found.external, { replace: true });
    } else {
      setActiveId(tool);
    }
  }, [searchParams, tools, navigate]);

  const handleSelect = (tool: Tool) => {
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
  const ActiveIcon = active.icon;

  return (
    <div className="min-h-[calc(100vh-88px)] bg-background">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="bg-primary lg:sticky lg:top-[88px] lg:self-start lg:h-[calc(100vh-88px)]">
          <div className="px-3 py-6 h-full overflow-y-auto">
            <nav className="flex flex-col gap-0.5">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = !tool.external && tool.id === activeId;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleSelect(tool)}
                    className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-full text-left transition-all ${
                      isActive
                        ? "bg-white/15 text-white font-semibold"
                        : "text-white/80 hover:bg-white/10 hover:text-white font-normal"
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${
                        isActive ? "text-white" : "text-white/70"
                      }`}
                      strokeWidth={isActive ? 2.25 : 1.75}
                    />
                    <span className="flex-1 text-[14px] truncate" style={{ fontFamily: "inherit" }}>
                      {tool.title}
                    </span>
                    {tool.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white text-primary">
                        {tool.badge}
                      </span>
                    )}
                    {tool.external && (
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
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-8">
            <div className="mx-auto max-w-xl rounded-2xl border border-border/60 bg-card p-5 sm:p-6 [&_.grid]:gap-3">
              {active.render?.()}
            </div>



          </div>
        </section>
      </div>
    </div>
  );
};

export default Utilities;
