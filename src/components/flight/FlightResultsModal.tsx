import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { X, Plane, Clock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FlightResult {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  seatsLeft: number;
}

interface FlightResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchParams: {
    from: string;
    fromCity: string;
    to: string;
    toCity: string;
    departureDate: Date;
    returnDate?: Date;
    tripType: "one-way" | "round-trip";
    adults: number;
    children: number;
    infants: number;
    cabinClass: string;
  } | null;
}

// Airline data for simulation
const AIRLINES = [
  { code: "VN", name: "Vietnam Airlines", logo: "🇻🇳" },
  { code: "VJ", name: "Vietjet Air", logo: "✈️" },
  { code: "QH", name: "Bamboo Airways", logo: "🎋" },
  { code: "BL", name: "Pacific Airlines", logo: "🌊" },
];

// Generate simulated flight results
const generateFlightResults = (from: string, to: string, date: Date): FlightResult[] => {
  const results: FlightResult[] = [];
  const basePrice = 800000 + Math.random() * 600000;
  
  // Generate 4-8 flights
  const numFlights = 4 + Math.floor(Math.random() * 5);
  
  for (let i = 0; i < numFlights; i++) {
    const airline = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
    const departHour = 5 + Math.floor(Math.random() * 17); // 5AM to 10PM
    const departMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
    const durationMinutes = 90 + Math.floor(Math.random() * 60); // 1.5h to 2.5h
    
    const departTime = new Date(date);
    departTime.setHours(departHour, departMinute, 0, 0);
    
    const arriveTime = new Date(departTime);
    arriveTime.setMinutes(arriveTime.getMinutes() + durationMinutes);
    
    const priceVariation = 0.7 + Math.random() * 0.6;
    const price = Math.round((basePrice * priceVariation) / 10000) * 10000;
    
    results.push({
      id: `${airline.code}${100 + Math.floor(Math.random() * 900)}`,
      airline: airline.name,
      airlineLogo: airline.logo,
      flightNumber: `${airline.code}${100 + Math.floor(Math.random() * 900)}`,
      from,
      fromCity: from,
      to,
      toCity: to,
      departureTime: format(departTime, "HH:mm"),
      arrivalTime: format(arriveTime, "HH:mm"),
      duration: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      price,
      seatsLeft: 1 + Math.floor(Math.random() * 9),
    });
  }
  
  // Sort by price
  return results.sort((a, b) => a.price - b.price);
};

export default function FlightResultsModal({
  open,
  onOpenChange,
  searchParams,
}: FlightResultsModalProps) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<FlightResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !searchParams) return;

    let cancelled = false;
    
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      setResults([]);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      if (cancelled) return;

      try {
        // In production, this would be a real API call
        const flightResults = generateFlightResults(
          searchParams.from,
          searchParams.to,
          searchParams.departureDate
        );

        if (flightResults.length === 0) {
          setError("Không tìm thấy chuyến bay nào cho ngày này. Vui lòng thử ngày khác.");
        } else {
          setResults(flightResults);
        }
      } catch (err) {
        setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();

    return () => {
      cancelled = true;
    };
  }, [open, searchParams]);

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const getCabinClassLabel = (cabinClass: string) => {
    const labels: Record<string, string> = {
      economy: "Phổ thông",
      premium_economy: "Phổ thông đặc biệt",
      business: "Thương gia",
      first: "Hạng nhất",
    };
    return labels[cabinClass] || "Phổ thông";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Plane className="h-5 w-5 text-primary" />
            Kết quả tìm kiếm
          </DialogTitle>
          {searchParams && (
            <div className="text-sm text-muted-foreground mt-1">
              <span className="font-medium">{searchParams.fromCity}</span>
              <span className="mx-2">→</span>
              <span className="font-medium">{searchParams.toCity}</span>
              <span className="mx-2">•</span>
              <span>{format(searchParams.departureDate, "dd/MM/yyyy", { locale: vi })}</span>
              <span className="mx-2">•</span>
              <span>{searchParams.adults + searchParams.children + searchParams.infants} hành khách</span>
              <span className="mx-2">•</span>
              <span>{getCabinClassLabel(searchParams.cabinClass)}</span>
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-4 space-y-3">
            {loading && (
              <>
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Đang tìm kiếm chuyến bay...</span>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                ))}
              </>
            )}

            {!loading && error && (
              <div className="py-12 text-center">
                <div className="text-4xl mb-4">✈️</div>
                <p className="text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => onOpenChange(false)}
                >
                  Thử lại
                </Button>
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <>
                <div className="text-sm text-muted-foreground mb-2">
                  Tìm thấy {results.length} chuyến bay
                </div>
                {results.map((flight, index) => (
                  <div
                    key={flight.id}
                    className={cn(
                      "p-4 border rounded-lg transition-all hover:shadow-md hover:border-primary/50 cursor-pointer",
                      index === 0 && "border-green-500 bg-green-50/50 dark:bg-green-900/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{flight.airlineLogo}</div>
                        <div>
                          <div className="font-medium text-sm">{flight.airline}</div>
                          <div className="text-xs text-muted-foreground">{flight.flightNumber}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-center">
                        <div>
                          <div className="text-lg font-bold">{flight.departureTime}</div>
                          <div className="text-xs text-muted-foreground">{searchParams?.fromCity}</div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {flight.duration}
                          </div>
                          <div className="w-20 h-px bg-border my-1 relative">
                            <Plane className="h-3 w-3 absolute -top-1.5 right-0 text-primary" />
                          </div>
                          <div className="text-xs text-muted-foreground">Bay thẳng</div>
                        </div>

                        <div>
                          <div className="text-lg font-bold">{flight.arrivalTime}</div>
                          <div className="text-xs text-muted-foreground">{searchParams?.toCity}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={cn(
                          "text-lg font-bold",
                          index === 0 ? "text-green-600 dark:text-green-400" : "text-primary"
                        )}>
                          {formatPrice(flight.price)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Còn {flight.seatsLeft} chỗ
                        </div>
                        {index === 0 && (
                          <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                            Giá tốt nhất
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Giá đã bao gồm thuế và phí
                      </div>
                      <Button size="sm" className="h-8">
                        Chọn chuyến bay
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
