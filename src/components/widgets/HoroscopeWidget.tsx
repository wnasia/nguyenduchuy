import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Heart, Briefcase, Coins, Sparkles, ArrowLeft } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

interface ZodiacSign {
  id: string;
  name: string;
  nameVi: string;
  symbol: string;
  dateRange: string;
  element: string;
  elementVi: string;
}

const zodiacSigns: ZodiacSign[] = [
  { id: "aries", name: "Aries", nameVi: "Bạch Dương", symbol: "♈", dateRange: "21/03 - 19/04", element: "Fire", elementVi: "Hỏa" },
  { id: "taurus", name: "Taurus", nameVi: "Kim Ngưu", symbol: "♉", dateRange: "20/04 - 20/05", element: "Earth", elementVi: "Thổ" },
  { id: "gemini", name: "Gemini", nameVi: "Song Tử", symbol: "♊", dateRange: "21/05 - 20/06", element: "Air", elementVi: "Khí" },
  { id: "cancer", name: "Cancer", nameVi: "Cự Giải", symbol: "♋", dateRange: "21/06 - 22/07", element: "Water", elementVi: "Thủy" },
  { id: "leo", name: "Leo", nameVi: "Sư Tử", symbol: "♌", dateRange: "23/07 - 22/08", element: "Fire", elementVi: "Hỏa" },
  { id: "virgo", name: "Virgo", nameVi: "Xử Nữ", symbol: "♍", dateRange: "23/08 - 22/09", element: "Earth", elementVi: "Thổ" },
  { id: "libra", name: "Libra", nameVi: "Thiên Bình", symbol: "♎", dateRange: "23/09 - 22/10", element: "Air", elementVi: "Khí" },
  { id: "scorpio", name: "Scorpio", nameVi: "Bọ Cạp", symbol: "♏", dateRange: "23/10 - 21/11", element: "Water", elementVi: "Thủy" },
  { id: "sagittarius", name: "Sagittarius", nameVi: "Nhân Mã", symbol: "♐", dateRange: "22/11 - 21/12", element: "Fire", elementVi: "Hỏa" },
  { id: "capricorn", name: "Capricorn", nameVi: "Ma Kết", symbol: "♑", dateRange: "22/12 - 19/01", element: "Earth", elementVi: "Thổ" },
  { id: "aquarius", name: "Aquarius", nameVi: "Bảo Bình", symbol: "♒", dateRange: "20/01 - 18/02", element: "Air", elementVi: "Khí" },
  { id: "pisces", name: "Pisces", nameVi: "Song Ngư", symbol: "♓", dateRange: "19/02 - 20/03", element: "Water", elementVi: "Thủy" },
];

// Generate deterministic horoscope based on sign and date
const generateHoroscope = (signId: string, type: 'daily' | 'weekly' | 'yearly') => {
  const today = new Date();
  const seed = signId.length + today.getDate() + (type === 'weekly' ? today.getDay() : 0) + (type === 'yearly' ? today.getFullYear() : 0);
  
  const luckScore = ((seed * 7) % 5) + 6; // 6-10
  const loveScore = ((seed * 11) % 5) + 6;
  const careerScore = ((seed * 13) % 5) + 6;
  const financeScore = ((seed * 17) % 5) + 6;
  
  const dailyMessages = [
    "Hôm nay là ngày tốt để bắt đầu những dự án mới. Năng lượng tích cực sẽ giúp bạn vượt qua mọi thử thách.",
    "Sự kiên nhẫn sẽ mang lại thành quả. Hãy tin tưởng vào bản thân và tiếp tục tiến về phía trước.",
    "Một cơ hội bất ngờ có thể xuất hiện. Hãy sẵn sàng đón nhận và nắm bắt kịp thời.",
    "Tình cảm gia đình cần được quan tâm hơn. Dành thời gian cho những người thân yêu.",
    "Sáng tạo và đổi mới sẽ là chìa khóa thành công. Đừng ngại thử nghiệm những ý tưởng mới.",
    "Một ngày thuận lợi cho các quyết định quan trọng. Trực giác của bạn rất chính xác.",
    "Giao tiếp là điểm mạnh của bạn hôm nay. Những cuộc trò chuyện có thể mở ra cánh cửa mới.",
    "Sức khỏe cần được chú ý. Hãy dành thời gian nghỉ ngơi và thư giãn.",
    "Tài chính có dấu hiệu khởi sắc. Những khoản đầu tư trước đó bắt đầu sinh lợi.",
    "Mối quan hệ xã hội được mở rộng. Những người bạn mới có thể trở thành đối tác tốt.",
    "Công việc tiến triển tốt đẹp. Nỗ lực của bạn được cấp trên ghi nhận.",
    "Tình yêu đang gõ cửa. Hãy mở lòng đón nhận những điều tốt đẹp đến với bạn."
  ];
  
  const weeklyMessages = [
    "Tuần này mang đến nhiều cơ hội phát triển bản thân. Hãy tập trung vào những mục tiêu dài hạn và kiên trì theo đuổi.",
    "Các mối quan hệ sẽ là điểm nhấn của tuần. Những cuộc gặp gỡ có thể thay đổi hướng đi của bạn.",
    "Sự nghiệp cần được đầu tư thêm công sức. Những nỗ lực trong tuần này sẽ đem lại kết quả trong tương lai gần.",
    "Tuần lễ thuận lợi cho việc học hỏi và tiếp thu kiến thức mới. Hãy mở rộng tầm nhìn.",
    "Tài chính cần được quản lý cẩn thận. Tránh những chi tiêu không cần thiết.",
    "Sức khỏe tinh thần cần được quan tâm. Thiền định và yoga có thể giúp ích.",
  ];
  
  const yearlyMessages = [
    "Năm nay đánh dấu bước ngoặt quan trọng trong sự nghiệp. Những thay đổi lớn sẽ mang lại cơ hội mới.",
    "Tình cảm sẽ có nhiều biến động tích cực. Những người độc thân có thể tìm được nửa kia của mình.",
    "Tài chính dần ổn định và phát triển. Các khoản đầu tư dài hạn sẽ mang lại lợi nhuận.",
    "Sức khỏe cần được chú ý từ giữa năm. Hãy duy trì lối sống lành mạnh.",
    "Gia đình là nguồn động lực lớn nhất. Những sự kiện vui vẻ sẽ diễn ra trong năm.",
    "Du lịch và khám phá sẽ mang lại nhiều trải nghiệm quý giá.",
  ];
  
  const luckyNumbers = Array.from({ length: 3 }, (_, i) => ((seed * (i + 3)) % 49) + 1);
  const luckyColors = ["Đỏ", "Xanh dương", "Vàng", "Tím", "Xanh lá", "Cam", "Hồng", "Trắng"];
  const luckyColor = luckyColors[(seed % luckyColors.length)];
  
  let message = "";
  switch (type) {
    case 'daily':
      message = dailyMessages[(seed % dailyMessages.length)];
      break;
    case 'weekly':
      message = weeklyMessages[(seed % weeklyMessages.length)];
      break;
    case 'yearly':
      message = yearlyMessages[(seed % yearlyMessages.length)];
      break;
  }
  
  return {
    message,
    luckScore,
    loveScore,
    careerScore,
    financeScore,
    luckyNumbers: luckyNumbers.sort((a, b) => a - b),
    luckyColor,
  };
};

