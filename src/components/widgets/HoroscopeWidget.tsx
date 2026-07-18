import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Heart, Briefcase, Coins, Sparkles, ArrowLeft, User, Calendar, Clock, Activity, Lightbulb } from "lucide-react";

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
  qualities: string[];
}

const zodiacSigns: ZodiacSign[] = [
  { id: "aries", name: "Aries", nameVi: "Bạch Dương", symbol: "♈", element: "Fire", elementVi: "Hỏa", qualities: ["năng động", "quyết đoán", "nhiệt huyết"] },
  { id: "taurus", name: "Taurus", nameVi: "Kim Ngưu", symbol: "♉", element: "Earth", elementVi: "Thổ", qualities: ["kiên định", "thực tế", "đáng tin cậy"] },
  { id: "gemini", name: "Gemini", nameVi: "Song Tử", symbol: "♊", element: "Air", elementVi: "Khí", qualities: ["linh hoạt", "giao tiếp tốt", "thông minh"] },
  { id: "cancer", name: "Cancer", nameVi: "Cự Giải", symbol: "♋", element: "Water", elementVi: "Thủy", qualities: ["nhạy cảm", "chăm sóc", "trực giác mạnh"] },
  { id: "leo", name: "Leo", nameVi: "Sư Tử", symbol: "♌", element: "Fire", elementVi: "Hỏa", qualities: ["tự tin", "sáng tạo", "hào phóng"] },
  { id: "virgo", name: "Virgo", nameVi: "Xử Nữ", symbol: "♍", element: "Earth", elementVi: "Thổ", qualities: ["tỉ mỉ", "phân tích", "thực tế"] },
  { id: "libra", name: "Libra", nameVi: "Thiên Bình", symbol: "♎", element: "Air", elementVi: "Khí", qualities: ["công bằng", "hài hòa", "ngoại giao"] },
  { id: "scorpio", name: "Scorpio", nameVi: "Bọ Cạp", symbol: "♏", element: "Water", elementVi: "Thủy", qualities: ["sâu sắc", "quyết tâm", "đam mê"] },
  { id: "sagittarius", name: "Sagittarius", nameVi: "Nhân Mã", symbol: "♐", element: "Fire", elementVi: "Hỏa", qualities: ["phiêu lưu", "lạc quan", "triết lý"] },
  { id: "capricorn", name: "Capricorn", nameVi: "Ma Kết", symbol: "♑", element: "Earth", elementVi: "Thổ", qualities: ["kỷ luật", "tham vọng", "bền bỉ"] },
  { id: "aquarius", name: "Aquarius", nameVi: "Bảo Bình", symbol: "♒", element: "Air", elementVi: "Khí", qualities: ["độc lập", "sáng tạo", "nhân văn"] },
  { id: "pisces", name: "Pisces", nameVi: "Song Ngư", symbol: "♓", element: "Water", elementVi: "Thủy", qualities: ["lãng mạn", "trực giác", "nghệ thuật"] },
];

const birthHours = [
  { value: "unknown", label: "Không rõ", chi: null },
  { value: "23-01", label: "Giờ Tý (23:00 - 01:00)", chi: "Tý" },
  { value: "01-03", label: "Giờ Sửu (01:00 - 03:00)", chi: "Sửu" },
  { value: "03-05", label: "Giờ Dần (03:00 - 05:00)", chi: "Dần" },
  { value: "05-07", label: "Giờ Mão (05:00 - 07:00)", chi: "Mão" },
  { value: "07-09", label: "Giờ Thìn (07:00 - 09:00)", chi: "Thìn" },
  { value: "09-11", label: "Giờ Tỵ (09:00 - 11:00)", chi: "Tỵ" },
  { value: "11-13", label: "Giờ Ngọ (11:00 - 13:00)", chi: "Ngọ" },
  { value: "13-15", label: "Giờ Mùi (13:00 - 15:00)", chi: "Mùi" },
  { value: "15-17", label: "Giờ Thân (15:00 - 17:00)", chi: "Thân" },
  { value: "17-19", label: "Giờ Dậu (17:00 - 19:00)", chi: "Dậu" },
  { value: "19-21", label: "Giờ Tuất (19:00 - 21:00)", chi: "Tuất" },
  { value: "21-23", label: "Giờ Hợi (21:00 - 23:00)", chi: "Hợi" },
];

