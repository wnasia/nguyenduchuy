/**
 * Vietnamese Lunar Calendar Calculation
 * Based on Ho Ngoc Duc's algorithm (https://www.informatik.uni-leipzig.de/~duc/amlich/)
 * This is the most accurate and widely used Vietnamese lunar calendar algorithm
 */

const PI = Math.PI;

// Thiên Can (Heavenly Stems)
export const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];

// Địa Chi (Earthly Branches)
export const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

// Giờ hoàng đạo time ranges
export const GIO_HOANG_DAO_TIMES: Record<string, string> = {
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

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
  jd: number;
}

export interface CanChiInfo {
  dayCanChi: string;
  monthCanChi: string;
  yearCanChi: string;
}

/**
 * Convert Julian day number to date
 */
export function jdToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  const a = z < 2299161 ? z : Math.floor((z - 1867216.25) / 36524.25);
  const aa = z < 2299161 ? z : z + 1 + a - Math.floor(a / 4);
  const b = aa + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  
  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  
  return new Date(year, month - 1, day);
}

/**
 * Convert date to Julian day number
 */
export function dateToJd(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  
  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4);
  
  if (year * 10000 + month * 100 + day >= 15821015) {
    jd = jd - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  } else {
    jd = jd - 32083;
  }
  
  return jd;
}

/**
 * Calculate the sun's longitude at a given Julian day number
 * Using the simplified formula with VN timezone (UTC+7)
 */
function sunLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  
  // Mean longitude of the Sun
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
  
  // Mean anomaly of the Sun
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T2;
  
  // Equation of center
  const C = (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(M * dr) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * M * dr) +
            0.000289 * Math.sin(3 * M * dr);
  
  // True longitude of the Sun
  const theta = L0 + C;
  
  // Normalize to [0, 360)
  return ((theta % 360) + 360) % 360;
}

/**
 * Calculate sun longitude in normalized radians, return the major term (0-11)
 */
function getSunLongitude(jd: number, timeZone: number): number {
  return Math.floor(sunLongitude(jd - 0.5 - timeZone / 24) / 30);
}

/**
 * Calculate the Julian day number of the new moon
 * k = 0 for new moon of Jan 2000
 */
function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  
  let jd1 = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T * T3;
  
  const M = 2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3;
  const Mpr = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T * T3;
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T * T3;
  
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr) + 0.0104 * Math.sin(dr * 2 * F);
  C1 = C1 - 0.0051 * Math.sin(dr * (M + Mpr)) - 0.0074 * Math.sin(dr * (M - Mpr));
  C1 = C1 + 0.0004 * Math.sin(dr * (2 * F + M)) - 0.0004 * Math.sin(dr * (2 * F - M));
  C1 = C1 - 0.0006 * Math.sin(dr * (2 * F + Mpr)) + 0.0010 * Math.sin(dr * (2 * F - Mpr));
  C1 = C1 + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  
  let deltat: number;
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  
  return jd1 + C1 - deltat;
}

/**
 * Get the Julian day of the k-th new moon after J2000.0
 * Taking into account the timezone
 */
function getNewMoonDay(k: number, timeZone: number): number {
  return Math.floor(newMoon(k) + 0.5 + timeZone / 24);
}

/**
 * Get the lunar month 11 of the given year
 */
function getLunarMonth11(year: number, timeZone: number): number {
  const off = dateToJd(year, 12, 31) - 2415021; // Days since Jan 1, 1900
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  
  return nm;
}

/**
 * Get the leap month offset for a lunar year
 */
function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last: number;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  
  return i - 1;
}

/**
 * Convert solar date to lunar date
 */
