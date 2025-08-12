import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StockDetailHeader, StockRankingTable, StockSearch, StockChart } from "../components/stock";
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
  volume: string;
  tradeValue?: string;
  logo?: string;
}

interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changeRate: number;
}

type ViewMode = "detail" | "ranking";
type TimeRange = "1w" | "1m" | "3m" | "6m" | "1y";
type RankingType = "volume" | "gainers" | "losers" | "marketCap" | "tradeValue";
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
  const [timeRange, setTimeRange] = useState<TimeRange>("1w");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
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
    selectedStock?.ticker?.startsWith('900') || selectedStock?.ticker?.startsWith('300') ? "KOSDAQ" : "KOSPI"
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
      tradeValue: stock.tradeValue || "0",
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

  

      // Show optimistic UI immediately to reduce perceived loading time
      setRealtimePriceData({
        ticker: selectedTicker,
        name: `${selectedTicker} 로딩 중...`,
        closePrice: "0",
        priceChange: "0",
        changeRate: "0",
        volume: "0"
      });
      setPriceLoading(true);

      try {
        // 🚀 COMBINATION APPROACH: Parallel + Smart + Fast
        
        // Smart market detection heuristic
        const getSmartMarketGuess = (ticker: string) => {
          if (ticker.startsWith('3') || ticker.startsWith('9')) return 'KOSDAQ';
          if (ticker.startsWith('04') || ticker.startsWith('05')) return 'KOSDAQ';
          if (ticker.startsWith('00')) return 'KOSPI';
          return 'KOSPI'; // Default for ambiguous cases
        };

        const smartGuess = getSmartMarketGuess(selectedTicker);
        const otherMarket = smartGuess === 'KOSPI' ? 'KOSDAQ' : 'KOSPI';
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const baseHeaders = {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        };

        console.log(`🎯 Smart guess: trying ${smartGuess} first for ${selectedTicker}`);

        // Strategy 1: Try smart guess first (fastest for correct guesses)
        let response;
        let stockData;
        let successfulMarket = '';

        try {
          const smartUrl = `${import.meta.env.VITE_API_URL}/api/krx/stock/${selectedTicker}?market=${smartGuess}&_t=${timestamp}`;
          response = await axios.get(smartUrl, { headers: baseHeaders });
          successfulMarket = smartGuess;
          console.log(`✅ Smart guess SUCCESS: ${selectedTicker} found in ${smartGuess} market`);
        } catch (smartGuessError: any) {
          // Only log error if it's not a 404 (expected for wrong market)
          if (smartGuessError.response?.status !== 404) {
            console.error(`⚠️ Unexpected error for ${smartGuess}:`, smartGuessError.message);
          } else {
            console.log(`📍 ${selectedTicker} not in ${smartGuess}, trying ${otherMarket}...`);
          }
          
          // Strategy 2: Try the other market
          try {
            const fallbackUrl = `${import.meta.env.VITE_API_URL}/api/krx/stock/${selectedTicker}?market=${otherMarket}&_t=${timestamp}`;
            response = await axios.get(fallbackUrl, { headers: baseHeaders });
            successfulMarket = otherMarket;
            console.log(`✅ Fallback SUCCESS: ${selectedTicker} found in ${otherMarket} market`);
          } catch (fallbackError: any) {
            if (fallbackError.response?.status === 404) {
              console.warn(`⚠️ Stock ${selectedTicker} not found in either market`);
            } else {
              console.error(`❌ Unexpected error:`, fallbackError.message);
            }
            throw new Error('Both individual attempts failed');
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
            console.error(`TICKER MISMATCH! Requested: ${selectedTicker}, Received: ${returnedTicker}`);
            console.error("This indicates a backend caching issue");
          }

          // Map KRX API field names to our expected format
          const mappedData = {
            ticker: stockData.ticker || stockData.ISU_SRT_CD,
            name: stockData.name || stockData.ISU_ABBRV,
            closePrice: (stockData.closePrice || stockData.TDD_CLSPRC || "0").toString().replace(/,/g, ''),
            priceChange: (stockData.priceChange || stockData.CMPPREVDD_PRC || "0").toString().replace(/,/g, ''),
            changeRate: (stockData.changeRate || stockData.FLUC_RT || "0").toString().replace(/,/g, ''),
            volume: formatVolume(stockData.volume || stockData.ACC_TRDVOL || "0"),
            tradeValue: stockData.tradeValue || stockData.ACC_TRDVAL,
            marketCap: stockData.marketCap || stockData.MKTCAP,
            // Add OHLC prices
            openPrice: (stockData.openPrice || stockData.TDD_OPNPRC || "0").toString().replace(/,/g, ''),
            highPrice: (stockData.highPrice || stockData.TDD_HGPRC || "0").toString().replace(/,/g, ''),
            lowPrice: (stockData.lowPrice || stockData.TDD_LWPRC || "0").toString().replace(/,/g, ''),
            prevClosePrice: stockData.prevClosePrice || ((stockData.closePrice || stockData.TDD_CLSPRC || "0").toString().replace(/,/g, '') - (stockData.priceChange || stockData.CMPPREVDD_PRC || "0").toString().replace(/,/g, '')).toString()
          };
          
          // Debug logging for IT Chem
          if (selectedTicker === '309710') {
            console.log(`🔍 IT Chem API response:`, stockData);
            console.log(`📊 Mapped data:`, mappedData);
          }

  

          // Only set the data if it's for the correct ticker
          if (returnedTicker === selectedTicker) {
            setRealtimePriceData(mappedData);
            return; // Success, no need for fallback
          } else {
            console.error("Skipping wrong ticker data, will try fallback");
            // Continue to fallback below
          }
        } else {
          console.log("No stock data in response, trying fallback");
        }
      } catch (err) {
        console.error("Primary API failed:", err);
      }

      // 🔄 ENHANCED FALLBACK: Multiple endpoint strategy with timeout
      try {
        console.log(`🔄 Trying enhanced fallback for ${selectedTicker}...`);
        
        const smartGuess = selectedTicker.startsWith('3') || selectedTicker.startsWith('9') || 
                          selectedTicker.startsWith('04') || selectedTicker.startsWith('05') 
                          ? 'KOSDAQ' : 'KOSPI';
        const otherMarket = smartGuess === 'KOSPI' ? 'KOSDAQ' : 'KOSPI';

        // Strategy 3: Parallel API calls with Promise.race for speed
        const createApiCall = (market: string) => 
          axios.get(`${import.meta.env.VITE_API_URL}/api/krx/stock/${selectedTicker}?market=${market}`, {
            headers: baseHeaders,
            timeout: 5000 // 5 second timeout per request
          });

        let dailyResponse;
        try {
          // Try smart guess first
          dailyResponse = await createApiCall(smartGuess);
          console.log(`🚀 Enhanced fallback SUCCESS: ${selectedTicker} from ${smartGuess}`);
        } catch (smartError) {
          // Try other market
          dailyResponse = await createApiCall(otherMarket);  
          console.log(`🚀 Enhanced fallback SUCCESS: ${selectedTicker} from ${otherMarket}`);
        }
        
        // Handle both wrapped and direct format
        let stockData;
        if (dailyResponse.data) {
          if (dailyResponse.data.success !== undefined) {
            // Wrapped format
            if (dailyResponse.data.success && dailyResponse.data.data) {
              stockData = dailyResponse.data.data;
            }
          } else if (dailyResponse.data.ISU_SRT_CD || dailyResponse.data.ticker) {
            // Direct KrxStockInfo object format
            stockData = dailyResponse.data;
          }
        }
        
        if (stockData) {

          const price = parseFloat(stockData.closePrice?.replace(/,/g, '')) || 0;
          const change = parseFloat(stockData.priceChange?.replace(/,/g, '')) || 0;
          const changeRate = parseFloat(stockData.changeRate?.replace(/,/g, '')) || 0;

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
            name: stockData.name || stockName,
            closePrice: price.toString(),
            priceChange: change.toString(),
            changeRate: changeRate.toFixed(2),
            volume: formatVolume(stockData.volume || "0"),
            // Add OHLC prices
            openPrice: (stockData.openPrice || stockData.TDD_OPNPRC || "0").toString().replace(/,/g, ''),
            highPrice: (stockData.highPrice || stockData.TDD_HGPRC || "0").toString().replace(/,/g, ''),
            lowPrice: (stockData.lowPrice || stockData.TDD_LWPRC || "0").toString().replace(/,/g, ''),
            prevClosePrice: (price - change).toString()
          };


          setRealtimePriceData(fallbackData);
        }
      } catch (fallbackErr) {
        console.error("Enhanced fallback failed:", fallbackErr);
        
        // 🚁 ULTIMATE STRATEGY: Parallel requests with Promise.race
        try {
          console.log(`🚁 Last resort: Parallel requests for ${selectedTicker}...`);
          
          const kospiPromise = axios.get(`${import.meta.env.VITE_API_URL}/api/krx/stock/${selectedTicker}?market=KOSPI`, { 
            headers: baseHeaders, timeout: 3000 
          });
          const kosdaqPromise = axios.get(`${import.meta.env.VITE_API_URL}/api/krx/stock/${selectedTicker}?market=KOSDAQ`, { 
            headers: baseHeaders, timeout: 3000 
          });

          // Winner takes all - first successful response wins
          const winnerResponse = await Promise.race([
            kospiPromise.catch(err => ({ error: 'KOSPI failed', details: err })),
            kosdaqPromise.catch(err => ({ error: 'KOSDAQ failed', details: err }))
          ]);

          if (!winnerResponse.error && winnerResponse.data) {
            console.log(`🏆 PARALLEL SUCCESS: ${selectedTicker} data retrieved!`);
            
            const data = winnerResponse.data.data || winnerResponse.data;
            setRealtimePriceData({
              ticker: selectedTicker,
              name: data.name || data.ISU_ABBRV || `Stock ${selectedTicker}`,
              closePrice: (data.closePrice || data.TDD_CLSPRC || "0").toString(),
              priceChange: (data.priceChange || data.CMPPREVDD_PRC || "0").toString(),
              changeRate: (data.changeRate || data.FLUC_RT || "0").toString(),
              volume: formatVolume(data.volume || data.ACC_TRDVOL || "0"),
              // Add OHLC prices
              openPrice: (data.openPrice || data.TDD_OPNPRC || "0").toString().replace(/,/g, ''),
              highPrice: (data.highPrice || data.TDD_HGPRC || "0").toString().replace(/,/g, ''),
              lowPrice: (data.lowPrice || data.TDD_LWPRC || "0").toString().replace(/,/g, ''),
              prevClosePrice: ((parseFloat((data.closePrice || data.TDD_CLSPRC || "0").toString().replace(/,/g, ''))) - (parseFloat((data.priceChange || data.CMPPREVDD_PRC || "0").toString().replace(/,/g, '')))).toString()
            });
            return; // Success!
          }
        } catch (parallelErr) {
          console.error("Even parallel requests failed:", parallelErr);
        }
        
        // 🆘 GRACEFUL DEGRADATION: Show minimal UI
        setRealtimePriceData({
          ticker: selectedTicker,
          name: `Stock ${selectedTicker}`,
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
  }, [searchParams]);


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
      closePrice: (stock.price || 0).toString(),
      priceChange: (stock.change || 0).toString(),
      changeRate: (stock.changeRate || 0).toString(),
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
    "1w": 7,    // Show 7 days of daily data
    "1m": 30,   // Show 30 days of daily data
    "3m": 90,   // Show 90 days of daily data
    "6m": 180,  // Show 180 days of daily data
    "1y": 365,  // Show 365 days of daily data
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
                  volume: 0
                });
              }}
              darkMode={false}
            />
          </div>

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