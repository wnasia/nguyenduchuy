import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle2, Ban, Sun, Moon } from "lucide-react";

// Vietnamese Lunar Calendar Calculation
// Based on traditional Âm lịch algorithms

interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
  canChi: string; // Can Chi name for the year
}

interface DayInfo {
  solarDate: Date;
  lunarDate: LunarDate;
  luckyHours: string[];
  isGoodDay: boolean;
  goodActivities: string[];
  badActivities: string[];
}

// Thiên Can (Heavenly Stems)
const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];

// Địa Chi (Earthly Branches)
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

// Giờ hoàng đạo time ranges
const GIO_HOANG_DAO_TIMES: Record<string, string> = {
  "Tý": "23:00–01:00",
  "Sửu": "01:00–03:00",
  "Dần": "03:00–05:00",
  "Mão": "05:00–07:00",
  "Thìn": "07:00–09:00",
  "Tỵ": "09:00–11:00",
  "Ngọ": "11:00–13:00",
  "Mùi": "13:00–15:00",
  "Thân": "15:00–17:00",
  "Dậu": "17:00–19:00",
  "Tuất": "19:00–21:00",
  "Hợi": "21:00–23:00"
};

// Lunar calendar constants
const PI = Math.PI;
const LUNAR_MONTH_DAYS = [29, 30]; // Lunar months alternate between 29 and 30 days

// New moon calculation constants
const NEW_MOON_BASE = 2415021; // JD of a known new moon (1900/1/1)
const SYNODIC_MONTH = 29.530588853; // Average lunar month

function getJulianDayNumber(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getNewMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  const JDE = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T4;
  const M = (2.5534 + 29.10535669 * k - 0.0000218 * T2 - 0.00000011 * T3) * PI / 180;
  const Mprime = (201.5643 + 385.81693528 * k + 0.0107438 * T2 + 0.00001239 * T3 - 0.000000058 * T4) * PI / 180;
  const F = (160.7108 + 390.67050274 * k - 0.0016341 * T2 - 0.00000227 * T3 + 0.000000011 * T4) * PI / 180;
  const correction = -0.40720 * Math.sin(Mprime)
    + 0.17241 * Math.sin(M)
    + 0.01608 * Math.sin(2 * Mprime)
    + 0.01039 * Math.sin(2 * F);
  return JDE + correction;
}

function getSunLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const T2 = T * T;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T2) * PI / 180;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(M)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
    + 0.000289 * Math.sin(3 * M);
  const theta = L0 + C;
  return ((theta % 360) + 360) % 360;
}

function getLunarMonth11(year: number): number {
  const off = getJulianDayNumber(year, 12, 31) - NEW_MOON_BASE;
  let k = Math.floor(off / SYNODIC_MONTH);
  let nm = getNewMoon(k);
  const sunLong = Math.floor(getSunLongitude(nm) / 30);
  if (sunLong >= 9) {
    nm = getNewMoon(k - 1);
  }
  return Math.floor(nm + 0.5);
}

function getLeapMonthOffset(a11: number): number {
  let k = Math.floor((a11 - NEW_MOON_BASE) / SYNODIC_MONTH + 0.5);
  let last = 0;
  let i = 1;
  let arc = Math.floor(getSunLongitude(getNewMoon(k + i)) / 30);
  while (arc !== last && i < 14) {
    last = arc;
    i++;
    arc = Math.floor(getSunLongitude(getNewMoon(k + i)) / 30);
  }
  return i - 1;
}

