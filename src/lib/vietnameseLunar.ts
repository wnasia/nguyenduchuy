/**
 * Vietnamese Lunar Calendar Calculation
 * Based on Ho Ngoc Duc's algorithm (https://www.informatik.uni-leipzig.de/~duc/amlich/)
 * Source adapted from: https://github.com/tiendat77/vietnamese-lunar-calendar
 */

export const PI = Math.PI;

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

/* Discard the fractional part of a number */
function INT(d: number): number {
  return Math.floor(d);
}

/**
 * Compute the (integral) Julian day number of day dd/mm/yyyy
 * Formula from http://www.tondering.dk/claus/calendar.html
 */
export function jdFromDate(day: number, month: number, year: number): number {
  const a = INT((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  let jd = day + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) {
    jd = day + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  }

  return jd;
}

/**
 * Convert a Julian day number to Date
 */
export function jdToDate(jd: number): Date {
  let a, b, c;

  if (jd > 2299160) {
    a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }

  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  const day = e - INT((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * INT(m / 10);
  const year = b * 100 + d - 4800 + INT(m / 10);

  return new Date(year, month - 1, day);
}

// Alias for compatibility
export function dateToJd(year: number, month: number, day: number): number {
  return jdFromDate(day, month, year);
}

/**
 * Compute the longitude of the sun at any time
 * Algorithm from: "Astronomical Algorithms" by Jean Meeus, 1998
 */
function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;

  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);

  let L = L0 + DL;
  L = L * dr;
  L = L - PI * 2 * (INT(L / (PI * 2)));

  return L;
}

/**
 * Compute sun position at midnight of the day with the given Julian day number.
 * Returns a number between 0 and 11.
 */
function getSunLongitude(jdn: number, timezone: number): number {
  return INT(sunLongitude(jdn - 0.5 - timezone / 24) / PI * 6);
}

/**
 * Compute the time of the k-th new moon after the new moon of 1/1/1900 13:52 UCT
 * Algorithm from: "Astronomical Algorithms" by Jean Meeus, 1998
 */
function NewMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;

  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);

  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;

  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));

  let deltat: number;
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }

  return Jd1 + C1 - deltat;
}

/**
 * Get the Julian day number of the new moon
 */
function getNewMoon(k: number, timezone: number): number {
  return INT(NewMoon(k) + 0.5 + timezone / 24);
}

/**
 * Find the day that starts the lunar month 11 of the given year
 */
function getLunarMonth11(year: number, timezone: number): number {
  const off = jdFromDate(31, 12, year) - 2415021;
  const k = INT(off / 29.530588853);
  const nm = getNewMoon(k, timezone);
  const sunLong = getSunLongitude(nm, timezone);
  return sunLong >= 9 ? getNewMoon(k - 1, timezone) : nm;
}

/**
 * Find the index of the leap month after the month starting on the day a11
 */
function getLeapMonthOffset(a11: number, timezone: number): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);

  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoon(k + i, timezone), timezone);

  do {
    i++;
    last = arc;
    arc = getSunLongitude(getNewMoon(k + i, timezone), timezone);
  } while (arc !== last && i < 14);

  return i - 1;
}

/**
 * Convert solar date dd/mm/yyyy to the corresponding lunar date
 * This is the core algorithm from Ho Ngoc Duc
 */
export function solarToLunar(year: number, month: number, day: number, timezone: number = 7): LunarDate {
  const dayNumber = jdFromDate(day, month, year);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoon(k + 1, timezone);

  if (monthStart > dayNumber) {
    monthStart = getNewMoon(k, timezone);
  }

  let a11 = getLunarMonth11(year, timezone);
  let b11 = a11;
  let lunarYear: number;

  if (a11 >= monthStart) {
    lunarYear = year;
    a11 = getLunarMonth11(year - 1, timezone);
  } else {
    lunarYear = year + 1;
    b11 = getLunarMonth11(year + 1, timezone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;

  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timezone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = true;
      }
    }
  }

  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }

  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: lunarLeap,
    jd: dayNumber
  };
}

/**
 * Convert lunar date to solar date
 */