const HoroscopeWidget = () => {
  const { t } = useI18n();
  const [selectedSign, setSelectedSign] = useState<ZodiacSign | null>(null);
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'yearly'>('daily');

  const renderScoreBar = (score: number, label: string, icon: React.ReactNode, color: string) => (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-sm font-semibold text-foreground">{score}/10</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${score * 10}%` }}
          />
        </div>
      </div>
    </div>
  );

  if (selectedSign) {
    const horoscope = generateHoroscope(selectedSign.id, timeFrame);
    const today = new Date();
    
    return (
      <div className="space-y-6">
        {/* Back button and header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedSign(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back") || "Quay lại"}
          </Button>
        </div>

        {/* Sign header */}
        <div className="text-center">
          <div className="text-6xl mb-2">{selectedSign.symbol}</div>
          <h2 className="text-2xl font-bold text-foreground">{selectedSign.nameVi}</h2>
          <p className="text-muted-foreground">{selectedSign.name} • {selectedSign.dateRange}</p>
          <Badge variant="secondary" className="mt-2">
            {selectedSign.elementVi} ({selectedSign.element})
          </Badge>
        </div>

        {/* Time frame tabs */}
        <Tabs value={timeFrame} onValueChange={(v) => setTimeFrame(v as typeof timeFrame)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Hôm nay</TabsTrigger>
            <TabsTrigger value="weekly">Tuần này</TabsTrigger>
            <TabsTrigger value="yearly">Năm {today.getFullYear()}</TabsTrigger>
          </TabsList>

          <TabsContent value={timeFrame} className="mt-4 space-y-6">
            {/* Main prediction */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                  <p className="text-foreground leading-relaxed">{horoscope.message}</p>
                </div>
              </CardContent>
            </Card>

            {/* Scores */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Chỉ số vận may</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderScoreBar(horoscope.luckScore, "Tổng quan", <Star className="h-4 w-4 text-yellow-600" />, "bg-yellow-100 dark:bg-yellow-900/30")}
                {renderScoreBar(horoscope.loveScore, "Tình yêu", <Heart className="h-4 w-4 text-red-600" />, "bg-red-100 dark:bg-red-900/30")}
                {renderScoreBar(horoscope.careerScore, "Sự nghiệp", <Briefcase className="h-4 w-4 text-blue-600" />, "bg-blue-100 dark:bg-blue-900/30")}
                {renderScoreBar(horoscope.financeScore, "Tài chính", <Coins className="h-4 w-4 text-green-600" />, "bg-green-100 dark:bg-green-900/30")}
              </CardContent>
            </Card>

            {/* Lucky info */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Số may mắn</p>
                  <div className="flex justify-center gap-2">
                    {horoscope.luckyNumbers.map((num, i) => (
                      <span 
                        key={i} 
                        className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Màu may mắn</p>
                  <Badge variant="secondary" className="text-base">
                    {horoscope.luckyColor}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-muted-foreground">
          Chọn cung hoàng đạo của bạn để xem tử vi
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {zodiacSigns.map((sign) => (
          <Card 
            key={sign.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 shadow-md group"
            onClick={() => setSelectedSign(sign)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {sign.symbol}
              </div>
              <h3 className="font-semibold text-sm text-foreground">{sign.nameVi}</h3>
              <p className="text-xs text-muted-foreground mt-1">{sign.dateRange}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HoroscopeWidget;
