import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  month: string; // YYYY-MM format
  adults?: number;
}

// Get Amadeus OAuth token
async function getAmadeusToken(): Promise<string> {
  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');
  
  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus API credentials not configured');
  }
  
  const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
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
  return data.access_token;
}

// Search for flight offers
async function searchFlights(token: string, params: FlightSearchRequest) {
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
  
  console.log('Searching flights with params:', queryParams.toString());
  
  const response = await fetch(
    `https://api.amadeus.com/v2/shopping/flight-offers?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus flight search error:', error);
    throw new Error(`Flight search failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

// Get lowest prices for a month (using flight inspiration API or multiple day queries)
async function getMonthPrices(token: string, params: MonthPriceRequest) {
  const [year, month] = params.month.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const prices: Record<string, number | null> = {};
  
  // Try the Flight Inspiration Search API first for cheaper overall fares
  try {
    const inspirationResponse = await fetch(
      `https://api.amadeus.com/v1/shopping/flight-destinations?origin=${params.from}&departureDate=${params.month}-01,${params.month}-${String(daysInMonth).padStart(2, '0')}&oneWay=true&maxPrice=50000000`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );
    
    if (inspirationResponse.ok) {
      const inspirationData = await inspirationResponse.json();
      console.log('Inspiration API data:', JSON.stringify(inspirationData).substring(0, 500));
      
      // Look for matching destination prices
      if (inspirationData.data) {
        for (const dest of inspirationData.data) {
          if (dest.destination === params.to && dest.departureDate) {
            const priceTotal = parseFloat(dest.price?.total || '0');
            if (priceTotal > 0) {
              prices[dest.departureDate] = priceTotal;
            }
          }
        }
      }
    }
  } catch (error) {
    console.log('Inspiration API not available, falling back to daily search');
  }
  
  // If we didn't get prices from inspiration API, query specific days
  // Only query a sample of days to avoid rate limits (every 3rd day)
  if (Object.keys(prices).length === 0) {
    const sampleDays = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28].filter(d => d <= daysInMonth);
    
    for (const day of sampleDays) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const checkDate = new Date(dateStr);
      
      if (checkDate < today) {
        prices[dateStr] = null;
        continue;
      }
      
      try {
        const searchResult = await searchFlights(token, {
          from: params.from,
          to: params.to,
          departureDate: dateStr,
          adults: params.adults || 1,
          currencyCode: 'VND',
        });
        
        if (searchResult.data && searchResult.data.length > 0) {
          // Get the lowest total price (includes all taxes and fees)
          const lowestPrice = Math.min(
            ...searchResult.data.map((offer: any) => 
              parseFloat(offer.price?.grandTotal || offer.price?.total || '0')
            )
          );
          prices[dateStr] = lowestPrice > 0 ? lowestPrice : null;
        } else {
          prices[dateStr] = null;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error fetching price for ${dateStr}:`, error);
        prices[dateStr] = null;
      }
    }
    
    // Interpolate prices for days we didn't query
    const queriedDays = Object.keys(prices).filter(d => prices[d] !== null);
    if (queriedDays.length > 0) {
      const avgPrice = queriedDays.reduce((sum, d) => sum + (prices[d] || 0), 0) / queriedDays.length;
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const checkDate = new Date(dateStr);
        
        if (checkDate < today) {
          prices[dateStr] = null;
        } else if (prices[dateStr] === undefined) {
          // Apply some variation based on day of week
          const dayOfWeek = checkDate.getDay();
          const variation = dayOfWeek === 0 || dayOfWeek === 6 ? 1.1 : 0.95;
          prices[dateStr] = Math.round(avgPrice * variation);
        }
      }
    }
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
    
    // Calculate total duration
    const duration = offer.itineraries?.[0]?.duration || 'PT0H0M';
    const durationMatch = duration.match(/PT(\d+)H(\d+)?M?/);
    const hours = durationMatch?.[1] || '0';
    const minutes = durationMatch?.[2] || '0';
    
    // Use grandTotal which includes all taxes and fees
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
    };
  });
}

serve(async (req) => {
  // Handle CORS preflight
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
    
    // Get Amadeus token
    const token = await getAmadeusToken();
    
    if (action === 'month-prices') {
      // Get prices for entire month
      const { from, to, month, adults } = body as MonthPriceRequest;
      
      if (!from || !to || !month) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: from, to, month' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const prices = await getMonthPrices(token, { from, to, month, adults });
      
      return new Response(
        JSON.stringify({ success: true, prices }),
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
      
      const amadeusData = await searchFlights(token, searchParams);
      const flights = transformFlightOffers(amadeusData.data, amadeusData.dictionaries);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          flights,
          meta: {
            count: flights.length,
            currency: 'VND',
            priceType: 'grandTotal', // Indicates prices include all taxes and fees
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
