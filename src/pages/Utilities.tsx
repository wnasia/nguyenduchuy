import { useI18n } from "@/hooks/useI18n";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
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
  Sparkles,
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
  render?: () => React.ReactNode;
  accent: string; // tailwind color e.g. "text-sky-600 bg-sky-500/10"
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
        description: "Nhập MST để xem tên, địa chỉ, ngành nghề, người đại diện",
        render: () => <TaxCodeLookupWidget />,
        accent: "text-sky-600 bg-sky-500/10",
      },
      {
        id: "tax-debt",
        icon: FileSearch,
        title: "Tra cứu nợ thuế",
        description: "Danh sách doanh nghiệp đang nợ thuế",
        render: () => <TaxDebtLookupWidget />,
        accent: "text-rose-600 bg-rose-500/10",
      },
      {
        id: "lunar-calendar",
        icon: Calendar,
        title: "Lịch âm dương",
        description: "Ngày tốt xấu, giờ hoàng đạo",
        render: () => <LunarCalendarFull />,
        accent: "text-orange-600 bg-orange-500/10",
      },
      {
        id: "horoscope",
        icon: Star,
        title: "Xem tử vi",
        description: "Tử vi theo cung hoàng đạo",
        render: () => <HoroscopeWidget />,
        accent: "text-purple-600 bg-purple-500/10",
      },
      {
        id: "gold-price",
        icon: Coins,
        title: "Giá vàng",
        description: "Giá vàng SJC, PNJ, DOJI và thế giới",
        render: () => <GoldPriceHistoryWidget />,
        accent: "text-yellow-600 bg-yellow-500/10",
      },
      {
        id: "stock-market",
        icon: TrendingUp,
        title: "Chứng khoán VN",
        description: "VNINDEX, HNX & cổ phiếu",
        render: () => <StockMarketWidget />,
        accent: "text-green-600 bg-green-500/10",
      },
      {
        id: "flight-booking",
        icon: Plane,
        title: "Vé máy bay",
        description: "Tìm & so sánh chuyến bay",
        render: () => (
          <div className="max-w-lg">
            <FlightSearchWidget />
          </div>
        ),
        accent: "text-blue-600 bg-blue-500/10",
      },
      {
        id: "crypto",
        icon: Bitcoin,
        title: "Crypto Tracker",
        description: "Giá Bitcoin, Ethereum, altcoin",
        external: "/crypto",
        accent: "text-amber-600 bg-amber-500/10",
      },
      {
        id: "mining-explorer",
        icon: Pickaxe,
        title: "Mining Explorer",
        description: "Khám phá mining token",
        external: "/explorer",
        accent: "text-indigo-600 bg-indigo-500/10",
      },
    ],
    []
  );

  const [activeId, setActiveId] = useState<string>(tools[0].id);

  // sync ?tool=
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
    <div className="min-h-[calc(100vh-88px)] bg-muted/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-[100px] lg:self-start">
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Tiện ích</h2>
              </div>
              <nav className="p-2 flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = !tool.external && tool.id === activeId;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleSelect(tool)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`shrink-0 h-8 w-8 rounded-md flex items-center justify-center ${tool.accent}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium truncate">
                          {tool.title}
                        </span>
                      </span>
                      {tool.external && (
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <section className="min-w-0">
            <div className="rounded-xl border bg-card">
              <header className="px-4 sm:px-6 py-4 border-b flex items-start gap-3">
                <div
                  className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${active.accent}`}
                >
                  <ActiveIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    {active.title}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {active.description}
                  </p>
                </div>
              </header>
              <div className="p-4 sm:p-6">{active.render?.()}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Utilities;