function solarToLunar(year: number, month: number, day: number): LunarDate {
  const jd = getJulianDayNumber(year, month, day);
  const a11 = getLunarMonth11(year);
  const b11 = getLunarMonth11(year - 1);
  
  let lunarYear = year;
  let lunarMonth: number;
  let lunarDay: number;
  let isLeap = false;
  
  let k = Math.floor((jd - b11) / SYNODIC_MONTH + 0.5);
  let off = jd - getNewMoon(Math.floor((b11 - NEW_MOON_BASE) / SYNODIC_MONTH + 0.5) + k);
  
  if (off < 0) {
    k--;
    off = jd - getNewMoon(Math.floor((b11 - NEW_MOON_BASE) / SYNODIC_MONTH + 0.5) + k);
  }
  
  lunarDay = Math.floor(off) + 1;
  
  const diff = Math.floor((a11 - b11) / SYNODIC_MONTH + 0.5);
  let leapMonthOffset = 0;
  
  if (diff > 12) {
    leapMonthOffset = getLeapMonthOffset(b11);
    if (k >= leapMonthOffset) {
      lunarMonth = k - 1;
      if (k === leapMonthOffset) {
        isLeap = true;
      }
    } else {
      lunarMonth = k;
    }
    
    if (lunarMonth >= 11) {
      lunarMonth = lunarMonth - 12;
      lunarYear = year;
    } else {
      lunarMonth = lunarMonth + 1;
      lunarYear = year - 1;
    }
  } else {
    lunarMonth = k + 11 - diff;
    if (lunarMonth > 11) {
      lunarMonth = lunarMonth - 12;
      lunarYear = year;
    } else {
      lunarYear = year - 1;
    }
  }
  
  // Adjust for correct lunar month
  if (lunarMonth < 1) lunarMonth += 12;
  if (lunarMonth > 12) lunarMonth -= 12;
  
  // Calculate Can Chi for the year
  const canIndex = (lunarYear + 6) % 10;
  const chiIndex = (lunarYear + 8) % 12;
  const canChi = `${THIEN_CAN[canIndex]} ${DIA_CHI[chiIndex]}`;
  
  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: isLeap,
    canChi
  };
}

// Calculate giờ hoàng đạo based on lunar date
function getLuckyHours(lunarDay: number): string[] {
  // Traditional calculation based on lunar day
  // The 12 hours rotate through 6-hour cycles of lucky/unlucky
  const dayType = lunarDay % 6;
  
  const luckyHoursMap: Record<number, string[]> = {
    1: ["Tý", "Sửu", "Thìn", "Tỵ", "Mùi", "Tuất"],
    2: ["Dần", "Mão", "Ngọ", "Mùi", "Dậu", "Hợi"],
    3: ["Tý", "Sửu", "Thìn", "Tỵ", "Thân", "Dậu"],
    4: ["Dần", "Mão", "Ngọ", "Mùi", "Tuất", "Hợi"],
    5: ["Tý", "Sửu", "Thìn", "Tỵ", "Mùi", "Tuất"],
    0: ["Dần", "Mão", "Ngọ", "Mùi", "Dậu", "Hợi"]
  };
  
  return luckyHoursMap[dayType] || luckyHoursMap[1];
}

// Determine if day is good based on lunar calculations
function isGoodDay(lunarDay: number, lunarMonth: number): boolean {
  // Traditional Vietnamese unlucky days (ngày xấu)
  const unluckyDays = [1, 7, 13, 18, 22, 28]; // Simplified rule
  const lunarDayMod = lunarDay % 30;
  
  // Check against traditional bad days
  if (unluckyDays.includes(lunarDayMod)) {
    return false;
  }
  
  // Days 2, 3, 8, 9, 14, 15, 20, 21, 26, 27 are generally good
  const goodDays = [2, 3, 8, 9, 14, 15, 20, 21, 26, 27];
  return goodDays.includes(lunarDayMod);
}

// Get activities for the day
function getActivities(lunarDay: number, lunarMonth: number, isGood: boolean): { good: string[]; bad: string[] } {
  // Activities based on lunar day patterns
  const goodActivitiesPool = [
    "Khai trương", "Ký hợp đồng", "Xuất hành", "Cầu tài", "Giao dịch",
    "Cưới hỏi", "Động thổ", "Nhập trạch", "Khai nghiệp", "Cầu phúc",
    "Học hành", "Xin việc", "Mua xe", "Mua nhà", "Dọn nhà"
  ];
  
  const badActivitiesPool = [
    "Tranh chấp", "Kiện tụng", "Phá dỡ", "Đào móng", "Chôn cất",
    "Đi xa", "Vay mượn", "Xuất tiền", "Mở cửa hàng", "Ký kết"
  ];
  
  const dayMod = lunarDay % 5;
  const start = dayMod * 3;
  
  if (isGood) {
    return {
      good: goodActivitiesPool.slice(start, start + 4),
      bad: badActivitiesPool.slice(start, start + 2)
    };
  } else {
    return {
      good: goodActivitiesPool.slice(start, start + 2),
      bad: badActivitiesPool.slice(start, start + 4)
    };
  }
}

