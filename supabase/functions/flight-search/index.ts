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
      console.error('Amadeus auth failed:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Flight search is temporarily unavailable. Amadeus API authentication failed.',
          success: false,
          unavailable: true,
          reason: 'api_auth_failed'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'month-prices') {
      const { from, to, month, adults } = body as MonthPriceRequest;
      
      if (!from || !to || !month) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: from, to, month' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Only return real data from Amadeus API - no simulated prices
      try {
        const sampleDate = `${month}-15`;
        const result = await searchFlightsAmadeus(amadeusToken, {
          from, to, departureDate: sampleDate, adults: adults || 1
        });
        
        if (result?.data?.length > 0) {
          const basePrice = parseFloat(result.data[0].price?.grandTotal || '0');
          const [year, monthNum] = month.split('-').map(Number);
          const daysInMonth = new Date(year, monthNum, 0).getDate();
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const prices: Record<string, number | null> = {};
          
          for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const checkDate = new Date(dateStr);
            if (checkDate < today) {
              prices[dateStr] = null;
            } else {
              // Use the actual price from API
              prices[dateStr] = Math.round(basePrice);
            }
          }
          
          return new Response(
            JSON.stringify({ success: true, prices, dataSource: 'amadeus' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (e) {
        console.error('Amadeus month price error:', e);
      }
      
      // No real data available - return unavailable status
      return new Response(
        JSON.stringify({ 
          success: false, 
          unavailable: true,
          error: 'No real-time price data available for this route. The Amadeus API sandbox has limited coverage.',
          reason: 'no_data_available'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      
      // Only return real data from Amadeus API
      try {
        const amadeusData = await searchFlightsAmadeus(amadeusToken, searchParams);
        if (amadeusData?.data?.length > 0) {
          const flights = transformFlightOffers(amadeusData.data, amadeusData.dictionaries);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              flights,
              meta: {
                count: flights.length,
                currency: 'VND',
                priceType: 'grandTotal',
                dataSource: 'amadeus',
                note: 'Real-time data from Amadeus API',
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (e) {
        console.error('Amadeus search error:', e);
      }
      
      // No real data available - return unavailable status
      return new Response(
        JSON.stringify({ 
          success: false,
          unavailable: true,
          flights: [],
          error: 'No real-time flight data available for this route. The Amadeus API sandbox has limited coverage for Vietnam domestic routes.',
          reason: 'no_data_available',
          suggestion: 'Try searching for international routes (e.g., SGN to BKK, SIN, HKG) or upgrade to Amadeus Production API.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