export function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, lunarLeap: boolean, timezone: number = 7): Date {
  let a11: number;
  let b11: number;

  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timezone);
    b11 = getLunarMonth11(lunarYear, timezone);
  } else {
    a11 = getLunarMonth11(lunarYear, timezone);
    b11 = getLunarMonth11(lunarYear + 1, timezone);
  }

  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) {
    off += 12;
  }

  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timezone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) {
      leapMonth += 12;
    }

    if (lunarLeap && lunarMonth !== leapMonth) {
      return new Date(0, 0, 0);
    } else if (lunarLeap || off >= leapOff) {
      off += 1;
    }
  }

  const monthStart = getNewMoon(k + off, timezone);
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
  const yearCan = (lunarYear + 6) % 10;
  let monthCanStart: number;

  if (yearCan === 0 || yearCan === 5) {
    monthCanStart = 6;
  } else if (yearCan === 1 || yearCan === 6) {
    monthCanStart = 8;
  } else if (yearCan === 2 || yearCan === 7) {
    monthCanStart = 0;
  } else if (yearCan === 3 || yearCan === 8) {
    monthCanStart = 2;
  } else {
    monthCanStart = 4;
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
  const jd = jdFromDate(day, month, year);

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

  const patterns: Record<number, number[]> = {
    0: [0, 1, 4, 5, 8, 9],
    1: [2, 3, 6, 7, 10, 11],
    2: [0, 1, 4, 5, 8, 9],
    3: [2, 3, 6, 7, 10, 11],
    4: [0, 1, 4, 5, 8, 9],
    5: [2, 3, 6, 7, 10, 11],
    6: [0, 1, 4, 5, 8, 9],
    7: [2, 3, 6, 7, 10, 11],
    8: [0, 1, 4, 5, 8, 9],
    9: [2, 3, 6, 7, 10, 11],
    10: [0, 1, 4, 5, 8, 9],
    11: [2, 3, 6, 7, 10, 11]
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
    const jd = jdFromDate(day, month, year);
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

// ========== TEST FUNCTIONS ==========
// Verified test cases for Vietnamese lunar calendar

export function runLunarCalendarTests(): void {
  console.log("=== Vietnamese Lunar Calendar Test Cases ===\n");
  
  // Test case 1: Tết Nguyên Đán 2024 (Year of Dragon)
  // Solar: 10/02/2024 = Lunar: 01/01/2024 (Giáp Thìn)
  const tet2024 = solarToLunar(2024, 2, 10);
  console.log("Test 1: Tết 2024 (10/02/2024)");
  console.log(`  Expected: Ngày 1 tháng 1 năm Giáp Thìn`);
  console.log(`  Got: Ngày ${tet2024.day} tháng ${tet2024.month} năm ${getYearCanChi(tet2024.year)}`);
  console.log(`  PASS: ${tet2024.day === 1 && tet2024.month === 1}\n`);
  
  // Test case 2: Tết Nguyên Đán 2025 (Year of Snake)
  // Solar: 29/01/2025 = Lunar: 01/01/2025 (Ất Tỵ)
  const tet2025 = solarToLunar(2025, 1, 29);
  console.log("Test 2: Tết 2025 (29/01/2025)");
  console.log(`  Expected: Ngày 1 tháng 1 năm Ất Tỵ`);
  console.log(`  Got: Ngày ${tet2025.day} tháng ${tet2025.month} năm ${getYearCanChi(tet2025.year)}`);
  console.log(`  PASS: ${tet2025.day === 1 && tet2025.month === 1}\n`);
  
  // Test case 3: Tết Nguyên Đán 2026 (Year of Horse)
  // Solar: 17/02/2026 = Lunar: 01/01/2026 (Bính Ngọ)
  const tet2026 = solarToLunar(2026, 2, 17);
  console.log("Test 3: Tết 2026 (17/02/2026)");
  console.log(`  Expected: Ngày 1 tháng 1 năm Bính Ngọ`);
  console.log(`  Got: Ngày ${tet2026.day} tháng ${tet2026.month} năm ${getYearCanChi(tet2026.year)}`);
  console.log(`  PASS: ${tet2026.day === 1 && tet2026.month === 1}\n`);
  
  // Test case 4: Today's date (01/01/2026)
  const today = solarToLunar(2026, 1, 1);
  console.log("Test 4: 01/01/2026");
  console.log(`  Got: Ngày ${today.day} tháng ${today.month} năm ${getYearCanChi(today.year)}`);
  console.log(`  Year should be Ất Tỵ (Snake), lunar month should be 11 or 12`);
  console.log(`  Day should be between 1-30\n`);
  
  // Validate no negative values
  console.log("=== Validation Checks ===");
  console.log(`Day is valid (1-30): ${today.day >= 1 && today.day <= 30}`);
  console.log(`Month is valid (1-12): ${today.month >= 1 && today.month <= 12}`);
  console.log(`Year is reasonable: ${today.year >= 2020 && today.year <= 2030}`);
}