function getDayInfo(date: Date): DayInfo {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const lunarDate = solarToLunar(year, month, day);
  const luckyHourNames = getLuckyHours(lunarDate.day);
  const isGood = isGoodDay(lunarDate.day, lunarDate.month);
  const activities = getActivities(lunarDate.day, lunarDate.month, isGood);
  
  return {
    solarDate: date,
    lunarDate,
    luckyHours: luckyHourNames,
    isGoodDay: isGood,
    goodActivities: activities.good,
    badActivities: activities.bad
  };
}

// Get Vietnamese day of week
function getVietnameseDayOfWeek(date: Date): string {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return days[date.getDay()];
}

export default function LunarCalendarWidget() {
  const [dayInfo, setDayInfo] = useState<DayInfo | null>(null);

  useEffect(() => {
    // Use Vietnam timezone (UTC+7)
    const now = new Date();
    const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    setDayInfo(getDayInfo(vnTime));
    
    // Update at midnight VN time
    const updateAtMidnight = () => {
      const now = new Date();
      const vnNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      const tomorrow = new Date(vnNow);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - vnNow.getTime();
      
      return setTimeout(() => {
        setDayInfo(getDayInfo(new Date()));
        updateAtMidnight();
      }, msUntilMidnight);
    };
    
    const timeoutId = updateAtMidnight();
    return () => clearTimeout(timeoutId);
  }, []);

  if (!dayInfo) return null;

  const { solarDate, lunarDate, luckyHours, isGoodDay: goodDay, goodActivities, badActivities } = dayInfo;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-primary/90 to-primary px-4 py-3">
        <div className="flex items-center gap-2 text-primary-foreground">
          <Calendar className="h-5 w-5" />
          <h3 className="font-semibold">Lịch Âm – Dương</h3>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Solar Date */}
        <div className="text-center pb-3 border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sun className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Dương lịch</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {getVietnameseDayOfWeek(solarDate)}, {solarDate.getDate().toString().padStart(2, '0')}/{(solarDate.getMonth() + 1).toString().padStart(2, '0')}/{solarDate.getFullYear()}
          </p>
        </div>
        
        {/* Lunar Date */}
        <div className="text-center pb-3 border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Moon className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-muted-foreground">Âm lịch</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            Ngày {lunarDate.day} tháng {lunarDate.month}{lunarDate.leap ? " (nhuận)" : ""} năm {lunarDate.canChi}
          </p>
        </div>
        
        {/* Lucky Hours */}
        <div className="pb-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Giờ hoàng đạo</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {luckyHours.slice(0, 4).map((hour) => (
              <span 
                key={hour}
                className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-xs font-medium text-primary"
              >
                {hour} ({GIO_HOANG_DAO_TIMES[hour]})
              </span>
            ))}
          </div>
          {luckyHours.length > 4 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {luckyHours.slice(4).map((hour) => (
                <span 
                  key={hour}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-xs font-medium text-primary"
                >
                  {hour} ({GIO_HOANG_DAO_TIMES[hour]})
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Day Status */}
        <div className="pb-3 border-b border-border">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${
            goodDay 
              ? "bg-green-500/10 text-green-700 dark:text-green-400" 
              : "bg-red-500/10 text-red-700 dark:text-red-400"
          }`}>
            {goodDay ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium text-sm">Ngày tốt – Đại cát</span>
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" />
                <span className="font-medium text-sm">Ngày bình thường – Tiểu hung</span>
              </>
            )}
          </div>
        </div>
        
        {/* Activities */}
        <div className="space-y-3">
          {/* Good Activities */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground">Nên làm</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {goodActivities.map((activity, index) => (
                <span 
                  key={index}
                  className="inline-block px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-700 dark:text-green-400"
                >
                  {activity}
                </span>
              ))}
            </div>
          </div>
          
          {/* Bad Activities */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Ban className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-medium text-muted-foreground">Kiêng kỵ</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {badActivities.map((activity, index) => (
                <span 
                  key={index}
                  className="inline-block px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-700 dark:text-red-400"
                >
                  {activity}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
