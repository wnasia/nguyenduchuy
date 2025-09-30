import { useQuery } from "@tanstack/react-query";
import { CryptoCoin } from "@/types/crypto";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

export const useCryptoData = () => {
  return useQuery({
    queryKey: ["crypto-data"],
    queryFn: async (): Promise<CryptoCoin[]> => {
      const response = await fetch(
        `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=7d`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch crypto data");
      }
      
      return response.json();
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
  });
};