// Get zodiac sign from date of birth
const getZodiacSign = (dateOfBirth: string): ZodiacSign => {
  const date = new Date(dateOfBirth);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return zodiacSigns[0];
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return zodiacSigns[1];
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return zodiacSigns[2];
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return zodiacSigns[3];
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return zodiacSigns[4];
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return zodiacSigns[5];
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return zodiacSigns[6];
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return zodiacSigns[7];
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return zodiacSigns[8];
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return zodiacSigns[9];
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return zodiacSigns[10];
  return zodiacSigns[11];
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

// Generate deterministic hash from string
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Generate personalized horoscope based on user info
const generatePersonalizedHoroscope = (userInfo: UserInfo, type: 'daily' | 'weekly' | 'yearly') => {
  const birthDate = new Date(userInfo.dateOfBirth);
  const today = new Date();
  const zodiac = getZodiacSign(userInfo.dateOfBirth);
  const age = calculateAge(userInfo.dateOfBirth);
  
  // Create unique seed based on all user inputs
  const seedString = `${userInfo.fullName}-${userInfo.gender}-${userInfo.dateOfBirth}-${userInfo.timeOfBirth}-${type}-${today.toDateString()}`;
  const seed = hashString(seedString);
  
  // Birth hour influence
  const birthHourInfo = birthHours.find(h => h.value === userInfo.timeOfBirth);
  const hasBirthHour = userInfo.timeOfBirth !== "unknown";
  
  // Generate scores based on seed (between 6-10 for more realistic readings)
  const generateScore = (offset: number): number => {
    const base = ((seed + offset) % 50) / 10;
    return Math.round((base + 6) * 10) / 10;
  };
  
  const scores = {
    overall: Math.min(10, generateScore(1)),
    love: Math.min(10, generateScore(11)),
    career: Math.min(10, generateScore(21)),
    finance: Math.min(10, generateScore(31)),
    health: Math.min(10, generateScore(41)),
  };

  // Gender-based pronoun and address
  const pronoun = userInfo.gender === 'male' ? 'anh' : userInfo.gender === 'female' ? 'chị' : 'bạn';
  const firstName = userInfo.fullName.split(' ').pop() || userInfo.fullName;

  // Element-based characteristics
  const elementTraits: Record<string, { strength: string; challenge: string; advice: string }> = {
    "Hỏa": { strength: "năng lượng dồi dào và khả năng truyền cảm hứng", challenge: "kiểm soát nóng vội", advice: "tập thiền định hoặc yoga" },
    "Thổ": { strength: "sự ổn định và tính thực tế cao", challenge: "mở lòng với thay đổi", advice: "thử nghiệm điều mới mỗi tuần" },
    "Khí": { strength: "tư duy linh hoạt và khả năng giao tiếp", challenge: "tập trung vào một mục tiêu", advice: "lập danh sách ưu tiên hàng ngày" },
    "Thủy": { strength: "trực giác nhạy bén và sự thấu hiểu", challenge: "giữ ranh giới cảm xúc", advice: "viết nhật ký để giải tỏa" }
  };

  const elementInfo = elementTraits[zodiac.elementVi] || elementTraits["Thổ"];

  // Age-based life phase
  const getLifePhase = (age: number): string => {
    if (age < 25) return "đang trong giai đoạn khám phá và xây dựng nền tảng";
    if (age < 35) return "đang ở giai đoạn phát triển và định hình sự nghiệp";
    if (age < 50) return "đang trong thời kỳ thu hoạch và ổn định";
    return "đang ở giai đoạn trải nghiệm sâu sắc và truyền đạt kinh nghiệm";
  };

  // Time of birth influence
  const getTimeInfluence = (): string => {
    if (!hasBirthHour) return "";
    
    const hourIndex = birthHours.findIndex(h => h.value === userInfo.timeOfBirth);
    const timeInfluences = [
      "Sinh giờ Tý mang đến trí tuệ sắc bén và khả năng thích nghi cao trong bóng tối, giúp bạn nhìn thấy cơ hội mà người khác bỏ lỡ.",
      "Sinh giờ Sửu ban tặng sự kiên nhẫn và bền bỉ, giúp bạn hoàn thành những dự án dài hơi.",
      "Sinh giờ Dần mang năng lượng mạnh mẽ của hổ, cho bạn sự dũng cảm đối mặt thử thách.",
      "Sinh giờ Mão ban cho bạn sự tinh tế và nhạy cảm với nghệ thuật và cái đẹp.",
      "Sinh giờ Thìn kết nối bạn với năng lượng rồng, mang đến may mắn và quyền lực tiềm ẩn.",
      "Sinh giờ Tỵ trao cho bạn trí tuệ sâu sắc và khả năng phán đoán chính xác.",
      "Sinh giờ Ngọ mang đến sức sống tràn đầy và tinh thần lạc quan không ngừng.",
      "Sinh giờ Mùi ban tặng sự dịu dàng và khả năng nuôi dưỡng những mối quan hệ.",
      "Sinh giờ Thân cho bạn sự thông minh và khéo léo trong xử lý tình huống.",
      "Sinh giờ Dậu mang đến sự chính xác và khả năng quản lý thời gian xuất sắc.",
      "Sinh giờ Tuất ban cho bạn lòng trung thành và khả năng bảo vệ người thân yêu.",
      "Sinh giờ Hợi trao cho bạn sự may mắn về tài lộc và khả năng tận hưởng cuộc sống.",
    ];
    
    return timeInfluences[hourIndex - 1] || "";
  };

  // Generate content for each section based on type
  const generateContent = () => {
    const periodLabel = type === 'daily' ? 'hôm nay' : type === 'weekly' ? 'tuần này' : `năm ${today.getFullYear()}`;
    const periodContext = type === 'daily' ? 'ngày' : type === 'weekly' ? 'tuần' : 'năm';

    // Overview variations based on score
    const overviewTemplates = {
      high: [
        `${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} ${firstName}, với tính cách ${zodiac.qualities.join(", ")} đặc trưng của cung ${zodiac.nameVi}, ${periodLabel} là thời điểm thuận lợi để bạn phát huy tối đa ${elementInfo.strength}. Năng lượng của bạn ${periodContext} này rất mạnh mẽ và ổn định.`,
        `${periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)} mang đến những tín hiệu tích cực cho ${pronoun} ${firstName}. Cung ${zodiac.nameVi} thuộc hành ${zodiac.elementVi} đang được các sao chiếu rọi thuận lợi, tạo điều kiện để bạn tiến xa hơn trong mọi lĩnh vực.`,
      ],
      medium: [
        `${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} ${firstName}, ${periodLabel} là ${periodContext} cần sự cân bằng. Với bản chất ${zodiac.qualities[0]} của cung ${zodiac.nameVi}, bạn cần chú ý đến việc ${elementInfo.challenge} để đạt được kết quả tốt nhất.`,
        `Năng lượng ${periodContext} này có sự dao động nhất định với ${pronoun} ${firstName}. Là người ${zodiac.nameVi}, bạn nên tập trung vào những gì trong tầm kiểm soát và kiên nhẫn với những điều chưa thể thay đổi ngay.`,
      ],
      low: [
        `${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} ${firstName}, ${periodLabel} có thể mang đến một số thử thách cần vượt qua. Tuy nhiên, với ${elementInfo.strength} của người ${zodiac.nameVi}, bạn hoàn toàn có thể biến khó khăn thành cơ hội học hỏi.`,
        `Đây là ${periodContext} để ${pronoun} ${firstName} tập trung vào nội lực. Cung ${zodiac.nameVi} hành ${zodiac.elementVi} cần thời gian để tái tạo năng lượng và chuẩn bị cho giai đoạn thuận lợi sắp tới.`,
      ],
    };

    const overviewLevel = scores.overall >= 8 ? 'high' : scores.overall >= 6.5 ? 'medium' : 'low';
    const overview = overviewTemplates[overviewLevel][(seed % 2)];

    // Career content
    const careerTemplates = {
      high: [
        `Sự nghiệp ${periodLabel} hứa hẹn nhiều bước tiến quan trọng. Với ${age} tuổi, ${pronoun} ${firstName} ${getLifePhase(age)}. Đây là thời điểm tốt để đề xuất ý tưởng mới hoặc đảm nhận dự án quan trọng.`,
        `Công việc ${periodContext} này rất thuận lợi. Khả năng ${zodiac.qualities[1]} của ${pronoun} sẽ được cấp trên và đồng nghiệp ghi nhận. Hãy tự tin thể hiện năng lực.`,
      ],
      medium: [
        `Sự nghiệp ${periodLabel} ổn định, cần kiên nhẫn để thấy kết quả. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} ${firstName} nên tập trung hoàn thành công việc hiện tại thay vì mở rộng quá nhiều.`,
        `Công việc có thể gặp một số trở ngại nhỏ, nhưng không ảnh hưởng đáng kể. Hãy giữ thái độ chuyên nghiệp và tiếp tục cố gắng.`,
      ],
      low: [
        `Sự nghiệp ${periodLabel} cần thận trọng hơn bình thường. Tránh đưa ra quyết định quan trọng khi chưa có đủ thông tin. Hãy dành thời gian lắng nghe và học hỏi.`,
        `Công việc có thể gặp áp lực, nhưng đây là cơ hội để ${pronoun} ${firstName} rèn luyện kỹ năng giải quyết vấn đề. Nhờ sự hỗ trợ khi cần thiết.`,
      ],
    };

    const careerLevel = scores.career >= 8 ? 'high' : scores.career >= 6.5 ? 'medium' : 'low';
    const career = careerTemplates[careerLevel][(seed % 2)];

    // Finance content
    const financeTemplates = {
      high: [
        `Tài chính ${periodLabel} có nhiều tín hiệu tích cực. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} ${firstName} có thể nhận được tin vui về thu nhập hoặc cơ hội đầu tư có lợi. Tuy nhiên, vẫn nên cân nhắc kỹ trước khi chi tiêu lớn.`,
        `Tiền bạc ${periodContext} này khá hanh thông. Những nỗ lực trước đây bắt đầu mang lại kết quả. Đây là lúc tốt để tiết kiệm hoặc đầu tư dài hạn.`,
      ],
      medium: [
        `Tài chính ${periodLabel} ở mức ổn định, không có biến động lớn. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} ${firstName} nên giữ nguyên kế hoạch chi tiêu đã đề ra và tránh mạo hiểm.`,
        `Tiền bạc ${periodContext} này cần quản lý chặt chẽ hơn. Hạn chế mua sắm theo cảm xúc và tập trung vào những khoản thiết yếu.`,
      ],
      low: [
        `Tài chính ${periodLabel} cần thận trọng đặc biệt. Tránh cho vay tiền hoặc đầu tư vào những dự án chưa rõ ràng. Ưu tiên tiết kiệm và giảm chi tiêu không cần thiết.`,
        `Tiền bạc có thể gặp một số áp lực ${periodContext} này. Hãy lập kế hoạch chi tiêu chi tiết và tuân thủ nghiêm ngặt để tránh khó khăn tài chính.`,
      ],
    };

    const financeLevel = scores.finance >= 8 ? 'high' : scores.finance >= 6.5 ? 'medium' : 'low';
    const finance = financeTemplates[financeLevel][(seed % 2)];

    // Love content with gender consideration
    const loveTemplates = {
      high: [
        userInfo.gender === 'male' 
          ? `Tình cảm ${periodLabel} rất thuận lợi. Nếu đang trong mối quan hệ, anh ${firstName} sẽ có nhiều khoảnh khắc ngọt ngào với đối phương. Nếu còn độc thân, đây là thời điểm tốt để mở lòng và kết nối.`
          : userInfo.gender === 'female'
          ? `Tình cảm ${periodLabel} mang đến nhiều niềm vui. Chị ${firstName} tỏa sáng thu hút, dễ nhận được sự quan tâm từ người xung quanh. Hãy trân trọng những mối quan hệ hiện tại.`
          : `Tình cảm ${periodLabel} rất tích cực. Bạn ${firstName} có thể gặp được người thú vị hoặc củng cố mối quan hệ hiện tại. Hãy mở lòng và chia sẻ nhiều hơn.`,
        `Chuyện tình cảm ${periodContext} này có nhiều chuyển biến tốt đẹp. Sự ${zodiac.qualities[2]} của ${pronoun} sẽ giúp mối quan hệ thêm gắn bó và sâu sắc.`,
      ],
      medium: [
        `Tình cảm ${periodLabel} cần sự kiên nhẫn và thấu hiểu. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} ${firstName} nên dành thời gian lắng nghe đối phương thay vì chỉ tập trung vào bản thân.`,
        `Chuyện tình cảm ${periodContext} này khá bình lặng. Đây là cơ hội để ${pronoun} nhìn lại và đánh giá những gì mình thực sự mong muốn trong tình yêu.`,
      ],
      low: [
        `Tình cảm ${periodLabel} có thể gặp sóng gió nhỏ. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} ${firstName} nên tránh tranh cãi và giữ bình tĩnh khi có bất đồng. Sự nhẫn nhịn sẽ giúp mọi thứ ổn hơn.`,
        `Chuyện tình cảm cần thận trọng ${periodContext} này. Hãy tập trung vào việc hiểu bản thân trước khi đòi hỏi người khác phải hiểu mình.`,
      ],
    };

    const loveLevel = scores.love >= 8 ? 'high' : scores.love >= 6.5 ? 'medium' : 'low';
    const love = loveTemplates[loveLevel][(seed % 2)];

    // Health content
    const healthTemplates = {
      high: [
        `Sức khỏe ${periodLabel} rất tốt. Năng lượng dồi dào giúp ${pronoun} ${firstName} hoàn thành nhiều việc. Hãy tận dụng thời điểm này để xây dựng thói quen tập luyện đều đặn.`,
        `Thể chất và tinh thần ${periodContext} này ở trạng thái cân bằng. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} cảm thấy khỏe khoắn và tràn đầy sinh lực. Duy trì chế độ ăn uống lành mạnh.`,
      ],
      medium: [
        `Sức khỏe ${periodLabel} ở mức ổn. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} ${firstName} nên chú ý nghỉ ngơi đủ giấc và không làm việc quá sức. Bổ sung vitamin và uống đủ nước.`,
        `Thể chất ${periodContext} này cần được quan tâm hơn. Hãy dành thời gian cho việc thư giãn và ${elementInfo.advice}.`,
      ],
      low: [
        `Sức khỏe ${periodLabel} cần được chú ý đặc biệt. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} ${firstName} có thể cảm thấy mệt mỏi hoặc căng thẳng. Hạn chế thức khuya và ưu tiên nghỉ ngơi.`,
        `Thể chất và tinh thần ${periodContext} này có thể suy giảm nếu không chăm sóc đúng cách. Hãy ${elementInfo.advice} để cân bằng năng lượng.`,
      ],
    };

    const healthLevel = scores.health >= 8 ? 'high' : scores.health >= 6.5 ? 'medium' : 'low';
    const health = healthTemplates[healthLevel][(seed % 2)];

    // Personalized advice based on all factors
    const adviceBase = [
      `Với tính cách ${zodiac.qualities[0]} và ${zodiac.qualities[1]}, ${pronoun} ${firstName} nên ${elementInfo.advice} để phát huy tối đa tiềm năng ${periodContext} này.`,
      `Là người ${zodiac.nameVi} hành ${zodiac.elementVi}, điểm mạnh của ${pronoun} là ${elementInfo.strength}. Hãy sử dụng điều này để vượt qua thử thách.`,
      `Ở độ tuổi ${age}, ${pronoun} ${firstName} ${getLifePhase(age)}. Hãy tận dụng kinh nghiệm và sự ${zodiac.qualities[0]} để tiến về phía trước.`,
    ];

    const advice = [
      adviceBase[(seed % 3)],
      `• Nên làm: Tập trung vào công việc quan trọng, giao tiếp cởi mở với người thân`,
      `• Cần tránh: ${elementInfo.challenge}, quyết định vội vàng khi thiếu thông tin`,
      `• Gợi ý: ${elementInfo.advice.charAt(0).toUpperCase() + elementInfo.advice.slice(1)} sẽ giúp ${pronoun} duy trì sự cân bằng`,
    ];

    // Lucky items
    const luckyNumbers = Array.from({ length: 4 }, (_, i) => ((seed * (i + 3)) % 49) + 1);
    const luckyColors = ["Đỏ", "Xanh dương", "Vàng", "Tím", "Xanh lá", "Cam", "Hồng", "Trắng", "Đen", "Bạc", "Vàng kim", "Xanh ngọc"];
    const luckyDirections = ["Đông", "Tây", "Nam", "Bắc", "Đông Bắc", "Đông Nam", "Tây Bắc", "Tây Nam"];

    return {
      overview,
      career,
      finance,
      love,
      health,
      advice,
      timeInfluence: getTimeInfluence(),
      scores,
      luckyNumbers: [...new Set(luckyNumbers)].sort((a, b) => a - b).slice(0, 4),
      luckyColor: luckyColors[(seed % luckyColors.length)],
      luckyDirection: luckyDirections[(seed % luckyDirections.length)],
    };
  };

  return generateContent();
};

const HoroscopeWidget = () => {
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
          <span className="text-sm font-semibold text-foreground">{score.toFixed(1)}/10</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              score >= 8 ? 'bg-green-500' : score >= 6.5 ? 'bg-yellow-500' : 'bg-orange-500'
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
    const birthDate = new Date(userInfo.dateOfBirth);
    const formattedBirthDate = `${birthDate.getDate().toString().padStart(2, '0')}/${(birthDate.getMonth() + 1).toString().padStart(2, '0')}/${birthDate.getFullYear()}`;
    const timeLabel = birthHours.find(h => h.value === userInfo.timeOfBirth)?.label || "Không rõ";
    const today = new Date();
    
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
            Nhập lại thông tin
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
            {/* Overview */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Tổng quan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground leading-relaxed">{horoscope.overview}</p>
                {horoscope.timeInfluence && (
                  <div className="flex items-start gap-3 pt-3 border-t border-border">
                    <Clock className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <p className="text-foreground/80 leading-relaxed text-sm">{horoscope.timeInfluence}</p>
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
                {renderScoreBar(horoscope.scores.overall, "Tổng quan", <Star className="h-4 w-4 text-yellow-600" />, "bg-yellow-100 dark:bg-yellow-900/30")}
                {renderScoreBar(horoscope.scores.love, "Tình cảm", <Heart className="h-4 w-4 text-red-600" />, "bg-red-100 dark:bg-red-900/30")}
                {renderScoreBar(horoscope.scores.career, "Sự nghiệp", <Briefcase className="h-4 w-4 text-blue-600" />, "bg-blue-100 dark:bg-blue-900/30")}
                {renderScoreBar(horoscope.scores.finance, "Tài chính", <Coins className="h-4 w-4 text-green-600" />, "bg-green-100 dark:bg-green-900/30")}
                {renderScoreBar(horoscope.scores.health, "Sức khỏe", <Activity className="h-4 w-4 text-pink-600" />, "bg-pink-100 dark:bg-pink-900/30")}
              </CardContent>
            </Card>

            {/* Detailed sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Career */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    Công việc / Sự nghiệp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 leading-relaxed">{horoscope.career}</p>
                </CardContent>
              </Card>

              {/* Finance */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Coins className="h-4 w-4 text-green-500" />
                    Tài chính
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 leading-relaxed">{horoscope.finance}</p>
                </CardContent>
              </Card>

              {/* Love */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Tình cảm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 leading-relaxed">{horoscope.love}</p>
                </CardContent>
              </Card>

              {/* Health */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-pink-500" />
                    Sức khỏe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 leading-relaxed">{horoscope.health}</p>
                </CardContent>
              </Card>
            </div>

            {/* Advice */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Lời khuyên cụ thể
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {horoscope.advice.map((item, index) => (
                  <p key={index} className={`text-sm ${index === 0 ? 'text-foreground font-medium' : 'text-foreground/80'} leading-relaxed`}>
                    {item}
                  </p>
                ))}
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
                  <p className="text-sm text-muted-foreground mb-2">Hướng may mắn</p>
                  <Badge variant="secondary" className="text-base">
                    {horoscope.luckyDirection}
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800 leading-relaxed">
        <strong>Lưu ý:</strong> Kết quả hiện tại được sinh theo thuật toán nội bộ (deterministic theo ngày sinh) — <em>chưa phải dữ liệu tử vi thật</em>. Để lấy nội dung tử vi + hình ảnh từng cung theo ngày, cần API bên thứ ba (ví dụ: aztro, horoscope-app-api) hoặc key OpenAI/Gemini để sinh nội dung hàng ngày. Bạn xác nhận nguồn dữ liệu muốn dùng, mình sẽ tích hợp.
      </div>
      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor="fullName" className="text-[13px] font-medium">
          Họ và tên <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fullName"
          placeholder="Nhập họ và tên đầy đủ"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className={`h-10 ${errors.fullName ? "border-red-500" : ""}`}
          maxLength={100}
        />
        {errors.fullName && (
          <p className="text-xs text-red-500">{errors.fullName}</p>
        )}
      </div>

      {/* Gender */}
      <div className="space-y-1.5">
        <Label className="text-[13px] font-medium">
          Giới tính <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={formData.gender}
          onValueChange={(value) => setFormData({ ...formData, gender: value as typeof formData.gender })}
          className="flex flex-wrap gap-5 pt-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male" className="cursor-pointer text-sm font-normal">Nam</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female" className="cursor-pointer text-sm font-normal">Nữ</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="other" id="other" />
            <Label htmlFor="other" className="cursor-pointer text-sm font-normal">Khác</Label>
          </div>
        </RadioGroup>
        {errors.gender && (
          <p className="text-xs text-red-500">{errors.gender}</p>
        )}
      </div>

      {/* Date + Time of Birth (2 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth" className="text-[13px] font-medium">
            Ngày sinh <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className={`h-10 ${errors.dateOfBirth ? "border-red-500" : ""}`}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dateOfBirth && (
            <p className="text-xs text-red-500">{errors.dateOfBirth}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="timeOfBirth" className="text-[13px] font-medium">Giờ sinh</Label>
          <Select
            value={formData.timeOfBirth}
            onValueChange={(value) => setFormData({ ...formData, timeOfBirth: value })}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Không rõ" />
            </SelectTrigger>
            <SelectContent>
              {birthHours.map((hour) => (
                <SelectItem key={hour.value} value={hour.value}>
                  {hour.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full h-10 mt-1">
        Xem tử vi
      </Button>
    </form>
  );
};


export default HoroscopeWidget;
