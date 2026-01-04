import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use TEST environment for sandbox keys
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

interface FlightSearchRequest {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
  currencyCode?: string;
}

interface MonthPriceRequest {
  from: string;
  to: string;
  month: string;
  adults?: number;
}

// Vietnam domestic route base prices (realistic market prices in VND)
const VIETNAM_ROUTE_PRICES: Record<string, number> = {
  'SGN-HAN': 1500000, 'HAN-SGN': 1500000,
  'SGN-DAD': 900000, 'DAD-SGN': 900000,
  'SGN-CXR': 700000, 'CXR-SGN': 700000,
  'SGN-UIH': 800000, 'UIH-SGN': 800000,
  'SGN-PQC': 600000, 'PQC-SGN': 600000,
  'SGN-VDO': 1200000, 'VDO-SGN': 1200000,
  'SGN-HPH': 1400000, 'HPH-SGN': 1400000,
  'SGN-VII': 1000000, 'VII-SGN': 1000000,
  'SGN-VCL': 750000, 'VCL-SGN': 750000,
  'SGN-BMV': 650000, 'BMV-SGN': 650000,
  'SGN-DLI': 500000, 'DLI-SGN': 500000,
  'HAN-DAD': 800000, 'DAD-HAN': 800000,
  'HAN-CXR': 1200000, 'CXR-HAN': 1200000,
  'HAN-PQC': 1400000, 'PQC-HAN': 1400000,
  'HAN-UIH': 900000, 'UIH-HAN': 900000,
  'HAN-HPH': 400000, 'HPH-HAN': 400000,
  'HAN-DLI': 1100000, 'DLI-HAN': 1100000,
};

// Airline data for Vietnam
const VIETNAM_AIRLINES = [
  { code: 'VN', name: 'Vietnam Airlines', logo: '🇻🇳', priceMultiplier: 1.0 },
  { code: 'VJ', name: 'VietJet Air', logo: '✈️', priceMultiplier: 0.75 },
  { code: 'QH', name: 'Bamboo Airways', logo: '🎋', priceMultiplier: 0.85 },
  { code: 'BL', name: 'Pacific Airlines', logo: '🌊', priceMultiplier: 0.7 },
];

// Get Amadeus OAuth token
async function getAmadeusToken(): Promise<string> {
  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus API credentials not configured');
  }
  
  const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus auth error:', error);
    throw new Error('Failed to authenticate with Amadeus API');
  }
  
  const data = await response.json();
  console.log('Amadeus token obtained successfully');
  return data.access_token;
}

