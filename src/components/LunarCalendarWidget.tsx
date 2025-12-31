import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle2, Ban, Sun, Moon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  solarToLunar,
  getYearCanChi,
  getDayCanChi,
  getLuckyHours,
  isGoodDay,
  getDayActivities,
  getVietnameseDayOfWeek,
  dateToJd,
  GIO_HOANG_DAO_TIMES,
  type LunarDate
} from "@/lib/vietnameseLunar";
import LunarCalendarFull from "./LunarCalendarFull";

interface DayInfo {
  solarDate: Date;
  lunarDate: LunarDate;
  yearCanChi: string;
  dayCanChi: string;
  luckyHours: string[];
  isGoodDay: boolean;
  goodActivities: string[];
  badActivities: string[];
}

function getDayInfo(date: Date): DayInfo {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const lunarDate = solarToLunar(year, month, day);
  const jd = dateToJd(year, month, day);
  const luckyHourNames = getLuckyHours(jd);
  const isGood = isGoodDay(lunarDate.day);
  const activities = getDayActivities(lunarDate.day, isGood);
  
  return {
    solarDate: date,
    lunarDate,
    yearCanChi: getYearCanChi(lunarDate.year),
    dayCanChi: getDayCanChi(jd),
    luckyHours: luckyHourNames,
    isGoodDay: isGood,
    goodActivities: activities.good,
    badActivities: activities.bad
  };
}

export default function LunarCalendarWidget() {
  const [dayInfo, setDayInfo] = useState<DayInfo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        const newVnTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        setDayInfo(getDayInfo(newVnTime));
        updateAtMidnight();
      }, msUntilMidnight);
    };
    
    const timeoutId = updateAtMidnight();
    return () => clearTimeout(timeoutId);
  }, []);

  if (!dayInfo) return null;

  const { solarDate, lunarDate, yearCanChi, dayCanChi, luckyHours, isGoodDay: goodDay, goodActivities, badActivities } = dayInfo;

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
            Ngày {lunarDate.day} tháng {lunarDate.month}{lunarDate.leap ? " (nhuận)" : ""}
          </p>
          <p className="text-base text-muted-foreground">
            Năm {yearCanChi} ({lunarDate.year})
          </p>
          <p className="text-sm text-primary mt-1">
            {dayCanChi}
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
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          }`}>
            {goodDay ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium text-sm">Ngày tốt – Đại cát</span>
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" />
                <span className="font-medium text-sm">Ngày bình thường</span>
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
        
        {/* View Full Calendar Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full mt-2 gap-2">
              <Calendar className="h-4 w-4" />
              Xem lịch tháng
              <ExternalLink className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <LunarCalendarFull />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
