import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Heart, Briefcase, Coins, Sparkles, ArrowLeft, User, Calendar, Clock } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

interface UserInfo {
  fullName: string;
  gender: "male" | "female" | "other";
  dateOfBirth: string;
  timeOfBirth: string;
}

interface ZodiacSign {
  id: string;
  name: string;
  nameVi: string;
  symbol: string;
  element: string;
  elementVi: string;
}

const zodiacSigns: ZodiacSign[] = [
  { id: "aries", name: "Aries", nameVi: "Bạch Dương", symbol: "♈", element: "Fire", elementVi: "Hỏa" },
  { id: "taurus", name: "Taurus", nameVi: "Kim Ngưu", symbol: "♉", element: "Earth", elementVi: "Thổ" },
  { id: "gemini", name: "Gemini", nameVi: "Song Tử", symbol: "♊", element: "Air", elementVi: "Khí" },
  { id: "cancer", name: "Cancer", nameVi: "Cự Giải", symbol: "♋", element: "Water", elementVi: "Thủy" },
  { id: "leo", name: "Leo", nameVi: "Sư Tử", symbol: "♌", element: "Fire", elementVi: "Hỏa" },
  { id: "virgo", name: "Virgo", nameVi: "Xử Nữ", symbol: "♍", element: "Earth", elementVi: "Thổ" },
  { id: "libra", name: "Libra", nameVi: "Thiên Bình", symbol: "♎", element: "Air", elementVi: "Khí" },
  { id: "scorpio", name: "Scorpio", nameVi: "Bọ Cạp", symbol: "♏", element: "Water", elementVi: "Thủy" },
  { id: "sagittarius", name: "Sagittarius", nameVi: "Nhân Mã", symbol: "♐", element: "Fire", elementVi: "Hỏa" },
  { id: "capricorn", name: "Capricorn", nameVi: "Ma Kết", symbol: "♑", element: "Earth", elementVi: "Thổ" },
  { id: "aquarius", name: "Aquarius", nameVi: "Bảo Bình", symbol: "♒", element: "Air", elementVi: "Khí" },
  { id: "pisces", name: "Pisces", nameVi: "Song Ngư", symbol: "♓", element: "Water", elementVi: "Thủy" },
];

const birthHours = [
  { value: "unknown", label: "Không rõ" },
  { value: "23-01", label: "Giờ Tý (23:00 - 01:00)" },
  { value: "01-03", label: "Giờ Sửu (01:00 - 03:00)" },
  { value: "03-05", label: "Giờ Dần (03:00 - 05:00)" },
  { value: "05-07", label: "Giờ Mão (05:00 - 07:00)" },
  { value: "07-09", label: "Giờ Thìn (07:00 - 09:00)" },
  { value: "09-11", label: "Giờ Tỵ (09:00 - 11:00)" },
  { value: "11-13", label: "Giờ Ngọ (11:00 - 13:00)" },
  { value: "13-15", label: "Giờ Mùi (13:00 - 15:00)" },
  { value: "15-17", label: "Giờ Thân (15:00 - 17:00)" },
  { value: "17-19", label: "Giờ Dậu (17:00 - 19:00)" },
  { value: "19-21", label: "Giờ Tuất (19:00 - 21:00)" },
  { value: "21-23", label: "Giờ Hợi (21:00 - 23:00)" },
];

