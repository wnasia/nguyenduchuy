import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  solarToLunar,
  getYearCanChi,
  getDayCanChi,
  dateToJd,
  getMonthDays,
  type LunarDate
} from "@/lib/vietnameseLunar";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEKDAYS_FULL = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

interface DayCell {
  date: Date | null;
  solar: { day: number; month: number; year: number } | null;
  lunar: LunarDate | null;
  dayCanChi: string;
  isToday: boolean;
  isWeekend: boolean;
  isCurrentMonth: boolean;
}

export default function LunarCalendarFull() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);

  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDay(null);
  };

  // Get days for the calendar grid
  const monthDays = getMonthDays(currentYear, currentMonth);
  
  // Create the calendar grid (6 weeks x 7 days)
  const calendarGrid: DayCell[] = [];
  
  // Get the first day of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
  // In JS, getDay() returns 0 for Sunday, but we want Monday first
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;
  
  // Add empty cells for days before the first of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    const prevDate = new Date(currentYear, currentMonth - 1, -startDayOfWeek + i + 1);
    const jd = dateToJd(prevDate.getFullYear(), prevDate.getMonth() + 1, prevDate.getDate());
    const lunar = solarToLunar(prevDate.getFullYear(), prevDate.getMonth() + 1, prevDate.getDate());
    
    calendarGrid.push({
      date: prevDate,
      solar: { day: prevDate.getDate(), month: prevDate.getMonth() + 1, year: prevDate.getFullYear() },
      lunar,
      dayCanChi: getDayCanChi(jd),
      isToday: false,
      isWeekend: prevDate.getDay() === 0 || prevDate.getDay() === 6,
      isCurrentMonth: false
    });
  }
  
  // Add the days of the current month
  monthDays.forEach(day => {
    calendarGrid.push({
      ...day,
      isCurrentMonth: true
    });
  });
  
  // Fill the rest with next month's days
  const remainingDays = 42 - calendarGrid.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const nextDate = new Date(currentYear, currentMonth, i);
    const jd = dateToJd(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
    const lunar = solarToLunar(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
    
    calendarGrid.push({
      date: nextDate,
      solar: { day: nextDate.getDate(), month: nextDate.getMonth() + 1, year: nextDate.getFullYear() },
      lunar,
      dayCanChi: getDayCanChi(jd),
      isToday: false,
      isWeekend: nextDate.getDay() === 0 || nextDate.getDay() === 6,
      isCurrentMonth: false
    });
  }

  // Get lunar month for the current solar month (use middle of month as reference)
  const midMonthLunar = solarToLunar(currentYear, currentMonth, 15);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevMonth}
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold">
              LỊCH ÂM {MONTHS[currentMonth - 1].toUpperCase()} NĂM {currentYear}
            </h2>
            <p className="text-sm text-green-100 mt-1">
              Năm {getYearCanChi(midMonthLunar.year)} • Tháng {midMonthLunar.month} Âm lịch
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="text-white hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Today button */}
        <div className="flex justify-center pb-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={goToToday}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Hôm nay
          </Button>
        </div>
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-green-800">
          {WEEKDAYS_FULL.map((day, index) => (
            <div
              key={day}
              className={`py-2 text-center text-sm font-semibold ${
                index >= 5 ? "text-yellow-300" : "text-white"
              }`}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{WEEKDAYS[index]}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border border-border">
        {calendarGrid.map((day, index) => {
          if (!day.lunar || !day.solar) return null;
          
          const isLunarNewMonth = day.lunar.day === 1;
          const isSelected = selectedDay?.date?.getTime() === day.date?.getTime();
          
          return (
            <div
              key={index}
              onClick={() => setSelectedDay(day)}
              className={`
                relative min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border-b border-r border-border cursor-pointer
                transition-colors hover:bg-primary/5
                ${!day.isCurrentMonth ? "bg-muted/30" : "bg-card"}
                ${day.isToday ? "ring-2 ring-primary ring-inset" : ""}
                ${isSelected ? "bg-primary/10" : ""}
                ${day.isWeekend && day.isCurrentMonth ? "bg-green-50 dark:bg-green-950/20" : ""}
              `}
            >
              {/* Solar day */}
              <div className={`
                text-lg sm:text-xl font-bold
                ${!day.isCurrentMonth ? "text-muted-foreground/50" : ""}
                ${day.isWeekend && day.isCurrentMonth ? "text-orange-600 dark:text-orange-400" : "text-foreground"}
                ${day.isToday ? "text-primary" : ""}
              `}>
                {day.solar.day}
              </div>
              
              {/* Lunar day/month */}
              <div className={`
                text-xs sm:text-sm
                ${!day.isCurrentMonth ? "text-muted-foreground/40" : "text-muted-foreground"}
                ${isLunarNewMonth ? "text-red-500 font-semibold" : ""}
              `}>
                {isLunarNewMonth 
                  ? `${day.lunar.day}/${day.lunar.month}`
                  : day.lunar.day
                }
              </div>
              
              {/* Can Chi */}
              <div className={`
                text-[10px] sm:text-xs mt-0.5
                ${!day.isCurrentMonth ? "text-muted-foreground/30" : "text-primary/70"}
              `}>
                {day.dayCanChi}
              </div>
              
              {/* Today indicator */}
              {day.isToday && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
              )}
              
              {/* Lunar new month dot */}
              {isLunarNewMonth && !day.isToday && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Selected Day Details */}
      {selectedDay && selectedDay.lunar && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
          <h3 className="font-semibold text-lg mb-2">
            Ngày {selectedDay.solar?.day}/{selectedDay.solar?.month}/{selectedDay.solar?.year}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Âm lịch:</span>{" "}
              <span className="font-medium">
                Ngày {selectedDay.lunar.day} tháng {selectedDay.lunar.month}
                {selectedDay.lunar.leap ? " (nhuận)" : ""} năm {getYearCanChi(selectedDay.lunar.year)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Can Chi ngày:</span>{" "}
              <span className="font-medium text-primary">{selectedDay.dayCanChi}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Hôm nay</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Đầu tháng âm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 border border-border" />
          <span>Cuối tuần</span>
        </div>
      </div>
    </div>
  );
}
