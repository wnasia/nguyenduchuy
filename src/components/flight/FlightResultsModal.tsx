import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { X, Plane, Clock, Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
  stops?: number;
  priceBreakdown?: {
    base: number;
    taxes: number;
    total: number;
    currency: string;
  };
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

      try {
        // Call the edge function with real API
        const { data, error: fetchError } = await supabase.functions.invoke('flight-search', {
          body: {
            from: searchParams.from,
            to: searchParams.to,
            departureDate: format(searchParams.departureDate, 'yyyy-MM-dd'),
            returnDate: searchParams.returnDate ? format(searchParams.returnDate, 'yyyy-MM-dd') : undefined,
            adults: searchParams.adults,
            children: searchParams.children,
            infants: searchParams.infants,
            cabinClass: searchParams.cabinClass,
            currencyCode: 'VND',
          },
        });

        if (cancelled) return;

        if (fetchError) {
          console.error('Flight search error:', fetchError);
          setError('Không thể kết nối đến hệ thống tìm kiếm chuyến bay. Vui lòng thử lại sau.');
          return;
        }

        if (!data?.success) {
          setError(data?.error || 'Đã có lỗi xảy ra khi tìm kiếm chuyến bay.');
          return;
        }

        if (!data.flights || data.flights.length === 0) {
          setError('Không tìm thấy chuyến bay nào cho ngày này. Vui lòng thử ngày khác hoặc tuyến bay khác.');
          return;
        }

        // Sort by price
        const sortedFlights = data.flights.sort((a: FlightResult, b: FlightResult) => a.price - b.price);
        setResults(sortedFlights);
      } catch (err) {
        console.error('Flight search exception:', err);
        if (!cancelled) {
          setError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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

  const getStopsLabel = (stops: number | undefined) => {
    if (stops === undefined || stops === 0) return "Bay thẳng";
    if (stops === 1) return "1 điểm dừng";
    return `${stops} điểm dừng`;
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
                  <span className="ml-3 text-muted-foreground">Đang tìm kiếm chuyến bay từ Amadeus...</span>
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
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Đóng
                </Button>
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <>
                <div className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                  <span>Tìm thấy {results.length} chuyến bay</span>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                    Giá đã bao gồm thuế & phí
                  </span>
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
                          <div className="text-xs text-muted-foreground">{flight.from}</div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {flight.duration}
                          </div>
                          <div className="w-20 h-px bg-border my-1 relative">
                            <Plane className="h-3 w-3 absolute -top-1.5 right-0 text-primary" />
                          </div>
                          <div className="text-xs text-muted-foreground">{getStopsLabel(flight.stops)}</div>
                        </div>

                        <div>
                          <div className="text-lg font-bold">{flight.arrivalTime}</div>
                          <div className="text-xs text-muted-foreground">{flight.to}</div>
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
                        {flight.priceBreakdown && (
                          <span>
                            Giá vé: {formatPrice(flight.priceBreakdown.base)} + Thuế phí: {formatPrice(flight.priceBreakdown.taxes)}
                          </span>
                        )}
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
