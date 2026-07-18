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
  Briefcase,
  GraduationCap,
  MessageCircle,
  ImagePlus,
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
import ComingSoonWidget from "@/components/widgets/ComingSoonWidget";

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
        title: "Danh Sách nợ thuế",
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
        badge: "Beta",
        render: () => <HoroscopeWidget />,
      },
      {
        id: "gold-price",
        icon: Coins,
        title: "Giá vàng",
        description: "Giá vàng SJC, PNJ, DOJI — Mua vào / Bán ra.",
        render: () => <GoldPriceWidget />,
      },
      {
        id: "stock-market",
        icon: TrendingUp,
        title: "Chứng khoán Việt Nam",
        description: "Chỉ số VNINDEX, HNX và các cổ phiếu phổ biến.",
        badge: "Demo",
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
      {
        id: "jobs",
        icon: Briefcase,
        title: "Tìm việc làm",
        description: "Danh sách việc làm mới nhất.",
        badge: "Sắp có",
        render: () => (
          <ComingSoonWidget
            title="Tìm việc làm"
            reason="Chưa có nguồn dữ liệu việc làm chính thức. Các trang lớn (VietnamWorks, TopCV, ITviec) không cung cấp API công khai miễn phí, cần đăng ký partner hoặc dùng crawler (rủi ro pháp lý)."
            needs={[
              "API key của một trong các đối tác: VietnamWorks / TopCV / ITviec / CareerBuilder, HOẶC",
              "Cho phép tự đăng tin việc làm trong hệ thống (tạo bảng jobs riêng và form đăng)",
              "Xác nhận danh mục nghề nghiệp, khu vực, mức lương muốn hiển thị",
            ]}
          />
        ),
      },
      {
        id: "homework",
        icon: GraduationCap,
        title: "Giải bài tập",
        description: "Toán, Văn, Anh — giải nhanh bằng AI.",
        badge: "Sắp có",
        render: () => (
          <ComingSoonWidget
            title="Giải bài tập (Toán, Văn, Anh…)"
            reason="Cần tích hợp AI Gateway (Lovable AI) và một Edge Function riêng để nhận đề bài + ảnh, gọi model (Gemini / GPT) và trả lời. Chưa build vì cần xác nhận phạm vi để tránh lạm dụng (giới hạn/turn, cấm gian lận thi cử...)."
            needs={[
              "Xác nhận bật Lovable AI Gateway cho tính năng này (miễn phí đến hết 6/10/2025 theo policy hiện tại)",
              "Giới hạn: cho phép ai dùng (guest / user đã đăng nhập), số lượt/ngày",
              "Có cho upload ảnh đề bài không (cần bật multimodal)",
              "Môn học: Toán / Văn / Anh / thêm gì khác",
            ]}
          />
        ),
      },
      {
        id: "chatbot",
        icon: MessageCircle,
        title: "Chatbox AI",
        description: "Trò chuyện trực tiếp với trợ lý AI.",
        badge: "Sắp có",
        render: () => (
          <ComingSoonWidget
            title="Chatbox AI"
            reason="Cần Edge Function stream (streamText qua Lovable AI Gateway) + bảng lưu hội thoại nếu muốn giữ lịch sử. Chưa build vì cần chốt shape hội thoại và storage."
            needs={[
              "Hình thức: 1 hội thoại duy nhất hay nhiều thread?",
              "Lưu lịch sử: Database (Supabase) / localStorage / không lưu?",
              "Ai được dùng: guest hay chỉ user đã đăng nhập?",
              "Có cần tool-calling (search web, đọc bài viết trên site) không?",
            ]}
          />
        ),
      },
      {
        id: "image-gen",
        icon: ImagePlus,
        title: "Tạo ảnh AI",
        description: "Sinh ảnh từ mô tả bằng AI.",
        badge: "Sắp có",
        render: () => (
          <ComingSoonWidget
            title="Tạo ảnh AI"
            reason="Cần Edge Function gọi /v1/images/generations qua Lovable AI Gateway (gpt-image-2 hoặc Gemini Nano Banana). Chưa build vì cần chốt giới hạn để tránh lạm dụng credit."
            needs={[
              "Model muốn dùng: gpt-image-2 (chất lượng cao, đắt) hay gemini-2.5-flash-image (rẻ, nhanh)?",
              "Giới hạn: số ảnh/user/ngày, cho phép guest hay không",
              "Có lưu ảnh vào Supabase Storage (bucket riêng) để user xem lại không?",
              "Có cần tính năng edit ảnh (upload ảnh gốc + prompt) không?",
            ]}
          />
        ),
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
