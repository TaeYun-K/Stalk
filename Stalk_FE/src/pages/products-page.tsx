import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import StockChart from "../components/chart/stock-chart";
import StockDetailHeader from "../components/stock-detail-header";
import StockRankingTable from "../components/stock-ranking-table";
import {
  useMarketIndices,
  useStockBasicInfo,
  useStockData,
  useStockList,
} from "../hooks/use-stock-data";

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
  marketCap: string;
  logo?: string;
}

interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changeRate: number;
}

type ViewMode = "detail" | "ranking";
type TimeRange = "1d" | "1w" | "1m";
type RankingType = "volume" | "rising" | "falling";
type MarketType = "전체" | "kospi" | "kosdaq";

const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial state from URL params
  const tickerFromUrl = searchParams.get("ticker");
  const rankingTypeFromUrl = (searchParams.get("ranking") as RankingType) || "volume";
  const marketTypeFromUrl = (searchParams.get("market") as MarketType) || "전체";

  const [viewMode, setViewMode] = useState<ViewMode>(tickerFromUrl ? "detail" : "ranking");
  const [rankingType, setRankingType] = useState<RankingType>(rankingTypeFromUrl);
  const [marketType, setMarketType] = useState<MarketType>(marketTypeFromUrl);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(tickerFromUrl);
  const [timeRange, setTimeRange] = useState<TimeRange>("1d");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [chartType, setChartType] = useState<'line'>('line');
  const [drawingMode, setDrawingMode] = useState(false);

  // Use custom hooks for data fetching
  const {
    data: stockData,
    isLoading: stockLoading,
    error: stockError,
  } = useStockData(selectedTicker, {
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // State for real-time price data
  const [realtimePriceData, setRealtimePriceData] = useState<any>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Helper function to format volume with Korean units
  const formatVolume = (vol: string) => {
    const num = parseInt(vol?.replace(/,/g, '') || '0');
    if (num >= 100000000) {
      return (num / 100000000).toFixed(1) + '억';
    } else if (num >= 10000) {
      return (num / 10000).toFixed(1) + '만';
    }
    return num.toLocaleString();
  };

  const { indices: marketIndices } = useMarketIndices();

  // Use the stock list hook for ranking data
  const {
    stocks: rankingData,
    isLoading: rankingLoading,
    error: rankingError,
  } = useStockList(rankingType, marketType);


  // Use stock basic info hook for enhanced detail view
  // Commented out as the endpoint doesn't exist yet
  /*
  const {
    basicInfo,
    isLoading: basicInfoLoading,
    error: basicInfoError,
  } = useStockBasicInfo(
    selectedTicker,
    selectedStock?.marketType === "KOSDAQ" ? "KSQ" : "STK"
  );
  */

  // Convert stock data to ranking format
  const rankingStocks: RankingStock[] =
    rankingData?.map((stock: any) => ({
      rank: stock.rank || 0,
      ticker: stock.ticker || "",
      name: stock.name || "",
      price: stock.price || 0,
      change: stock.change || 0,
      changeRate: stock.changeRate || 0,
      marketCap: stock.marketCap || "0",
      volume: stock.volume || "0",
    })) || [];

  // Debug logging
  useEffect(() => {

  }, [rankingData, rankingLoading, rankingError, rankingStocks]);

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

  

      // Clear previous data first
      setRealtimePriceData(null);
      setPriceLoading(true);

      try {
        // First try to get basic info from KRX
        const marketType = selectedTicker.startsWith('900') || selectedTicker.startsWith('300') ? 'KSQ' : 'STK';
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `${import.meta.env.VITE_API_URL}/api/krx/stock/${selectedTicker}?market=${marketType}&_t=${timestamp}`;


        const response = await axios.get(url, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (response.data) {
  

          // Check if we got data for the correct ticker
          const returnedTicker = response.data.ISU_SRT_CD || response.data.ticker;
          if (returnedTicker !== selectedTicker) {
            console.error(`TICKER MISMATCH! Requested: ${selectedTicker}, Received: ${returnedTicker}`);
            console.error("This indicates a backend caching issue");
          }

          // Map KRX API field names to our expected format
          const mappedData = {
            ticker: response.data.ISU_SRT_CD || response.data.ticker,
            name: response.data.ISU_ABBRV || response.data.name,
            closePrice: (response.data.TDD_CLSPRC || response.data.closePrice || "0").toString().replace(/,/g, ''),
            priceChange: (response.data.CMPPREVDD_PRC || response.data.priceChange || "0").toString().replace(/,/g, ''),
            changeRate: (response.data.FLUC_RT || response.data.changeRate || "0").toString().replace(/,/g, ''),
            volume: formatVolume(response.data.ACC_TRDVOL || response.data.volume || "0"),
            tradeValue: response.data.ACC_TRDVAL || response.data.tradeValue,
            marketCap: response.data.MKTCAP || response.data.marketCap,
          };

  

          // Only set the data if it's for the correct ticker
          if (returnedTicker === selectedTicker) {
            setRealtimePriceData(mappedData);
            return; // Success, no need for fallback
          } else {
            console.error("Skipping wrong ticker data, will try fallback");
            // Continue to fallback below
          }
        }
      } catch (err) {
        console.error("Failed to fetch real-time price:", err);
      }

      // Fallback: Try to get data from daily endpoint
      
      try {
        const dailyResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/stock/daily/${selectedTicker}?period=2`);
        if (dailyResponse.data.success && dailyResponse.data.data.length > 0) {
          const latestData = dailyResponse.data.data[0];
          const prevData = dailyResponse.data.data[1] || latestData;

          const change = latestData.close - prevData.close;
          const changeRate = prevData.close > 0 ? ((change / prevData.close) * 100) : 0;

          // Try to get name from search
          let stockName = "";
          try {
            const searchResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/stock/search/${selectedTicker}`);
            if (searchResponse.data.success && searchResponse.data.data.length > 0) {
              stockName = searchResponse.data.data[0].name;
  
            }
          } catch (searchErr) {
            console.error("Failed to get stock name:", searchErr);
          }

          // If still no name, try from the ranking list
          if (!stockName && rankingData) {
            const stockFromRanking = rankingData.find((s: any) => s.ticker === selectedTicker);
            if (stockFromRanking) {
              stockName = stockFromRanking.name;
  
            }
          }

          // Last resort - use ticker but mark it
          if (!stockName) {
            stockName = `종목 ${selectedTicker}`;
            console.warn("Could not find stock name, using ticker");
          }

          const fallbackData = {
            ticker: selectedTicker,
            name: stockName,
            closePrice: latestData.close.toString(),
            priceChange: change.toString(),
            changeRate: changeRate.toFixed(2),
            volume: formatVolume(latestData.volume.toString())
          };


          setRealtimePriceData(fallbackData);
        }
      } catch (fallbackErr) {
        console.error("Fallback price fetch failed:", fallbackErr);
        // Set minimal data so UI doesn't break
        setRealtimePriceData({
          ticker: selectedTicker,
          name: selectedTicker,
          closePrice: "0",
          priceChange: "0",
          changeRate: "0",
          volume: "0"
        });
      } finally {
        setPriceLoading(false);
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

    // Handle search from URL params
    const urlSearchQuery = searchParams.get("search");
    if (urlSearchQuery) {
      searchStocks(urlSearchQuery);
    }
  }, [searchParams]);

  // Search stocks from backend
  const searchStocks = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/stock/search/${query}`
      );
      if (response.data.success && response.data.data.length > 0) {
        const stock = response.data.data[0];

        // Update URL params when selecting a stock from search
        const newParams = new URLSearchParams(searchParams);
        newParams.set("ticker", stock.ticker);
        newParams.set("ranking", rankingType);
        newParams.set("market", marketType);
        setSearchParams(newParams);

        setSelectedTicker(stock.ticker);
        setViewMode("detail");
      } else {
        setError("검색 결과가 없습니다.");
      }
    } catch (err) {
      console.error("Stock search error:", err);
      setError("주식 검색 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectStock = (stock: RankingStock) => {

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
      closePrice: stock.price.toString(),
      priceChange: stock.change.toString(),
      changeRate: stock.changeRate.toString(),
      volume: stock.volume || "0"
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

  const toggleFavorite = () => {
    if (selectedStock) {
      setFavorites((prev) =>
        prev.includes(selectedStock.ticker)
          ? prev.filter((t) => t !== selectedStock.ticker)
          : [...prev, selectedStock.ticker]
      );
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is now handled by the dropdown component
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
    "1d": 30,  // Show 30 days of daily data
    "1w": -14, // Show 14 weeks of weekly data (negative indicates weekly aggregation)
    "1m": -12, // Show 12 months of monthly data (negative indicates monthly aggregation)
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="max-w-8xl mx-auto">
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

          {/* Detail View */}
          {viewMode === "detail" && selectedTicker && (
            <div className="space-y-6">
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
                {(selectedStock || realtimePriceData) ? (
                  <StockDetailHeader
                    key={`header-${selectedTicker}`}
                    ticker={selectedTicker || ""}
                    name={selectedStock?.name || realtimePriceData?.name || selectedTicker || ""}
                    price={(() => {
                      const price = selectedStock?.price || parseFloat(realtimePriceData?.closePrice?.replace(/,/g, '')) || 0;

                      return price;
                    })()}
                    change={selectedStock?.change || parseFloat(realtimePriceData?.priceChange?.replace(/,/g, '')) || 0}
                    changeRate={selectedStock?.changeRate || parseFloat(realtimePriceData?.changeRate?.replace(/,/g, '')) || 0}
                    high={parseFloat(realtimePriceData?.highPrice) || undefined}
                    low={parseFloat(realtimePriceData?.lowPrice) || undefined}
                    open={parseFloat(realtimePriceData?.openPrice) || undefined}
                    prevClose={parseFloat(realtimePriceData?.prevClosePrice) || undefined}
                    volume={realtimePriceData?.volume || selectedStock?.volume}
                    onFavoriteToggle={toggleFavorite}
                    isFavorite={favorites.includes(selectedTicker || "")}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/6"></div>
                    </div>
                  </div>
                )}

                {/* Integrated Chart Box with Period Navigation */}
                <div className="bg-white rounded-lg shadow-sm">
                  {/* Period Navigation Bar */}
                  <div className="border-b border-gray-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* Time Range Selector */}
                      <div className="flex space-x-2">
                        {(
                          ["1d", "1w", "1m"] as TimeRange[]
                        ).map((range) => {
                          const displayLabel = {
                            "1d": "일",
                            "1w": "주",
                            "1m": "월"
                          }[range] || range;
                          
                          return (
                            <button
                              key={range}
                              onClick={() => setTimeRange(range)}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                timeRange === range
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {displayLabel}
                            </button>
                          );
                        })}
                      </div>

                      {/* Chart Type and Refresh Controls */}
                      <div className="flex items-center space-x-4">
                        
                        {/* Refresh Button */}
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          새로고침
                        </button>
                        
                        {/* Drawing Mode Button */}
                        <button 
                          onClick={() => setDrawingMode(!drawingMode)}
                          className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                            drawingMode 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {drawingMode ? '그리기 종료' : '그리기'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Chart Component */}
                  <div style={{ height: "600px", padding: "20px" }}>
                    <StockChart
                      selectedStock={{
                        ticker: selectedTicker || "",
                        name: selectedStock?.name || realtimePriceData?.name || "",
                      }}
                      darkMode={false}
                      realTimeUpdates={false}
                      period={periodToDays[timeRange]}
                      chartType={chartType}
                      drawingMode={drawingMode}
                    />
                  </div>
                </div>

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
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSearchSubmit={handleSearch}
                  title={`${marketType === "전체" ? "통합" : marketType.toUpperCase()} 실시간 차트`}
                  marketType={marketType}
                  onMarketTypeChange={handleMarketTypeChange}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductsPage; 