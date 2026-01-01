import { useState, useCallback } from "react";
import { Plane, Users, ChevronDown, ArrowRightLeft, Calendar as CalendarIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import FlightPriceCalendar from "./FlightPriceCalendar";

// Vietnamese airports data
const AIRPORTS = [
  { code: "HAN", name: "Hà Nội", fullName: "Sân bay Nội Bài" },
  { code: "SGN", name: "TP. Hồ Chí Minh", fullName: "Sân bay Tân Sơn Nhất" },
  { code: "DAD", name: "Đà Nẵng", fullName: "Sân bay Đà Nẵng" },
  { code: "CXR", name: "Nha Trang", fullName: "Sân bay Cam Ranh" },
  { code: "PQC", name: "Phú Quốc", fullName: "Sân bay Phú Quốc" },
  { code: "VDO", name: "Vân Đồn", fullName: "Sân bay Vân Đồn" },
  { code: "HPH", name: "Hải Phòng", fullName: "Sân bay Cát Bi" },
  { code: "VII", name: "Vinh", fullName: "Sân bay Vinh" },
  { code: "HUI", name: "Huế", fullName: "Sân bay Phú Bài" },
  { code: "VCL", name: "Chu Lai", fullName: "Sân bay Chu Lai" },
  { code: "UIH", name: "Quy Nhơn", fullName: "Sân bay Phù Cát" },
  { code: "BMV", name: "Buôn Ma Thuột", fullName: "Sân bay Buôn Ma Thuột" },
  { code: "DLI", name: "Đà Lạt", fullName: "Sân bay Liên Khương" },
  { code: "VCA", name: "Cần Thơ", fullName: "Sân bay Cần Thơ" },
];

const CABIN_CLASSES = [
  { value: "economy", label: "Phổ thông" },
  { value: "premium_economy", label: "Phổ thông đặc biệt" },
  { value: "business", label: "Thương gia" },
  { value: "first", label: "Hạng nhất" },
];

export default function FlightSearchWidget() {
  const [tripType, setTripType] = useState<"one-way" | "round-trip">("round-trip");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState("economy");
  const [showMonthlyPrices, setShowMonthlyPrices] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [passengerPopoverOpen, setPassengerPopoverOpen] = useState(false);

  const swapCities = useCallback(() => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  }, [fromCity, toCity]);

  const handleSearch = useCallback(() => {
    // Validation
    if (!fromCity) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn điểm đi",
        variant: "destructive",
      });
      return;
    }
    if (!toCity) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn điểm đến",
        variant: "destructive",
      });
      return;
    }
    if (fromCity === toCity) {
      toast({
        title: "Lỗi",
        description: "Điểm đi và điểm đến không được trùng nhau",
        variant: "destructive",
      });
      return;
    }
    if (!departureDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày đi",
        variant: "destructive",
      });
      return;
    }
    if (tripType === "round-trip" && !returnDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày về",
        variant: "destructive",
      });
      return;
    }
    if (tripType === "round-trip" && returnDate && departureDate && returnDate < departureDate) {
      toast({
        title: "Lỗi",
        description: "Ngày về phải sau ngày đi",
        variant: "destructive",
      });
      return;
    }

    // Build search URL for external provider (using abay.vn as example)
    const fromAirport = AIRPORTS.find(a => a.code === fromCity);
    const toAirport = AIRPORTS.find(a => a.code === toCity);
    
    const searchParams = new URLSearchParams({
      from: fromCity,
      to: toCity,
      departDate: format(departureDate, "yyyy-MM-dd"),
      adults: adults.toString(),
      children: children.toString(),
      infants: infants.toString(),
      cabinClass: cabinClass,
      tripType: tripType,
    });
    
    if (tripType === "round-trip" && returnDate) {
      searchParams.append("returnDate", format(returnDate, "yyyy-MM-dd"));
    }

    // Open external search (abay.vn format)
    const abayUrl = `https://abay.vn/tim-ve-may-bay?from=${fromCity}&to=${toCity}&depart=${format(departureDate, "dd-MM-yyyy")}&return=${tripType === "round-trip" && returnDate ? format(returnDate, "dd-MM-yyyy") : ""}&adult=${adults}&child=${children}&infant=${infants}&class=${cabinClass === "economy" ? "E" : cabinClass === "business" ? "C" : "F"}`;
    
    window.open(abayUrl, "_blank", "noopener,noreferrer");
    
    toast({
      title: "Đang tìm kiếm",
      description: `Tìm vé ${fromAirport?.name} → ${toAirport?.name}`,
    });
  }, [fromCity, toCity, departureDate, returnDate, tripType, adults, children, infants, cabinClass]);

  const handleDaySelect = useCallback((date: Date) => {
    setDepartureDate(date);
    setShowMonthlyPrices(false);
    
    // Auto search when selecting from calendar
    if (fromCity && toCity) {
      const fromAirport = AIRPORTS.find(a => a.code === fromCity);
      const toAirport = AIRPORTS.find(a => a.code === toCity);
      
      const abayUrl = `https://abay.vn/tim-ve-may-bay?from=${fromCity}&to=${toCity}&depart=${format(date, "dd-MM-yyyy")}&return=&adult=${adults}&child=${children}&infant=${infants}&class=${cabinClass === "economy" ? "E" : cabinClass === "business" ? "C" : "F"}`;
      
      window.open(abayUrl, "_blank", "noopener,noreferrer");
      
      toast({
        title: "Đang tìm kiếm",
        description: `Tìm vé ${fromAirport?.name} → ${toAirport?.name} ngày ${format(date, "dd/MM/yyyy")}`,
      });
    }
  }, [fromCity, toCity, adults, children, infants, cabinClass]);

  const totalPassengers = adults + children + infants;

  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
      options.push(month);
    }
    return options;
  };

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plane className="h-5 w-5 text-primary" />
          Tìm vé máy bay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip Type Toggle */}
        <div className="flex gap-2">
          <Button
            variant={tripType === "one-way" ? "default" : "outline"}
            size="sm"
            onClick={() => setTripType("one-way")}
            className="flex-1"
          >
            Một chiều
          </Button>
          <Button
            variant={tripType === "round-trip" ? "default" : "outline"}
            size="sm"
            onClick={() => setTripType("round-trip")}
            className="flex-1"
          >
            Khứ hồi
          </Button>
        </div>

        {/* From / To Cities */}
        <div className="space-y-3">
          <div className="relative">
            <Label className="text-xs text-muted-foreground mb-1 block">Điểm đi</Label>
            <Select value={fromCity} onValueChange={setFromCity}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn điểm đi" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {AIRPORTS.map((airport) => (
                  <SelectItem key={airport.code} value={airport.code}>
                    <span className="font-medium">{airport.code}</span> - {airport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={swapCities}
              className="h-8 w-8 rounded-full border border-border hover:bg-muted"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Điểm đến</Label>
            <Select value={toCity} onValueChange={setToCity}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn điểm đến" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {AIRPORTS.map((airport) => (
                  <SelectItem key={airport.code} value={airport.code}>
                    <span className="font-medium">{airport.code}</span> - {airport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Monthly Price Toggle */}
        <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
          <Label htmlFor="monthly-prices" className="text-sm cursor-pointer">
            Xem giá theo tháng
          </Label>
          <Switch
            id="monthly-prices"
            checked={showMonthlyPrices}
            onCheckedChange={setShowMonthlyPrices}
          />
        </div>

        {/* Date Selection */}
        {showMonthlyPrices ? (
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Chọn tháng</Label>
            <Select
              value={format(selectedMonth, "yyyy-MM")}
              onValueChange={(value) => {
                const [year, month] = value.split("-");
                setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {format(selectedMonth, "MMMM yyyy", { locale: vi })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {generateMonthOptions().map((month) => (
                  <SelectItem key={format(month, "yyyy-MM")} value={format(month, "yyyy-MM")}>
                    {format(month, "MMMM yyyy", { locale: vi })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Price Calendar */}
            {fromCity && toCity ? (
              <FlightPriceCalendar
                from={fromCity}
                to={toCity}
                month={selectedMonth}
                onDaySelect={handleDaySelect}
              />
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
                Vui lòng chọn điểm đi và điểm đến để xem giá vé theo tháng
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Ngày đi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !departureDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {departureDate ? format(departureDate, "dd/MM/yyyy") : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={departureDate}
                    onSelect={setDepartureDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {tripType === "round-trip" && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Ngày về</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !returnDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {returnDate ? format(returnDate, "dd/MM/yyyy") : "Chọn ngày"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={returnDate}
                      onSelect={setReturnDate}
                      disabled={(date) => date < (departureDate || new Date())}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        )}

        {/* Passengers */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Hành khách</Label>
          <Popover open={passengerPopoverOpen} onOpenChange={setPassengerPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {totalPassengers} hành khách
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-popover z-50" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Người lớn</p>
                    <p className="text-xs text-muted-foreground">Từ 12 tuổi</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      disabled={adults <= 1}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{adults}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setAdults(Math.min(9, adults + 1))}
                      disabled={adults >= 9}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Trẻ em</p>
                    <p className="text-xs text-muted-foreground">2-11 tuổi</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      disabled={children <= 0}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{children}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setChildren(Math.min(9, children + 1))}
                      disabled={children >= 9}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Em bé</p>
                    <p className="text-xs text-muted-foreground">Dưới 2 tuổi</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setInfants(Math.max(0, infants - 1))}
                      disabled={infants <= 0}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{infants}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setInfants(Math.min(adults, infants + 1))}
                      disabled={infants >= adults}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => setPassengerPopoverOpen(false)}
                >
                  Xong
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Cabin Class */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Hạng ghế</Label>
          <Select value={cabinClass} onValueChange={setCabinClass}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {CABIN_CLASSES.map((cabin) => (
                <SelectItem key={cabin.value} value={cabin.value}>
                  {cabin.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        {!showMonthlyPrices && (
          <Button onClick={handleSearch} className="w-full" size="lg">
            <Search className="mr-2 h-4 w-4" />
            Tìm vé máy bay
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
