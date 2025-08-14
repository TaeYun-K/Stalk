import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  StockDetailHeader,
  StockRankingTable,
  StockSearch,
  StockChart,
} from "../components/stock";
import { useStockData, useStockList } from "../hooks/use-stock-data";
import { useWatchlist } from "@/context/WatchlistContext";
import { WatchlistItem } from "@/types";
import FavoriteStockService from "@/services/favoriteStockService";

interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  volume: string;
  marketCap: string;
  foreignBuy?: number;
  foreignSell?: number;
}

interface RankingStock {
  rank: number;
  ticker: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  marketCap?: string;
  volume: string;
  tradeValue?: string;
  logo?: string;
}

// removed unused MarketIndex

type ViewMode = "detail" | "ranking";
type TimeRange = "1w" | "1m" | "3m" | "6m" | "1y";
type RankingType = "volume" | "gainers" | "losers" | "marketCap" | "tradeValue";
type MarketType = "전체" | "kospi" | "kosdaq";

// Common headers for API requests
const BASE_HEADERS = {
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
} as const;

interface RealtimePriceData {
  ticker?: string;
  name?: string;
  closePrice?: string;
  priceChange?: string;
  changeRate?: string;
  volume?: string;
  highPrice?: string;
  lowPrice?: string;
  openPrice?: string;
  prevClosePrice?: string;
}

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial state from URL params
  const tickerFromUrl = searchParams.get("ticker");
  const rankingTypeFromUrl =
    (searchParams.get("ranking") as RankingType) || "volume";
  const marketTypeFromUrl =
    (searchParams.get("market") as MarketType) || "전체";

  const [viewMode, setViewMode] = useState<ViewMode>(
    tickerFromUrl ? "detail" : "ranking"
  );
  const [rankingType, setRankingType] =
    useState<RankingType>(rankingTypeFromUrl);
  const [marketType, setMarketType] = useState<MarketType>(marketTypeFromUrl);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(
    tickerFromUrl
  );
  const [timeRange] = useState<TimeRange>("1w");
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [drawingMode] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarChange = (event: CustomEvent) => {
      setSidebarExpanded(event.detail.expanded);
    };

    window.addEventListener('sidebarStateChange', handleSidebarChange as EventListener);
    return () => window.removeEventListener('sidebarStateChange', handleSidebarChange as EventListener);
  }, []);

  // Use custom hooks for data fetching
  const { data: stockData } = useStockData(selectedTicker, {
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // State for real-time price data
  const [realtimePriceData, setRealtimePriceData] =
    useState<RealtimePriceData | null>(null);

  // Helper function to format volume with Korean units
  const formatVolume = (vol: string) => {
    const num = parseInt(vol?.replace(/,/g, "") || "0");
    if (num >= 100000000) {
      return (num / 100000000).toFixed(1) + "억";
    } else if (num >= 10000) {
      return (num / 10000).toFixed(1) + "만";
    }
    return num.toLocaleString();
  };

  // removed unused market indices

  // Use the stock list hook for ranking data
  const { stocks: rankingData, error: rankingError } = useStockList(
    rankingType,
    marketType
  );

  // Use stock basic info hook for enhanced detail view
  // Commented out as the endpoint doesn't exist yet
  /*
  const {
    basicInfo,
    isLoading: basicInfoLoading,
    error: basicInfoError,
  } = useStockBasicInfo(
    selectedTicker,
    selectedStock?.ticker?.startsWith('900') || selectedStock?.ticker?.startsWith('300') ? "KOSDAQ" : "KOSPI"
  );
  */

  // Convert stock data to ranking format
  const rankingStocks: RankingStock[] = useMemo(
    () =>
      rankingData?.map((stock: any) => ({
        rank: stock.rank || 0,
        ticker: stock.ticker || "",
        name: stock.name || "",
        price: stock.price || 0,
        change: stock.change || 0,
        changeRate: stock.changeRate || 0,
        marketCap: stock.marketCap || "0",
        volume: stock.volume || "0",
        tradeValue: stock.tradeValue || "0",
      })) || [],
    [rankingData]
  );

  // removed unused debug effect

  // Update selected stock when stock data changes
  useEffect(() => {
    if (stockData && selectedTicker) {
      setSelectedStock({
        ticker: stockData.ticker,
        name: stockData.name,
        price: stockData.price,
        change: stockData.change,
        changeRate: stockData.changeRate,
        volume: stockData.volume,
        marketCap: stockData.marketCap,
        foreignBuy: 95995,
        foreignSell: 23000,
      });
    }
  }, [stockData, selectedTicker]);

  // Fetch real-time price data when ticker changes
  useEffect(() => {
    const fetchRealtimePrice = async () => {
      if (!selectedTicker) {
        setRealtimePriceData(null);
        return;
      }

      // Show optimistic UI immediately to reduce perceived loading time
      setRealtimePriceData({
        ticker: selectedTicker,
        name: `로딩 중 ${selectedTicker}...`,
        closePrice: "0",
        priceChange: "0",
        changeRate: "0",
        volume: "0",
      });

      // Common headers used across attempts (outside try/catch for broader scope)
      // use module-level BASE_HEADERS constant

      try {
        // 🚀 COMBINATION APPROACH: Parallel + Smart + Fast

        // Smart market detection heuristic
        const getSmartMarketGuess = (ticker: string) => {
          if (ticker.startsWith("3") || ticker.startsWith("9")) return "KOSDAQ";
          if (ticker.startsWith("04") || ticker.startsWith("05"))
            return "KOSDAQ";
          if (ticker.startsWith("00")) return "KOSPI";
          return "KOSPI"; // Default for ambiguous cases
        };

        const smartGuess = getSmartMarketGuess(selectedTicker);
        const otherMarket = smartGuess === "KOSPI" ? "KOSDAQ" : "KOSPI";

        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();


        // 예상 마켓 먼저 시도
        let response;
        let stockData;

        try {
          const smartUrl = `${
            import.meta.env.VITE_API_URL
          }/api/krx/stock/${selectedTicker}?market=${smartGuess}&_t=${timestamp}`;
          response = await axios.get(smartUrl, { headers: BASE_HEADERS });
        } catch (smartGuessError: any) {
          // 404는 예상된 동작이므로 로그하지 않음

          // 다른 마켓 시도
          try {
            const fallbackUrl = `${
              import.meta.env.VITE_API_URL
            }/api/krx/stock/${selectedTicker}?market=${otherMarket}&_t=${timestamp}`;
            response = await axios.get(fallbackUrl, { headers: BASE_HEADERS });
          } catch (fallbackError: any) {
            // 404는 예상된 동작, 다른 오류만 로그
            if (fallbackError.response?.status !== 404) {
              console.error(`Unexpected error:`, fallbackError.message);
            }
            throw new Error("Both individual attempts failed");
          }
        }

        // Handle both wrapped {success, data} format and direct object format
        if (response.data) {
          if (response.data.success !== undefined) {
            // Wrapped format
            if (response.data.success && response.data.data) {
              stockData = response.data.data;
            }
          } else if (response.data.ISU_SRT_CD || response.data.ticker) {
            // Direct KrxStockInfo object format
            stockData = response.data;
          }
        }

        if (stockData) {
          // Check if we got data for the correct ticker
          const returnedTicker = stockData.ticker || stockData.ISU_SRT_CD;
          if (returnedTicker !== selectedTicker) {
            console.error(
              `TICKER MISMATCH! Requested: ${selectedTicker}, Received: ${returnedTicker}`
            );
            console.error("This indicates a backend caching issue");
          }

          // Map KRX API field names to our expected format
          const mappedData = {
            ticker: stockData.ticker || stockData.ISU_SRT_CD,
            name: stockData.name || stockData.ISU_ABBRV,
            closePrice: (stockData.closePrice || stockData.TDD_CLSPRC || "0")
              .toString()
              .replace(/,/g, ""),
            priceChange: (
              stockData.priceChange ||
              stockData.CMPPREVDD_PRC ||
              "0"
            )
              .toString()
              .replace(/,/g, ""),
            changeRate: (stockData.changeRate || stockData.FLUC_RT || "0")
              .toString()
              .replace(/,/g, ""),
            volume: formatVolume(
              stockData.volume || stockData.ACC_TRDVOL || "0"
            ),
            tradeValue: stockData.tradeValue || stockData.ACC_TRDVAL,
            marketCap: stockData.marketCap || stockData.MKTCAP,
            // Add OHLC prices
            openPrice: (stockData.openPrice || stockData.TDD_OPNPRC || "0")
              .toString()
              .replace(/,/g, ""),
            highPrice: (stockData.highPrice || stockData.TDD_HGPRC || "0")
              .toString()
              .replace(/,/g, ""),
            lowPrice: (stockData.lowPrice || stockData.TDD_LWPRC || "0")
              .toString()
              .replace(/,/g, ""),
            prevClosePrice:
              stockData.prevClosePrice ||
              (
                (stockData.closePrice || stockData.TDD_CLSPRC || "0")
                  .toString()
                  .replace(/,/g, "") -
                (stockData.priceChange || stockData.CMPPREVDD_PRC || "0")
                  .toString()
                  .replace(/,/g, "")
              ).toString(),
          };


          // Only set the data if it's for the correct ticker
          if (returnedTicker === selectedTicker) {
            setRealtimePriceData(mappedData);
            return; // 성공
          } else {
            console.error("Skipping wrong ticker data, will try fallback");
            // 다음 시도로 계속
          }
        } else {
          // No stock data in response, trying fallback
        }
      } catch (err) {
      }

      // 대체 마켓 시도
      try {

        const smartGuess =
          selectedTicker.startsWith("3") ||
          selectedTicker.startsWith("9") ||
          selectedTicker.startsWith("04") ||
          selectedTicker.startsWith("05")
            ? "KOSDAQ"
            : "KOSPI";
        const otherMarket = smartGuess === "KOSPI" ? "KOSDAQ" : "KOSPI";

        // 병렬 API 호출
        const createApiCall = (market: string) =>
          axios.get(
            `${
              import.meta.env.VITE_API_URL
            }/api/krx/stock/${selectedTicker}?market=${market}`,
            {
              headers: BASE_HEADERS,
              timeout: 5000, // 5 second timeout per request
            }
          );

        let dailyResponse;
        try {
          // Try smart guess first
          dailyResponse = await createApiCall(smartGuess);
        } catch {
          // Try other market
          dailyResponse = await createApiCall(otherMarket);
        }

        // Handle both wrapped and direct format
        let stockData;
        if (dailyResponse.data) {
          if (dailyResponse.data.success !== undefined) {
            // Wrapped format
            if (dailyResponse.data.success && dailyResponse.data.data) {
              stockData = dailyResponse.data.data;
            }
          } else if (
            dailyResponse.data.ISU_SRT_CD ||
            dailyResponse.data.ticker
          ) {
            // Direct KrxStockInfo object format
            stockData = dailyResponse.data;
          }
        }

        if (stockData) {
          const price =
            parseFloat(stockData.closePrice?.replace(/,/g, "")) || 0;
          const change =
            parseFloat(stockData.priceChange?.replace(/,/g, "")) || 0;
          const changeRate =
            parseFloat(stockData.changeRate?.replace(/,/g, "")) || 0;

          // Try to get name from search
          let stockName = "";
          try {
            const searchResponse = await axios.get(
              `${
                import.meta.env.VITE_API_URL
              }/api/stock/search/${selectedTicker}`
            );
            if (
              searchResponse.data.success &&
              searchResponse.data.data.length > 0
            ) {
              stockName = searchResponse.data.data[0].name;
            }
          } catch (searchErr) {
            // 종목명 검색 실패는 치명적이지 않음 - 로그 제거
          }

          // If still no name, try from the ranking list
          if (!stockName && rankingData) {
            const stockFromRanking = rankingData.find(
              (s: any) => s.ticker === selectedTicker
            );
            if (stockFromRanking) {
              stockName = stockFromRanking.name;
            }
          }

          // Last resort - use ticker but mark it
          if (!stockName) {
            stockName = `종목 ${selectedTicker}`;
            // 종목명을 찾지 못한 경우 - 정상 폴백이므로 로그 제거
          }

          const fallbackData = {
            ticker: selectedTicker,
            name: stockData.name || stockName,
            closePrice: price.toString(),
            priceChange: change.toString(),
            changeRate: changeRate.toFixed(2),
            volume: formatVolume(stockData.volume || "0"),
            // Add OHLC prices
            openPrice: (stockData.openPrice || stockData.TDD_OPNPRC || "0")
              .toString()
              .replace(/,/g, ""),
            highPrice: (stockData.highPrice || stockData.TDD_HGPRC || "0")
              .toString()
              .replace(/,/g, ""),
            lowPrice: (stockData.lowPrice || stockData.TDD_LWPRC || "0")
              .toString()
              .replace(/,/g, ""),
            prevClosePrice: (price - change).toString(),
          };

          setRealtimePriceData(fallbackData);
        }
      } catch (fallbackErr) {
        // 병렬 요청으로 재시도
        try {

          const kospiPromise = axios.get(
            `${
              import.meta.env.VITE_API_URL
            }/api/krx/stock/${selectedTicker}?market=KOSPI`,
            {
              headers: BASE_HEADERS,
              timeout: 3000,
            }
          );
          const kosdaqPromise = axios.get(
            `${
              import.meta.env.VITE_API_URL
            }/api/krx/stock/${selectedTicker}?market=KOSDAQ`,
            {
              headers: BASE_HEADERS,
              timeout: 3000,
            }
          );

          // 먼저 성공한 응답 사용
          const winnerResponse: any = await Promise.race([
            kospiPromise.catch((err) => ({
              error: "KOSPI failed",
              details: err,
            })),
            kosdaqPromise.catch((err) => ({
              error: "KOSDAQ failed",
              details: err,
            })),
          ]);

          if (!("error" in winnerResponse) && (winnerResponse as any).data) {

            const data =
              (winnerResponse as any).data.data || (winnerResponse as any).data;
            setRealtimePriceData({
              ticker: selectedTicker,
              name: data.name || data.ISU_ABBRV || `Stock ${selectedTicker}`,
              closePrice: (
                data.closePrice ||
                data.TDD_CLSPRC ||
                "0"
              ).toString(),
              priceChange: (
                data.priceChange ||
                data.CMPPREVDD_PRC ||
                "0"
              ).toString(),
              changeRate: (data.changeRate || data.FLUC_RT || "0").toString(),
              volume: formatVolume(data.volume || data.ACC_TRDVOL || "0"),
              // Add OHLC prices
              openPrice: (data.openPrice || data.TDD_OPNPRC || "0")
                .toString()
                .replace(/,/g, ""),
              highPrice: (data.highPrice || data.TDD_HGPRC || "0")
                .toString()
                .replace(/,/g, ""),
              lowPrice: (data.lowPrice || data.TDD_LWPRC || "0")
                .toString()
                .replace(/,/g, ""),
              prevClosePrice: (
                parseFloat(
                  (data.closePrice || data.TDD_CLSPRC || "0")
                    .toString()
                    .replace(/,/g, "")
                ) -
                parseFloat(
                  (data.priceChange || data.CMPPREVDD_PRC || "0")
                    .toString()
                    .replace(/,/g, "")
                )
              ).toString(),
            });
            return; // 성공
          }
        } catch (parallelErr) {
        }

        // KOSPI와 KOSDAQ 모두에서 찾지 못함
        console.error(`주식 ${selectedTicker}을(를) KOSPI와 KOSDAQ 모두에서 찾을 수 없습니다.`);
        setRealtimePriceData({
          ticker: selectedTicker,
          name: `Stock ${selectedTicker}`,
          closePrice: "0",
          priceChange: "0",
          changeRate: "0",
          volume: "0",
        });
      }
    };

    fetchRealtimePrice();
  }, [selectedTicker]);

  // Handle URL changes (including browser back button)
  useEffect(() => {
    const ticker = searchParams.get("ticker");
    const ranking = searchParams.get("ranking") as RankingType;
    const market = searchParams.get("market") as MarketType;

    if (ticker) {
      setSelectedTicker(ticker);
      setViewMode("detail");
    } else {
      setSelectedTicker(null);
      setViewMode("ranking");
    }

    if (ranking) setRankingType(ranking);
    if (market) setMarketType(market);
  }, [searchParams]);

  const selectStock = (stock: {
    rank: number;
    ticker: string;
    name: string;
    price: number;
    change: number;
    changeRate: number;
    marketCap?: string;
    volume: string;
  }) => {
    // Update URL params to include the ticker
    const newParams = new URLSearchParams(searchParams);
    newParams.set("ticker", stock.ticker);
    newParams.set("ranking", rankingType);
    newParams.set("market", marketType);
    setSearchParams(newParams);

    setSelectedTicker(stock.ticker);
    setViewMode("detail");

    // Store the stock info temporarily to show immediately
    setRealtimePriceData({
      ticker: stock.ticker,
      name: stock.name,
      closePrice: (stock.price || 0).toString(),
      priceChange: (stock.change || 0).toString(),
      changeRate: (stock.changeRate || 0).toString(),
      volume: stock.volume || "0",
    });
  };

  const goBackToRanking = () => {
    // Remove ticker from URL params to go back to ranking
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("ticker");
    setSearchParams(newParams);

    setSelectedTicker(null);
    setViewMode("ranking");
  };

  const toggleFavorite = async () => {
    if (!selectedTicker) return;

    try {
      if (isInWatchlist(selectedTicker)) {
        // Optimistic UI update
        removeFromWatchlist(selectedTicker);
        await FavoriteStockService.removeFavoriteStock(selectedTicker);
        return;
      }

      // Assemble watchlist item from available data
      const name =
        selectedStock?.name || realtimePriceData?.name || selectedTicker;
      const price =
        (selectedStock?.price ??
          parseFloat(
            (realtimePriceData?.closePrice || "0").toString().replace(/,/g, "")
          )) ||
        0;
      const changeAmount =
        (selectedStock?.change ??
          parseFloat(
            (realtimePriceData?.priceChange || "0").toString().replace(/,/g, "")
          )) ||
        0;
      const changeRate =
        (selectedStock?.changeRate ??
          parseFloat(
            (realtimePriceData?.changeRate || "0").toString().replace(/,/g, "")
          )) ||
        0;

      const item: WatchlistItem = {
        code: selectedTicker,
        name,
        price,
        changeAmount,
        changeRate,
      };

      // Optimistic UI add then persist
      addToWatchlist(item);
      await FavoriteStockService.addFavoriteStock(selectedTicker);
    } catch (e) {
      console.error("관심종목 토글 실패:", e);
    }
  };

  const handleRankingTypeChange = (newType: RankingType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("ranking", newType);
    setSearchParams(newParams);
    setRankingType(newType);
  };

  const handleMarketTypeChange = (newMarket: MarketType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("market", newMarket);
    setSearchParams(newParams);
    setMarketType(newMarket);
  };

  const periodToDays: Record<TimeRange, number> = {
    "1w": 7, // Show 7 days of daily data
    "1m": 30, // Show 30 days of daily data
    "3m": 90, // Show 90 days of daily data
    "6m": 180, // Show 180 days of daily data
    "1y": 365, // Show 365 days of daily data
  };

  // Calculate dynamic width to prevent sidebar cropping
  // Sidebar is 64px when collapsed, 320px when expanded on desktop, 256px on mobile
  // Use full width only on mobile (< 768px), keep margin on tablets and desktop
  const getSidebarWidth = () => {
    if (windowWidth < 768) {
      // Mobile: collapsed 56px (w-14), expanded 256px (w-64)
      return sidebarExpanded ? 256 + 56 : 56; // expanded panel + collapsed sidebar
    } else {
      // Desktop: collapsed 64px (w-16), expanded 320px (w-80) 
      return sidebarExpanded ? 320 + 64 : 80; // expanded panel + collapsed sidebar + padding
    }
  };

  const wrapperStyle = windowWidth >= 768
    ? {
        width: `${windowWidth - getSidebarWidth()}px`,
        maxWidth: `${windowWidth - getSidebarWidth()}px`,
        overflow: 'hidden',
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' // Smoother transition with easing
      }
    : {
        width: '100%',
        maxWidth: '100%'
      };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full overflow-x-hidden">
        <div style={wrapperStyle}>
          <div className="px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Loading and Error States */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="text-gray-600">검색 중...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Stock Search Bar - Always visible */}
          <div className="mb-6">
            <StockSearch
              onStockSelect={(stock) => {
                selectStock({
                  rank: 0,
                  ticker: stock.ticker,
                  name: stock.name,
                  price: 0,
                  change: 0,
                  changeRate: 0,
                  marketCap: "0",
                  volume: "0",
                });
              }}
              darkMode={false}
            />
          </div>

          {/* Detail View */}
          {viewMode === "detail" && selectedTicker && (
            <div className="space-y-6 w-full">
              {/* Back Button */}
              <button
                onClick={goBackToRanking}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>순위 목록으로 돌아가기</span>
              </button>

              {/* Stock Info - Full Width */}
              <div className="space-y-6">
                {/* Stock Header */}
                {selectedStock || realtimePriceData ? (
                  <StockDetailHeader
                    key={`header-${selectedTicker}`}
                    ticker={selectedTicker || ""}
                    name={
                      selectedStock?.name ||
                      realtimePriceData?.name ||
                      selectedTicker ||
                      ""
                    }
                    price={(() => {
                      const price =
                        selectedStock?.price ||
                        parseFloat(
                          (realtimePriceData?.closePrice ?? "0")
                            .toString()
                            .replace(/,/g, "")
                        ) ||
                        0;
                      return price;
                    })()}
                    change={
                      selectedStock?.change ||
                      parseFloat(
                        (realtimePriceData?.priceChange ?? "0")
                          .toString()
                          .replace(/,/g, "")
                      ) ||
                      0
                    }
                    changeRate={
                      selectedStock?.changeRate ||
                      parseFloat(
                        (realtimePriceData?.changeRate ?? "0")
                          .toString()
                          .replace(/,/g, "")
                      ) ||
                      0
                    }
                    high={
                      realtimePriceData?.highPrice
                        ? parseFloat(realtimePriceData.highPrice)
                        : undefined
                    }
                    low={
                      realtimePriceData?.lowPrice
                        ? parseFloat(realtimePriceData.lowPrice)
                        : undefined
                    }
                    open={
                      realtimePriceData?.openPrice
                        ? parseFloat(realtimePriceData.openPrice)
                        : undefined
                    }
                    prevClose={
                      realtimePriceData?.prevClosePrice
                        ? parseFloat(realtimePriceData.prevClosePrice)
                        : undefined
                    }
                    volume={realtimePriceData?.volume || selectedStock?.volume}
                    onFavoriteToggle={toggleFavorite}
                    isFavorite={isInWatchlist(selectedTicker || "")}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/6"></div>
                    </div>
                  </div>
                )}

                {/* Stock Chart */}
                <StockChart
                  selectedStock={{
                    ticker: selectedTicker || "",
                    name: selectedStock?.name || realtimePriceData?.name || "",
                  }}
                  period={periodToDays[timeRange]}
                  chartType="line"
                  darkMode={false}
                  drawingMode={drawingMode}
                />
              </div>
            </div>
          )}

          {/* Ranking View */}
          {viewMode === "ranking" && (
            <>
              {rankingError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {rankingError}
                </div>
              ) : (
                <StockRankingTable
                  stocks={rankingStocks}
                  onStockClick={selectStock}
                  rankingType={rankingType}
                  onRankingTypeChange={handleRankingTypeChange}
                  title={`${
                    marketType === "전체" ? "통합" : marketType.toUpperCase()
                  } 실시간 차트`}
                  marketType={marketType}
                  onMarketTypeChange={handleMarketTypeChange}
                />
              )}
            </>
          )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductsPage;