// Search for flight offers using Amadeus API
async function searchFlightsAmadeus(token: string, params: FlightSearchRequest) {
  const cabinClassMap: Record<string, string> = {
    'economy': 'ECONOMY',
    'premium_economy': 'PREMIUM_ECONOMY',
    'business': 'BUSINESS',
    'first': 'FIRST',
  };
  
  const queryParams = new URLSearchParams({
    originLocationCode: params.from,
    destinationLocationCode: params.to,
    departureDate: params.departureDate,
    adults: params.adults.toString(),
    currencyCode: params.currencyCode || 'VND',
    max: '20',
  });
  
  if (params.returnDate) {
    queryParams.append('returnDate', params.returnDate);
  }
  
  if (params.children && params.children > 0) {
    queryParams.append('children', params.children.toString());
  }
  
  if (params.infants && params.infants > 0) {
    queryParams.append('infants', params.infants.toString());
  }
  
  if (params.cabinClass && cabinClassMap[params.cabinClass]) {
    queryParams.append('travelClass', cabinClassMap[params.cabinClass]);
  }
  
  console.log('Searching Amadeus flights with params:', queryParams.toString());
  
  const response = await fetch(
    `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus flight search error:', response.status, error);
    return null;
  }
  
  const data = await response.json();
  console.log('Amadeus returned', data.data?.length || 0, 'flight offers');
  return data;
}

// Generate realistic Vietnam domestic flights based on market data
function generateVietnamFlights(params: FlightSearchRequest): any[] {
  const routeKey = `${params.from}-${params.to}`;
  const basePrice = VIETNAM_ROUTE_PRICES[routeKey] || 1000000;
  
  const departureDate = new Date(params.departureDate);
  const dayOfWeek = departureDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = false; // Could check Vietnamese holidays
  
  // Price adjustments
  let priceMultiplier = 1.0;
  if (isWeekend) priceMultiplier *= 1.15;
  
  // Days until departure affects price
  const today = new Date();
  const daysUntil = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 3) priceMultiplier *= 1.5;
  else if (daysUntil <= 7) priceMultiplier *= 1.25;
  else if (daysUntil > 30) priceMultiplier *= 0.9;
  
  // Flight times based on route
  const flightDurations: Record<string, number> = {
    'SGN-HAN': 125, 'HAN-SGN': 130,
    'SGN-DAD': 75, 'DAD-SGN': 80,
    'SGN-CXR': 55, 'CXR-SGN': 60,
    'SGN-UIH': 70, 'UIH-SGN': 75,
    'SGN-PQC': 55, 'PQC-SGN': 60,
  };
  
  const duration = flightDurations[routeKey] || 90;
  
  const departureTimes = ['06:00', '07:30', '09:00', '11:00', '13:30', '15:00', '17:00', '19:00', '21:00'];
  
  const flights: any[] = [];
  
  // Generate 2-4 flights per airline
  for (const airline of VIETNAM_AIRLINES) {
    const numFlights = 2 + Math.floor(Math.random() * 3);
    const selectedTimes = departureTimes
      .sort(() => Math.random() - 0.5)
      .slice(0, numFlights);
    
    for (const depTime of selectedTimes) {
      const [hours, mins] = depTime.split(':').map(Number);
      const arrivalMinutes = hours * 60 + mins + duration;
      const arrHours = Math.floor(arrivalMinutes / 60) % 24;
      const arrMins = arrivalMinutes % 60;
      const arrTime = `${String(arrHours).padStart(2, '0')}:${String(arrMins).padStart(2, '0')}`;
      
      // Price variation per flight
      const flightVariation = 0.9 + Math.random() * 0.2;
      const finalPrice = Math.round(basePrice * priceMultiplier * airline.priceMultiplier * flightVariation);
      
      // Taxes are about 20% of total
      const taxAmount = Math.round(finalPrice * 0.20);
      const baseAmount = finalPrice - taxAmount;
      
      flights.push({
        id: `${airline.code}${100 + Math.floor(Math.random() * 900)}-${Date.now()}`,
        airline: airline.name,
        airlineLogo: airline.logo,
        flightNumber: `${airline.code}${100 + Math.floor(Math.random() * 900)}`,
        from: params.from,
        fromCity: params.from,
        to: params.to,
        toCity: params.to,
        departureTime: depTime,
        arrivalTime: arrTime,
        duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
        price: finalPrice,
        seatsLeft: 3 + Math.floor(Math.random() * 12),
        stops: 0,
        priceBreakdown: {
          base: baseAmount,
          taxes: taxAmount,
          total: finalPrice,
          currency: 'VND',
        },
        dataSource: 'market_estimate',
      });
    }
  }
  
  // Sort by price
  return flights.sort((a, b) => a.price - b.price);
}

// Generate month prices for Vietnam routes
function generateVietnamMonthPrices(params: MonthPriceRequest): Record<string, number | null> {
  const routeKey = `${params.from}-${params.to}`;
  const basePrice = VIETNAM_ROUTE_PRICES[routeKey] || 1000000;
  
  const [year, month] = params.month.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const prices: Record<string, number | null> = {};
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const checkDate = new Date(dateStr);
    
    if (checkDate < today) {
      prices[dateStr] = null;
      continue;
    }
    
    const dayOfWeek = checkDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Days until departure
    const daysUntil = Math.ceil((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let priceMultiplier = 1.0;
    if (isWeekend) priceMultiplier *= 1.15;
    if (daysUntil <= 3) priceMultiplier *= 1.4;
    else if (daysUntil <= 7) priceMultiplier *= 1.2;
    else if (daysUntil > 21) priceMultiplier *= 0.85;
    
    // Add some daily variation
    const dailyVariation = 0.95 + (Math.sin(day * 0.7) * 0.1);
    
    // Use VietJet (lowest) price as the minimum shown
    const lowestAirlineMultiplier = 0.7;
    
    prices[dateStr] = Math.round(basePrice * priceMultiplier * dailyVariation * lowestAirlineMultiplier);
  }
  
  return prices;
}

// Transform Amadeus response to our format
function transformFlightOffers(amadeusData: any, dictionaries: any) {
  if (!amadeusData || !Array.isArray(amadeusData)) {
    return [];
  }
  
  return amadeusData.map((offer: any, index: number) => {
    const firstSegment = offer.itineraries?.[0]?.segments?.[0];
    const lastSegment = offer.itineraries?.[0]?.segments?.slice(-1)[0];
    
    const carrierCode = firstSegment?.carrierCode || 'XX';
    const carrierName = dictionaries?.carriers?.[carrierCode] || carrierCode;
    
    const duration = offer.itineraries?.[0]?.duration || 'PT0H0M';
    const durationMatch = duration.match(/PT(\d+)H(\d+)?M?/);
    const hours = durationMatch?.[1] || '0';
    const minutes = durationMatch?.[2] || '0';
    
    const totalPrice = parseFloat(offer.price?.grandTotal || offer.price?.total || '0');
    
    const airlineLogos: Record<string, string> = {
      'VN': '🇻🇳',
      'VJ': '✈️',
      'QH': '🎋',
      'BL': '🌊',
    };
    
    return {
      id: offer.id || `flight-${index}`,
      airline: carrierName,
      airlineLogo: airlineLogos[carrierCode] || '✈️',
      flightNumber: `${carrierCode}${firstSegment?.number || ''}`,
      from: firstSegment?.departure?.iataCode || '',
      fromCity: firstSegment?.departure?.iataCode || '',
      to: lastSegment?.arrival?.iataCode || '',
      toCity: lastSegment?.arrival?.iataCode || '',
      departureTime: firstSegment?.departure?.at?.substring(11, 16) || '',
      arrivalTime: lastSegment?.arrival?.at?.substring(11, 16) || '',
      duration: `${hours}h ${minutes}m`,
      price: totalPrice,
      seatsLeft: offer.numberOfBookableSeats || 5,
      stops: (offer.itineraries?.[0]?.segments?.length || 1) - 1,
      priceBreakdown: {
        base: parseFloat(offer.price?.base || '0'),
        taxes: parseFloat(offer.price?.grandTotal || '0') - parseFloat(offer.price?.base || '0'),
        total: totalPrice,
        currency: offer.price?.currency || 'VND',
      },
      dataSource: 'amadeus',
    };
  });
}

// Check if route is a Vietnam domestic route
function isVietnamRoute(from: string, to: string): boolean {
  const vietnamAirports = ['SGN', 'HAN', 'DAD', 'CXR', 'UIH', 'PQC', 'VDO', 'HPH', 'VII', 'VCL', 'BMV', 'DLI', 'VCS', 'PXU', 'TBB', 'VKG', 'CAH', 'VCA'];
  return vietnamAirports.includes(from) && vietnamAirports.includes(to);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'search';
    
    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    
    console.log(`Flight search action: ${action}`, JSON.stringify(body));
    
    // Try to get Amadeus token
    let amadeusToken: string | null = null;
    try {
      amadeusToken = await getAmadeusToken();
    } catch (error) {
      console.log('Amadeus auth failed, will use Vietnam market data:', error);
    }
    
    if (action === 'month-prices') {
      const { from, to, month, adults } = body as MonthPriceRequest;
      
      if (!from || !to || !month) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: from, to, month' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      let prices: Record<string, number | null> = {};
      let dataSource = 'market_estimate';
      
      // For Vietnam routes, use market data (sandbox doesn't have VN data)
      if (isVietnamRoute(from, to)) {
        console.log('Using Vietnam market data for month prices');
        prices = generateVietnamMonthPrices({ from, to, month, adults });
        dataSource = 'vietnam_market';
      } else if (amadeusToken) {
        // Try Amadeus for international routes
        try {
          // Simplified: just get a sample and use that price
          const sampleDate = `${month}-15`;
          const result = await searchFlightsAmadeus(amadeusToken, {
            from, to, departureDate: sampleDate, adults: adults || 1
          });
          
          if (result?.data?.length > 0) {
            const basePrice = parseFloat(result.data[0].price?.grandTotal || '0');
            const [year, monthNum] = month.split('-').map(Number);
            const daysInMonth = new Date(year, monthNum, 0).getDate();
            const today = new Date();
            
            for (let day = 1; day <= daysInMonth; day++) {
              const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const checkDate = new Date(dateStr);
              if (checkDate < today) {
                prices[dateStr] = null;
              } else {
                prices[dateStr] = Math.round(basePrice * (0.9 + Math.random() * 0.2));
              }
            }
            dataSource = 'amadeus';
          }
        } catch (e) {
          console.error('Amadeus month price error:', e);
        }
      }
      
      // Fallback to generic estimate if nothing else worked
      if (Object.keys(prices).length === 0) {
        prices = generateVietnamMonthPrices({ from, to, month, adults });
      }
      
      return new Response(
        JSON.stringify({ success: true, prices, dataSource }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Standard flight search
      const searchParams = body as FlightSearchRequest;
      
      if (!searchParams.from || !searchParams.to || !searchParams.departureDate || !searchParams.adults) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      let flights: any[] = [];
      let dataSource = 'market_estimate';
      
      // For Vietnam routes, use market data
      if (isVietnamRoute(searchParams.from, searchParams.to)) {
        console.log('Using Vietnam market data for flight search');
        flights = generateVietnamFlights(searchParams);
        dataSource = 'vietnam_market';
      } else if (amadeusToken) {
        // Try Amadeus for international routes
        try {
          const amadeusData = await searchFlightsAmadeus(amadeusToken, searchParams);
          if (amadeusData?.data?.length > 0) {
            flights = transformFlightOffers(amadeusData.data, amadeusData.dictionaries);
            dataSource = 'amadeus';
          }
        } catch (e) {
          console.error('Amadeus search error:', e);
        }
      }
      
      // Fallback to Vietnam market data
      if (flights.length === 0) {
        flights = generateVietnamFlights(searchParams);
        dataSource = 'market_estimate';
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          flights,
          meta: {
            count: flights.length,
            currency: 'VND',
            priceType: 'grandTotal',
            dataSource,
            note: dataSource === 'vietnam_market' || dataSource === 'market_estimate' 
              ? 'Prices based on Vietnam domestic market rates' 
              : 'Real-time Amadeus data',
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Flight search error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