export function solarToLunar(year: number, month: number, day: number, timeZone: number = 7): LunarDate {
  const jd = dateToJd(year, month, day);
  const a11 = getLunarMonth11(year, timeZone);
  const b11 = getLunarMonth11(year - 1, timeZone);
  
  let lunarYear: number;
  let lunarMonth: number;
  let lunarDay: number;
  let lunarLeap: boolean;
  
  // Determine if jd is in the current year or previous year
  let off = jd - b11;
  
  if (off < 0) {
    // Use previous year's month 11
    return solarToLunar(year - 1, month, day, timeZone);
  }
  
  // Find the lunar month containing jd
  const k = Math.floor(0.5 + (b11 - 2415021.076998695) / 29.530588853);
  let monthStart = b11;
  
  // Find which lunar month jd falls into
  let i = 0;
  while (monthStart <= jd) {
    i++;
    monthStart = getNewMoonDay(k + i, timeZone);
  }
  monthStart = getNewMoonDay(k + i - 1, timeZone);
  
  const diff = Math.round((a11 - b11) / 29);
  
  let leapMonthDiff = 0;
  let isLeapMonth = false;
  
  if (diff >= 13) {
    // This lunar year has a leap month
    leapMonthDiff = getLeapMonthOffset(b11, timeZone);
    
    if (i - 1 >= leapMonthDiff) {
      lunarMonth = i - 1 - 1;
      if (i - 1 === leapMonthDiff) {
        isLeapMonth = true;
      }
    } else {
      lunarMonth = i - 1;
    }
    
    if (lunarMonth > 12) {
      lunarMonth = lunarMonth - 12;
    }
    if (lunarMonth >= 11 && diff < 4) {
      lunarYear = year - 1;
    } else {
      lunarYear = year;
    }
  } else {
    lunarMonth = (i - 1 + 11) % 12;
    if (lunarMonth === 0) lunarMonth = 12;
    
    if (i - 1 > diff + 1) {
      // Month belongs to current year
      lunarYear = year;
    } else {
      lunarYear = year - 1;
    }
  }
  
  lunarDay = jd - monthStart + 1;
  lunarLeap = isLeapMonth;
  
  // Adjust for months calculation - fix the off-by-one issues
  if (lunarMonth <= 0) {
    lunarMonth = 12 + lunarMonth;
    lunarYear = lunarYear - 1;
  }
  
  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: lunarLeap,
    jd
  };
}

/**
 * Convert lunar date to solar date
 */
export function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, lunarLeap: boolean, timeZone: number = 7): Date {
  let a11: number;
  let b11: number;
  
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear, timeZone);
    b11 = getLunarMonth11(lunarYear - 1, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear + 1, timeZone);
    b11 = getLunarMonth11(lunarYear, timeZone);
  }
  
  const k = Math.floor(0.5 + (b11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) {
    off += 12;
  }
  
  const diff = Math.round((a11 - b11) / 29);
  
  if (diff >= 13) {
    const leapMonthDiff = getLeapMonthOffset(b11, timeZone);
    if (off >= leapMonthDiff) {
      off += 1;
    }
    if (lunarLeap && off === leapMonthDiff) {
      off += 1;
    }
  }
  
  const monthStart = getNewMoonDay(k + off, timeZone);
  return jdToDate(monthStart + lunarDay - 1);
}

/**
 * Get Can Chi for year
 */
export function getYearCanChi(lunarYear: number): string {
  const canIndex = (lunarYear + 6) % 10;
  const chiIndex = (lunarYear + 8) % 12;
  return `${THIEN_CAN[canIndex]} ${DIA_CHI[chiIndex]}`;
}

/**
 * Get Can Chi for day based on Julian day
 */
export function getDayCanChi(jd: number): string {
  const canIndex = (jd + 9) % 10;
  const chiIndex = (jd + 1) % 12;
  return `${THIEN_CAN[canIndex]} ${DIA_CHI[chiIndex]}`;
}

/**
 * Get Can Chi for month
 */
export function getMonthCanChi(lunarMonth: number, lunarYear: number): string {
  // Month can depends on year can
  const yearCan = (lunarYear + 6) % 10;
  let monthCanStart: number;
  
  if (yearCan === 0 || yearCan === 5) {
    monthCanStart = 6; // Bính
  } else if (yearCan === 1 || yearCan === 6) {
    monthCanStart = 8; // Mậu
  } else if (yearCan === 2 || yearCan === 7) {
    monthCanStart = 0; // Canh
  } else if (yearCan === 3 || yearCan === 8) {
    monthCanStart = 2; // Nhâm
  } else {
    monthCanStart = 4; // Giáp
  }
  
  const monthCanIndex = (monthCanStart + lunarMonth - 1) % 10;
  const monthChiIndex = (lunarMonth + 1) % 12;
  
  return `${THIEN_CAN[monthCanIndex]} ${DIA_CHI[monthChiIndex]}`;
}

