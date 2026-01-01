import { useState, useEffect, useCallback, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

// Generate simulated prices for demo (in production, this would call a real API)
const generateSimulatedPrices = (from: string, to: string, month: Date): DayPrice[] => {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const today = startOfDay(new Date());
  
  // Base prices for different routes (simulated)
  const routePrices: Record<string, number> = {
    "HAN-SGN": 1200000,
    "SGN-HAN": 1150000,
    "HAN-DAD": 850000,
    "DAD-HAN": 800000,
    "SGN-DAD": 750000,
    "DAD-SGN": 720000,
    "HAN-PQC": 1400000,
    "SGN-PQC": 950000,
    "HAN-CXR": 1100000,
    "SGN-CXR": 650000,
  };
  
  const routeKey = `${from}-${to}`;
  const reverseKey = `${to}-${from}`;
  const basePrice = routePrices[routeKey] || routePrices[reverseKey] || 1000000;
  
  return days.map((date) => {
    // Past dates are not available
    if (isBefore(date, today)) {
      return { date, price: null, available: false };
    }
    
    const dayOfWeek = getDay(date);
    const dayOfMonth = date.getDate();
    
    // Weekends are more expensive
    let priceMultiplier = 1;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      priceMultiplier = 1.2 + Math.random() * 0.3;
    } else if (dayOfWeek === 5) {
      priceMultiplier = 1.1 + Math.random() * 0.2;
    } else {
      priceMultiplier = 0.85 + Math.random() * 0.3;
    }
    
    // Add some variation based on day of month
    const dayVariation = Math.sin(dayOfMonth / 5) * 0.1;
    priceMultiplier += dayVariation;
    
    // Some days might not have flights (10% chance)
    if (Math.random() < 0.05) {
      return { date, price: null, available: false };
    }
    
    const price = Math.round(basePrice * priceMultiplier / 10000) * 10000;
    
    return { date, price, available: true };
  });
};

export default function FlightPriceCalendar({
  from,
  to,
  month,
  onDaySelect,
}: FlightPriceCalendarProps) {
  const [prices, setPrices] = useState<DayPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch prices when route or month changes
  useEffect(() => {
    let cancelled = false;
    
    const fetchPrices = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      if (cancelled) return;
      
      // In production, replace this with actual API call
      const simulatedPrices = generateSimulatedPrices(from, to, month);
      setPrices(simulatedPrices);
      setLoading(false);
    };
    
    fetchPrices();
    
    return () => {
      cancelled = true;
    };
  }, [from, to, month]);

  // Find cheapest price
  const cheapestPrice = useMemo(() => {
    const availablePrices = prices.filter(p => p.price !== null).map(p => p.price!);
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
          const isPast = !available && dayPrice !== undefined;
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
      {cheapestPrice && (
        <div className="text-center text-xs text-muted-foreground">
          Giá rẻ nhất: <span className="font-semibold text-green-600 dark:text-green-400">{cheapestPrice.toLocaleString('vi-VN')}đ</span>
        </div>
      )}
    </div>
  );
}