// Get zodiac sign from date of birth
const getZodiacSign = (dateOfBirth: string): ZodiacSign => {
  const date = new Date(dateOfBirth);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return zodiacSigns[0]; // Aries
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return zodiacSigns[1]; // Taurus
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return zodiacSigns[2]; // Gemini
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return zodiacSigns[3]; // Cancer
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return zodiacSigns[4]; // Leo
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return zodiacSigns[5]; // Virgo
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return zodiacSigns[6]; // Libra
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return zodiacSigns[7]; // Scorpio
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return zodiacSigns[8]; // Sagittarius
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return zodiacSigns[9]; // Capricorn
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return zodiacSigns[10]; // Aquarius
  return zodiacSigns[11]; // Pisces
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Generate personalized horoscope based on user info
const generatePersonalizedHoroscope = (userInfo: UserInfo, type: 'daily' | 'weekly' | 'yearly') => {
  const date = new Date(userInfo.dateOfBirth);
  const today = new Date();
  const seed = userInfo.fullName.length + date.getDate() + date.getMonth() + 
               (userInfo.gender === 'male' ? 1 : userInfo.gender === 'female' ? 2 : 3) +
               today.getDate() + (type === 'weekly' ? today.getDay() : 0) + 
               (type === 'yearly' ? today.getFullYear() : 0);
  
  const luckScore = ((seed * 7) % 5) + 6;
  const loveScore = ((seed * 11) % 5) + 6;
  const careerScore = ((seed * 13) % 5) + 6;
  const financeScore = ((seed * 17) % 5) + 6;
  const healthScore = ((seed * 19) % 5) + 6;
  
  const firstName = userInfo.fullName.split(' ').pop() || userInfo.fullName;
  const genderPronoun = userInfo.gender === 'male' ? 'anh' : userInfo.gender === 'female' ? 'chị' : 'bạn';
  
  const dailyMessages = [
    `${genderPronoun} ${firstName} ơi, hôm nay là ngày tuyệt vời để bắt đầu những dự án mới. Năng lượng tích cực sẽ giúp ${genderPronoun} vượt qua mọi thử thách.`,
    `Sự kiên nhẫn sẽ mang lại thành quả cho ${genderPronoun} ${firstName}. Hãy tin tưởng vào bản thân và tiếp tục tiến về phía trước.`,
    `${genderPronoun} ${firstName}, một cơ hội bất ngờ có thể xuất hiện hôm nay. Hãy sẵn sàng đón nhận và nắm bắt kịp thời.`,
    `Tình cảm gia đình cần được quan tâm hơn hôm nay. ${genderPronoun} ${firstName} nên dành thời gian cho những người thân yêu.`,
    `Sáng tạo và đổi mới sẽ là chìa khóa thành công của ${genderPronoun} ${firstName}. Đừng ngại thử nghiệm những ý tưởng mới.`,
    `Một ngày thuận lợi cho các quyết định quan trọng. Trực giác của ${genderPronoun} ${firstName} rất chính xác.`,
    `Giao tiếp là điểm mạnh của ${genderPronoun} ${firstName} hôm nay. Những cuộc trò chuyện có thể mở ra cánh cửa mới.`,
    `Sức khỏe cần được chú ý. ${genderPronoun} ${firstName} hãy dành thời gian nghỉ ngơi và thư giãn.`,
  ];
  
  const weeklyMessages = [
    `${genderPronoun} ${firstName}, tuần này mang đến nhiều cơ hội phát triển bản thân. Hãy tập trung vào những mục tiêu dài hạn và kiên trì theo đuổi.`,
    `Các mối quan hệ sẽ là điểm nhấn trong tuần của ${genderPronoun} ${firstName}. Những cuộc gặp gỡ có thể thay đổi hướng đi của ${genderPronoun}.`,
    `Sự nghiệp của ${genderPronoun} ${firstName} cần được đầu tư thêm công sức tuần này. Những nỗ lực sẽ đem lại kết quả trong tương lai gần.`,
    `Tuần lễ thuận lợi cho việc học hỏi và tiếp thu kiến thức mới. ${genderPronoun} ${firstName} hãy mở rộng tầm nhìn.`,
  ];
  
  const yearlyMessages = [
    `${genderPronoun} ${firstName}, năm nay đánh dấu bước ngoặt quan trọng trong sự nghiệp. Những thay đổi lớn sẽ mang lại cơ hội mới.`,
    `Tình cảm của ${genderPronoun} ${firstName} sẽ có nhiều biến động tích cực trong năm nay. Hãy mở lòng đón nhận những điều tốt đẹp.`,
    `Tài chính của ${genderPronoun} ${firstName} dần ổn định và phát triển. Các khoản đầu tư dài hạn sẽ mang lại lợi nhuận.`,
    `Gia đình là nguồn động lực lớn nhất của ${genderPronoun} ${firstName} trong năm nay. Những sự kiện vui vẻ sẽ diễn ra.`,
  ];
  
  const luckyNumbers = Array.from({ length: 4 }, (_, i) => ((seed * (i + 3)) % 49) + 1);
  const luckyColors = ["Đỏ", "Xanh dương", "Vàng", "Tím", "Xanh lá", "Cam", "Hồng", "Trắng", "Đen", "Bạc"];
  const luckyColor = luckyColors[(seed % luckyColors.length)];
  const luckyDays = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
  const luckyDay = luckyDays[(seed % luckyDays.length)];
  
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
  
  // Additional personalized advice based on time of birth
  let timeAdvice = "";
  if (userInfo.timeOfBirth !== "unknown") {
    const timeAdvices = [
      "Giờ sinh của bạn cho thấy bạn là người có trực giác mạnh mẽ.",
      "Sinh vào thời điểm này, bạn có khả năng lãnh đạo tự nhiên.",
      "Giờ sinh mang đến cho bạn sự nhạy cảm và tinh tế.",
      "Bạn được ban tặng sự thông minh và khả năng học hỏi nhanh.",
    ];
    timeAdvice = timeAdvices[((seed + 5) % timeAdvices.length)];
  }
  
  return {
    message,
    timeAdvice,
    luckScore,
    loveScore,
    careerScore,
    financeScore,
    healthScore,
    luckyNumbers: [...new Set(luckyNumbers)].sort((a, b) => a - b).slice(0, 4),
    luckyColor,
    luckyDay,
  };
};

const HoroscopeWidget = () => {
  const { t } = useI18n();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'yearly'>('daily');
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "" as "" | "male" | "female" | "other",
    dateOfBirth: "",
    timeOfBirth: "unknown",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ và tên";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Họ và tên phải có ít nhất 2 ký tự";
    } else if (formData.fullName.trim().length > 100) {
      newErrors.fullName = "Họ và tên không được quá 100 ký tự";
    }
    
    if (!formData.gender) {
      newErrors.gender = "Vui lòng chọn giới tính";
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Vui lòng chọn ngày sinh";
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.dateOfBirth = "Ngày sinh không thể là ngày trong tương lai";
      } else if (birthDate.getFullYear() < 1900) {
        newErrors.dateOfBirth = "Vui lòng nhập năm sinh hợp lệ";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setUserInfo({
        fullName: formData.fullName.trim(),
        gender: formData.gender as "male" | "female" | "other",
        dateOfBirth: formData.dateOfBirth,
        timeOfBirth: formData.timeOfBirth,
      });
    }
  };

  const handleReset = () => {
    setUserInfo(null);
    setFormData({
      fullName: "",
      gender: "",
      dateOfBirth: "",
      timeOfBirth: "unknown",
    });
    setErrors({});
    setTimeFrame('daily');
  };

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

  // Show results if user info is submitted
  if (userInfo) {
    const horoscope = generatePersonalizedHoroscope(userInfo, timeFrame);
    const zodiacSign = getZodiacSign(userInfo.dateOfBirth);
    const age = calculateAge(userInfo.dateOfBirth);
    const today = new Date();
    const birthDate = new Date(userInfo.dateOfBirth);
    const formattedBirthDate = `${birthDate.getDate().toString().padStart(2, '0')}/${(birthDate.getMonth() + 1).toString().padStart(2, '0')}/${birthDate.getFullYear()}`;
    const timeLabel = birthHours.find(h => h.value === userInfo.timeOfBirth)?.label || "Không rõ";
    
    return (
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back") || "Nhập lại thông tin"}
          </Button>
        </div>

        {/* User info summary */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-5xl">{zodiacSign.symbol}</div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl font-bold text-foreground">{userInfo.fullName}</h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                  <Badge variant="secondary">
                    {userInfo.gender === 'male' ? 'Nam' : userInfo.gender === 'female' ? 'Nữ' : 'Khác'}
                  </Badge>
                  <Badge variant="secondary">{age} tuổi</Badge>
                  <Badge variant="outline">{zodiacSign.nameVi}</Badge>
                  <Badge variant="outline">{zodiacSign.elementVi}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Sinh ngày: {formattedBirthDate} • Giờ sinh: {timeLabel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                  <p className="text-foreground leading-relaxed">{horoscope.message}</p>
                </div>
                {horoscope.timeAdvice && (
                  <div className="flex items-start gap-3 pt-3 border-t border-purple-100 dark:border-purple-800">
                    <Clock className="h-5 w-5 text-indigo-500 mt-1 flex-shrink-0" />
                    <p className="text-foreground/80 leading-relaxed text-sm">{horoscope.timeAdvice}</p>
                  </div>
                )}
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
                {renderScoreBar(horoscope.healthScore, "Sức khỏe", <User className="h-4 w-4 text-pink-600" />, "bg-pink-100 dark:bg-pink-900/30")}
              </CardContent>
            </Card>

            {/* Lucky info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Số may mắn</p>
                  <div className="flex justify-center gap-2 flex-wrap">
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

              <Card className="border-0 shadow-md">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Ngày may mắn</p>
                  <Badge variant="secondary" className="text-base">
                    {horoscope.luckyDay}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Show input form
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
          <Star className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Xem tử vi cá nhân</h2>
        <p className="text-muted-foreground">
          Nhập thông tin của bạn để xem tử vi chi tiết dành riêng cho bạn
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Họ và tên <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            placeholder="Nhập họ và tên đầy đủ"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className={errors.fullName ? "border-red-500" : ""}
            maxLength={100}
          />
          {errors.fullName && (
            <p className="text-sm text-red-500">{errors.fullName}</p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Giới tính <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={formData.gender}
            onValueChange={(value) => setFormData({ ...formData, gender: value as typeof formData.gender })}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="cursor-pointer">Nam</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="cursor-pointer">Nữ</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="cursor-pointer">Khác</Label>
            </div>
          </RadioGroup>
          {errors.gender && (
            <p className="text-sm text-red-500">{errors.gender}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Ngày sinh <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className={errors.dateOfBirth ? "border-red-500" : ""}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dateOfBirth && (
            <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Time of Birth */}
        <div className="space-y-2">
          <Label htmlFor="timeOfBirth" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Giờ sinh
          </Label>
          <Select
            value={formData.timeOfBirth}
            onValueChange={(value) => setFormData({ ...formData, timeOfBirth: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn giờ sinh" />
            </SelectTrigger>
            <SelectContent>
              {birthHours.map((hour) => (
                <SelectItem key={hour.value} value={hour.value}>
                  {hour.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Nếu không biết giờ sinh chính xác, bạn có thể chọn "Không rõ"
          </p>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" size="lg">
          <Star className="h-4 w-4 mr-2" />
          Xem tử vi
        </Button>
      </form>
    </div>
  );
};

export default HoroscopeWidget;
