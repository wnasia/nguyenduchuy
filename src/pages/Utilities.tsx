import { useI18n } from "@/hooks/useI18n";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Star, 
  Coins, 
  TrendingUp, 
  Plane,
  ArrowRight,
  Globe,
  Bitcoin,
  Pickaxe,
  FileSearch
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LunarCalendarFull from "@/components/LunarCalendarFull";
import FlightSearchWidget from "@/components/flight/FlightSearchWidget";
import HoroscopeWidget from "@/components/widgets/HoroscopeWidget";
import GoldPriceHistoryWidget from "@/components/widgets/GoldPriceHistoryWidget";
import StockMarketWidget from "@/components/widgets/StockMarketWidget";
import TaxDebtLookupWidget from "@/components/widgets/TaxDebtLookupWidget";

const Utilities = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  usePageTitle(t("meta.utilities_title") || "Tiện ích - Huy's");
  
  const [openModal, setOpenModal] = useState<string | null>(null);

  const utilities = [
    {
      id: "lunar-calendar",
      icon: Calendar,
      title: t("utilities.lunar_calendar") || "Lịch âm dương",
      description: t("utilities.lunar_calendar_desc") || "Xem lịch âm dương, ngày tốt xấu, giờ hoàng đạo theo truyền thống Việt Nam",
      action: t("utilities.view") || "Xem lịch",
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      id: "horoscope",
      icon: Star,
      title: t("utilities.horoscope") || "Xem tử vi",
      description: t("utilities.horoscope_desc") || "Tra cứu tử vi hàng ngày, hàng tuần và hàng năm theo cung hoàng đạo",
      action: t("utilities.view") || "Xem tử vi",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      id: "gold-price",
      icon: Coins,
      title: t("utilities.gold_price") || "Giá vàng Việt Nam / Thế giới",
      description: t("utilities.gold_price_desc") || "Cập nhật giá vàng SJC, PNJ, DOJI và giá vàng thế giới theo thời gian thực",
      action: t("utilities.view") || "Xem giá vàng",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600"
    },
    {
      id: "stock-market",
      icon: TrendingUp,
      title: t("utilities.stock_market") || "Chứng khoán Việt Nam (VNINDEX)",
      description: t("utilities.stock_market_desc") || "Theo dõi chỉ số VNINDEX, HNX và các cổ phiếu phổ biến trên sàn giao dịch",
      action: t("utilities.view") || "Xem chứng khoán",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      id: "flight-booking",
      icon: Plane,
      title: t("utilities.flight_booking") || "Vé máy bay",
      description: t("utilities.flight_booking_desc") || "Tìm kiếm và so sánh giá vé máy bay nội địa và quốc tế",
      action: t("utilities.search") || "Tìm chuyến bay",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      id: "crypto",
      icon: Bitcoin,
      title: t("utilities.crypto") || "Crypto Tracker",
      description: t("utilities.crypto_desc") || "Theo dõi giá tiền điện tử Bitcoin, Ethereum và các altcoin phổ biến theo thời gian thực",
      action: t("utilities.view") || "Xem Crypto",
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600"
    },
    {
      id: "mining-explorer",
      icon: Pickaxe,
      title: "Mining Explorer",
      description: "Khám phá hệ thống mining token, theo dõi phiên đọc và phần thưởng token của bạn",
      action: "Khám phá",
      color: "from-indigo-500 to-violet-500",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600"
    },
    {
      id: "tax-debt",
      icon: FileSearch,
      title: "Tra cứu doanh nghiệp nợ thuế",
      description: "Tra cứu nhanh danh sách doanh nghiệp đang nợ thuế theo mã số thuế hoặc tên doanh nghiệp",
      action: "Tra cứu",
      color: "from-rose-500 to-red-500",
      bgColor: "bg-rose-50",
      iconColor: "text-rose-600"
    }
  ];

  const handleCardClick = (id: string) => {
    if (id === "crypto") {
      navigate("/crypto");
    } else if (id === "mining-explorer") {
      navigate("/explorer");
    } else {
      setOpenModal(id);
    }
  };

  const renderModalContent = (id: string) => {
    switch (id) {
      case "lunar-calendar":
        return <LunarCalendarFull />;
      case "gold-price":
        return <GoldPriceHistoryWidget />;
      case "flight-booking":
        return (
          <div className="max-w-lg mx-auto">
            <FlightSearchWidget />
          </div>
        );
      case "horoscope":
        return <HoroscopeWidget />;
      case "stock-market":
        return <StockMarketWidget />;
      case "tax-debt":
        return <TaxDebtLookupWidget />;
      default:
        return null;
    }
  };

  const getModalTitle = (id: string) => {
    const utility = utilities.find(u => u.id === id);
    return utility?.title || "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t("utilities.title") || "Tiện ích"}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              {t("utilities.subtitle") || "Các công cụ và tiện ích hữu ích cho cuộc sống hàng ngày của bạn"}
            </p>
          </div>
        </div>
      </div>

      {/* Utilities Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {utilities.map((utility) => {
            const Icon = utility.icon;
            return (
              <Card 
                key={utility.id}
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                onClick={() => handleCardClick(utility.id)}
              >
                {/* Gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${utility.color}`} />
                
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 p-3 rounded-xl ${utility.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${utility.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {utility.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <CardDescription className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {utility.description}
                  </CardDescription>
                  
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-between group-hover:bg-gradient-to-r ${utility.color} group-hover:text-white transition-all duration-300`}
                  >
                    <span>{utility.action}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal for utility content */}
      <Dialog open={openModal !== null} onOpenChange={() => setOpenModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {openModal && getModalTitle(openModal)}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {openModal && renderModalContent(openModal)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Utilities;