/**
 * Get complete Can Chi info for a date
 */
export function getCanChiInfo(year: number, month: number, day: number): CanChiInfo {
  const lunar = solarToLunar(year, month, day);
  const jd = dateToJd(year, month, day);
  
  return {
    dayCanChi: getDayCanChi(jd),
    monthCanChi: getMonthCanChi(lunar.month, lunar.year),
    yearCanChi: getYearCanChi(lunar.year)
  };
}

/**
 * Get lucky hours (giờ hoàng đạo) based on day's Chi
 */
export function getLuckyHours(jd: number): string[] {
  const chiIndex = (jd + 1) % 12;
  
  // Giờ hoàng đạo patterns based on day Chi
  const patterns: Record<number, number[]> = {
    0: [0, 1, 4, 5, 8, 9],     // Tý
    1: [2, 3, 6, 7, 10, 11],   // Sửu  
    2: [0, 1, 4, 5, 8, 9],     // Dần
    3: [2, 3, 6, 7, 10, 11],   // Mão
    4: [0, 1, 4, 5, 8, 9],     // Thìn
    5: [2, 3, 6, 7, 10, 11],   // Tỵ
    6: [0, 1, 4, 5, 8, 9],     // Ngọ
    7: [2, 3, 6, 7, 10, 11],   // Mùi
    8: [0, 1, 4, 5, 8, 9],     // Thân
    9: [2, 3, 6, 7, 10, 11],   // Dậu
    10: [0, 1, 4, 5, 8, 9],    // Tuất
    11: [2, 3, 6, 7, 10, 11]   // Hợi
  };
  
  return patterns[chiIndex].map(i => DIA_CHI[i]);
}

/**
 * Vietnamese day of week names
 */
export function getVietnameseDayOfWeek(date: Date): string {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return days[date.getDay()];
}

/**
 * Check if a day is considered "good" based on traditional rules
 */
export function isGoodDay(lunarDay: number): boolean {
  // Days generally considered good: 1, 2, 4, 5, 8, 9, 10, 14, 16, 18, 20, 25, 26
  const goodDays = [1, 2, 4, 5, 8, 9, 10, 14, 16, 18, 20, 25, 26];
  return goodDays.includes(lunarDay);
}

/**
 * Get recommended and avoided activities for a day
 */
export function getDayActivities(lunarDay: number, isGood: boolean): { good: string[]; bad: string[] } {
  const goodActivitiesPool = [
    "Khai trương", "Ký hợp đồng", "Xuất hành", "Cầu tài", "Giao dịch",
    "Cưới hỏi", "Nhập trạch", "Khai nghiệp", "Cầu phúc", "Học hành",
    "Xin việc", "Mua xe", "Mua nhà", "Dọn nhà", "Động thổ"
  ];
  
  const badActivitiesPool = [
    "Tranh chấp", "Kiện tụng", "Phá dỡ", "Chôn cất", "Đi xa",
    "Vay mượn", "Xuất tiền", "Mở cửa hàng", "Mai táng", "An táng"
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

/**
 * Get all days in a month with lunar info
 */
export function getMonthDays(year: number, month: number): Array<{
  date: Date;
  solar: { day: number; month: number; year: number };
  lunar: LunarDate;
  dayCanChi: string;
  isToday: boolean;
  isWeekend: boolean;
}> {
  const days: Array<{
    date: Date;
    solar: { day: number; month: number; year: number };
    lunar: LunarDate;
    dayCanChi: string;
    isToday: boolean;
    isWeekend: boolean;
  }> = [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const jd = dateToJd(year, month, day);
    const lunar = solarToLunar(year, month, day);
    
    days.push({
      date,
      solar: { day, month, year },
      lunar,
      dayCanChi: getDayCanChi(jd),
      isToday: date.getTime() === today.getTime(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    });
  }
  
  return days;
}
