import { useState, useEffect, useCallback, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlightPriceCalendarProps {
  from: string;
  to: string;
  month: Date;
  onDaySelect: (date: Date) => void;
}

interface DayPrice {
  date: Date;
  price: number | null;
  available: boolean;
}

// Format price in VND
const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}tr`;
  }
  return `${(price / 1000).toFixed(0)}k`;
};

export default function FlightPriceCalendar({
  from,
  to,
  month,
  onDaySelect,
}: FlightPriceCalendarProps) {
  const [prices, setPrices] = useState<DayPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch prices from real API
  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const monthStr = format(month, 'yyyy-MM');
    
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('flight-search?action=month-prices', {
        body: {
          from,
          to,
          month: monthStr,
          adults: 1,
        },
      });

      if (fetchError) {
        console.error('Month prices fetch error:', fetchError);
        setError('Không thể tải giá vé. Vui lòng thử lại.');
        setLoading(false);
        return;
      }

      if (!data?.success) {
        setError(data?.error || 'Không tìm thấy giá vé cho tháng này.');
        setLoading(false);
        return;
      }

      // Transform API response to DayPrice array
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const days = eachDayOfInterval({ start, end });
      const today = startOfDay(new Date());
      
      const pricesData = data.prices || {};
      
      const dayPrices: DayPrice[] = days.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const price = pricesData[dateStr];
        const isPast = isBefore(date, today);
        
        return {
          date,
          price: isPast ? null : (typeof price === 'number' ? price : null),
          available: !isPast && typeof price === 'number' && price > 0,
        };
      });
      
      setPrices(dayPrices);
    } catch (err) {
      console.error('Month prices exception:', err);
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [from, to, month]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Find cheapest price
  const cheapestPrice = useMemo(() => {
    const availablePrices = prices.filter(p => p.price !== null && p.price > 0).map(p => p.price!);
    return availablePrices.length > 0 ? Math.min(...availablePrices) : null;
  }, [prices]);

  const handleDayClick = useCallback((dayPrice: DayPrice) => {
    if (!dayPrice.available || dayPrice.price === null) return;
    
    setSelectedDate(dayPrice.date);
    onDaySelect(dayPrice.date);
  }, [onDaySelect]);

  // Get days to display in calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    
    // Add empty slots for days before the first of the month
    const startDayOfWeek = getDay(start);
    const emptySlots = Array(startDayOfWeek).fill(null);
    
    return [...emptySlots, ...days];
  }, [month]);

  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array(35).fill(null).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
        <div className="text-center text-xs text-muted-foreground">
          Đang tải giá từ Amadeus API...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchPrices}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="text-center text-sm font-medium text-foreground mb-2">
        {format(month, "MMMM yyyy", { locale: vi })}
      </div>
      
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, index) => (
          <div 
            key={day} 
            className={cn(
              "text-center text-xs font-medium py-1",
              index === 0 ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }
          
          const dayPrice = prices.find(p => isSameDay(p.date, day));
          const price = dayPrice?.price;
          const available = dayPrice?.available ?? false;
          const isCheapest = price !== null && price === cheapestPrice;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isSunday = getDay(day) === 0;
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => dayPrice && handleDayClick(dayPrice)}
              disabled={!available}
              className={cn(
                "aspect-square rounded-lg p-1 flex flex-col items-center justify-center text-xs transition-all",
                "hover:ring-2 hover:ring-primary/50",
                available && "cursor-pointer",
                !available && "cursor-not-allowed opacity-40",
                isCheapest && available && "bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500",
                isSelected && "ring-2 ring-primary bg-primary/10",
                isToday(day) && !isSelected && !isCheapest && "bg-muted",
                isSunday && "text-destructive"
              )}
            >
              <span className={cn(
                "font-medium",
                isToday(day) && "text-primary"
              )}>
                {format(day, "d")}
              </span>
              {available && price !== null ? (
                <span className={cn(
                  "text-[10px] leading-tight",
                  isCheapest ? "text-green-600 dark:text-green-400 font-semibold" : "text-muted-foreground"
                )}>
                  {formatPrice(price)}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">—</span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 ring-1 ring-green-500" />
          <span>Giá rẻ nhất</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary/10 ring-1 ring-primary" />
          <span>Đã chọn</span>
        </div>
      </div>
      
      {/* Info */}
      <div className="text-center space-y-1">
        {cheapestPrice && (
          <div className="text-xs text-muted-foreground">
            Giá rẻ nhất: <span className="font-semibold text-green-600 dark:text-green-400">{cheapestPrice.toLocaleString('vi-VN')}đ</span>
          </div>
        )}
        <div className="text-[10px] text-muted-foreground">
          Giá đã bao gồm thuế & phí • Nguồn: Amadeus API
        </div>
      </div>
    </div>
  );
}
