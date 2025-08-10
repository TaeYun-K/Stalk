package com.Stalk.project.api.stock.controller;

import com.Stalk.project.api.stock.dto.KrxRankingStock;
import com.Stalk.project.api.stock.dto.KrxStockInfo;
import com.Stalk.project.api.stock.service.KrxApiService;
import com.Stalk.project.api.stock.service.KisApiService;
import com.Stalk.project.api.stock.service.StockListingService;
import com.Stalk.project.api.stock.dto.KisStockInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/krx")
public class KrxDataController {
    
    private static final Logger logger = LoggerFactory.getLogger(KrxDataController.class);
    
    
    @Autowired
    private StockListingService stockListingService;
    
    @Autowired
    private KrxApiService krxApiService;
    
    @Autowired
    private KisApiService kisApiService;
    
    @GetMapping("/fetch-all-stocks")
    public ResponseEntity<Map<String, Object>> fetchAllStocks() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Starting KRX stock data fetch from data.go.kr API...");
            
            // Get stocks from stock listing service (already loaded in memory)  
            List<StockListingService.StockListing> stocks = stockListingService.searchStocks("");
            
            if (stocks.isEmpty()) {
                response.put("success", false);
                response.put("message", "No stocks available. Service may not be initialized properly.");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Data is available in memory for API usage
            
            response.put("success", true);
            response.put("message", String.format("Successfully loaded %d KRX stock listings from API", stocks.size()));
            response.put("count", stocks.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to fetch KRX stock listings", e);
            response.put("success", false);
            response.put("message", "Failed to fetch stock listings: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("KRX Data Service is running");
    }
    
    @GetMapping("/test-connection")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Testing stock listing service...");
            // Test by searching for a common stock
            List<StockListingService.StockListing> testResults = stockListingService.searchStocks("삼성");
            boolean serviceWorking = !testResults.isEmpty();
            
            response.put("success", serviceWorking);
            response.put("message", serviceWorking ? 
                "Stock listing service is working. Found " + testResults.size() + " stocks matching '삼성'" :
                "Stock listing service has no data available");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("API connection test failed", e);
            response.put("success", false);
            response.put("message", "Connection test failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Search stocks by name or ticker
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchStocks(@RequestParam(required = false) String query) {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, String>> results = new ArrayList<>();
        
        try {
            logger.info("Searching stocks with query: {}", query);
            
            // Return empty results for empty query
            if (query == null || query.trim().isEmpty()) {
                response.put("isSuccess", true);
                response.put("message", "Empty query");
                response.put("result", results);
                return ResponseEntity.ok(response);
            }
            
            // Try using StockListingService if available
            if (stockListingService != null) {
                try {
                    List<StockListingService.StockListing> searchResults = stockListingService.searchStocks(query.trim());
                    if (searchResults != null) {
                        for (StockListingService.StockListing stock : searchResults) {
                            if (stock != null && stock.getTicker() != null && stock.getCompanyName() != null) {
                                Map<String, String> stockData = new HashMap<>();
                                stockData.put("ticker", stock.getTicker());
                                stockData.put("name", stock.getCompanyName());
                                results.add(stockData);
                                if (results.size() >= 10) break;
                            }
                        }
                    }
                } catch (Exception e) {
                    logger.warn("StockListingService search failed: {}", e.getMessage());
                }
            }
            
            // If no results yet, try KrxApiService
            if (results.isEmpty() && krxApiService != null) {
                try {
                    logger.info("Trying KrxApiService for search");
                    // Get stocks from volume ranking and filter
                    List<KrxRankingStock> kospiStocks = krxApiService.getKospiVolumeRanking(100);
                    List<KrxRankingStock> kosdaqStocks = krxApiService.getKosdaqVolumeRanking(100);
                    
                    String searchQuery = query.trim().toLowerCase();
                    
                    // Search in KOSPI stocks
                    if (kospiStocks != null) {
                        for (KrxRankingStock stock : kospiStocks) {
                            if (stock != null && stock.getName() != null && stock.getTicker() != null) {
                                if (stock.getName().toLowerCase().contains(searchQuery) ||
                                    stock.getTicker().contains(query.trim())) {
                                    Map<String, String> stockData = new HashMap<>();
                                    stockData.put("ticker", stock.getTicker());
                                    stockData.put("name", stock.getName());
                                    results.add(stockData);
                                    if (results.size() >= 10) break;
                                }
                            }
                        }
                    }
                    
                    // Search in KOSDAQ stocks if needed
                    if (results.size() < 10 && kosdaqStocks != null) {
                        for (KrxRankingStock stock : kosdaqStocks) {
                            if (stock != null && stock.getName() != null && stock.getTicker() != null) {
                                if (stock.getName().toLowerCase().contains(searchQuery) ||
                                    stock.getTicker().contains(query.trim())) {
                                    Map<String, String> stockData = new HashMap<>();
                                    stockData.put("ticker", stock.getTicker());
                                    stockData.put("name", stock.getName());
                                    results.add(stockData);
                                    if (results.size() >= 10) break;
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    logger.warn("KrxApiService search failed: {}", e.getMessage());
                }
            }
            
            response.put("isSuccess", true);
            response.put("result", results);
            response.put("message", "Found " + results.size() + " results");
            
            logger.info("Search returned {} results for query: {}", results.size(), query);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Stock search failed for query: " + query, e);
            response.put("isSuccess", false);
            response.put("message", "Search error");
            response.put("result", new ArrayList<>());
            return ResponseEntity.ok(response);
        }
    }
    
    // ========== KRX Open API Endpoints ==========
    
    /**
     * Test KRX Open API connectivity
     */
    @GetMapping("/api/test-connection")
    public ResponseEntity<Map<String, Object>> testKrxApiConnection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Testing KRX Open API connection...");
            boolean isConnected = krxApiService.testConnection();
            
            response.put("success", isConnected);
            response.put("message", isConnected ? 
                "KRX Open API connection successful" : 
                "KRX Open API connection failed");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("KRX Open API connection test failed", e);
            response.put("success", false);
            response.put("message", "Connection test failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get KOSPI volume ranking (거래량 순위)
     */
    @GetMapping("/kospi/volume-ranking")
    public ResponseEntity<List<KrxRankingStock>> getKospiVolumeRanking(
            @RequestParam(defaultValue = "50") int limit) {
        try {
            List<KrxRankingStock> rankings = krxApiService.getKospiVolumeRanking(limit);
            return ResponseEntity.ok(rankings);
        } catch (Exception e) {
            logger.error("Failed to fetch KOSPI volume ranking", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get KOSPI trade value ranking (거래대금 순위)
     */
    @GetMapping("/kospi/trade-value-ranking")
    public ResponseEntity<List<KrxRankingStock>> getKospiTradeValueRanking(
            @RequestParam(defaultValue = "50") int limit) {
        try {
            List<KrxRankingStock> rankings = krxApiService.getKospiTradeValueRanking(limit);
            return ResponseEntity.ok(rankings);
        } catch (Exception e) {
            logger.error("Failed to fetch KOSPI trade value ranking", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get KOSPI price increase ranking (상승률 순위)
     */
    @GetMapping("/kospi/price-increase-ranking")
    public ResponseEntity<List<KrxRankingStock>> getKospiPriceIncreaseRanking(
            @RequestParam(defaultValue = "50") int limit) {
        try {
            List<KrxRankingStock> rankings = krxApiService.getKospiPriceIncreaseRanking(limit);
            return ResponseEntity.ok(rankings);
        } catch (Exception e) {
            logger.error("Failed to fetch KOSPI price increase ranking", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get KOSPI price decrease ranking (하락률 순위)
     */
    @GetMapping("/kospi/price-decrease-ranking")
    public ResponseEntity<List<KrxRankingStock>> getKospiPriceDecreaseRanking(
            @RequestParam(defaultValue = "50") int limit) {
        try {
            List<KrxRankingStock> rankings = krxApiService.getKospiPriceDecreaseRanking(limit);
            return ResponseEntity.ok(rankings);
        } catch (Exception e) {
            logger.error("Failed to fetch KOSPI price decrease ranking", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get KOSDAQ volume ranking (거래량 순위)
     */
    @GetMapping("/kosdaq/volume-ranking")
    public ResponseEntity<List<KrxRankingStock>> getKosdaqVolumeRanking(
            @RequestParam(defaultValue = "50") int limit) {
        try {
            List<KrxRankingStock> rankings = krxApiService.getKosdaqVolumeRanking(limit);
            return ResponseEntity.ok(rankings);
        } catch (Exception e) {
            logger.error("Failed to fetch KOSDAQ volume ranking", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get KOSDAQ trade value ranking (거래대금 순위)
     */
    @GetMapping("/kosdaq/trade-value-ranking")
    public ResponseEntity<List<KrxRankingStock>> getKosdaqTradeValueRanking(
            @RequestParam(defaultValue = "50") int limit) {
        try {
            List<KrxRankingStock> rankings = krxApiService.getKosdaqTradeValueRanking(limit);
            return ResponseEntity.ok(rankings);
        } catch (Exception e) {
            logger.error("Failed to fetch KOSDAQ trade value ranking", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get KOSDAQ price increase ranking (상승률 순위)
     */
    @GetMapping("/kosdaq/price-increase-ranking")
    public ResponseEntity<List<KrxRankingStock>> getKosdaqPriceIncreaseRanking(
            @RequestParam(defaultValue = "50") int limit) {
        try {
            List<KrxRankingStock> rankings = krxApiService.getKosdaqPriceIncreaseRanking(limit);
            return ResponseEntity.ok(rankings);
        } catch (Exception e) {
            logger.error("Failed to fetch KOSDAQ price increase ranking", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get KOSDAQ price decrease ranking (하락률 순위)
     */
    @GetMapping("/kosdaq/price-decrease-ranking")
    public ResponseEntity<List<KrxRankingStock>> getKosdaqPriceDecreaseRanking(
            @RequestParam(defaultValue = "50") int limit) {
        try {
            List<KrxRankingStock> rankings = krxApiService.getKosdaqPriceDecreaseRanking(limit);
            return ResponseEntity.ok(rankings);
        } catch (Exception e) {
            logger.error("Failed to fetch KOSDAQ price decrease ranking", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get individual stock information
     * @param ticker Stock ticker code (e.g., "005930" for Samsung Electronics)
     * @param market Market type: "KOSPI" for main market, "KOSDAQ" for growth market
     */
    @GetMapping("/stock/{ticker}")
    public ResponseEntity<?> getStockInfo(
            @PathVariable String ticker,
            @RequestParam(defaultValue = "KOSPI") String market,
            @RequestParam(required = false) Integer period) {
        try {
            logger.info("API request for stock info - ticker: {}, market: {}, period: {}", ticker, market, period);
            
            // If period is specified, use KIS API for historical data (hybrid approach)
            if (period != null && period >= 1) {
                logger.info("Using KIS API for historical data - ticker: {}, period: {} days", ticker, period);
                List<KisStockInfo> kisHistoricalData = kisApiService.getHistoricalPrices(ticker, period);
                
                if (!kisHistoricalData.isEmpty()) {
                    logger.info("KIS historical data retrieved - ticker: {}, points: {}", 
                        ticker, kisHistoricalData.size());
                    
                    // Convert KIS format to KRX format for frontend compatibility
                    List<Map<String, Object>> convertedData = convertKisToKrxFormat(kisHistoricalData);
                    return ResponseEntity.ok(convertedData);
                } else {
                    logger.warn("No KIS historical data found, falling back to KRX current data");
                    // Fall back to KRX current data but return as array for consistency
                    KrxStockInfo stockInfo = krxApiService.getIndividualStockInfo(ticker, market);
                    if (stockInfo != null) {
                        List<KrxStockInfo> fallbackList = new java.util.ArrayList<>();
                        fallbackList.add(stockInfo);
                        logger.info("Returning KRX current data as fallback");
                        return ResponseEntity.ok(fallbackList);
                    }
                    return ResponseEntity.notFound().build();
                }
            } else {
                // Return current stock info
                KrxStockInfo stockInfo = krxApiService.getIndividualStockInfo(ticker, market);
                if (stockInfo != null) {
                    logger.info("Stock info retrieved - ticker: {}, name: {}, price: {}", 
                        stockInfo.getTicker(), stockInfo.getName(), stockInfo.getClosePrice());
                    return ResponseEntity.ok(stockInfo);
                } else {
                    logger.warn("No stock info found for ticker: {}", ticker);
                    return ResponseEntity.notFound().build();
                }
            }
        } catch (Exception e) {
            logger.error("Failed to fetch stock info for ticker: {}", ticker, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get ETF daily trading information (ETF 일별매매정보)
     * Uses KRX Open API to fetch real ETF data
     */
    @GetMapping("/etf/daily-trading")
    public ResponseEntity<List<KrxRankingStock>> getETFDailyTradingInfo() {
        try {
            logger.info("Fetching ETF daily trading information from KRX API");
            List<KrxRankingStock> etfData = krxApiService.getETFDailyTradingInfo();
            return ResponseEntity.ok(etfData);
        } catch (Exception e) {
            logger.error("Failed to fetch ETF daily trading information", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Clear KRX API service caches (Public endpoint for testing)
     */
    @PostMapping("/cache/clear-test")
    public ResponseEntity<Map<String, Object>> clearCacheTest() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            krxApiService.clearCache();
            response.put("success", true);
            response.put("message", "KRX API service caches cleared successfully (test endpoint)");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to clear caches", e);
            response.put("success", false);
            response.put("message", "Failed to clear caches: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Clear KRX API service caches
     */
    @PostMapping("/cache/clear")
    public ResponseEntity<Map<String, Object>> clearCache() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            krxApiService.clearCache();
            response.put("success", true);
            response.put("message", "KRX API service caches cleared successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to clear caches", e);
            response.put("success", false);
            response.put("message", "Failed to clear caches: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    // ========== Public Endpoints for Frontend ==========
    
    /**
     * Get combined volume ranking from both KOSPI and KOSDAQ
     */
    @GetMapping("/ranking/volume-ranking")
    public ResponseEntity<Map<String, Object>> getCombinedVolumeRanking(
            @RequestParam(required = false) String market) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Fetching volume ranking data, market filter: {}", market);
            
            List<KrxRankingStock> allStocks = new ArrayList<>();
            
            // Check market filter
            if ("kospi".equalsIgnoreCase(market)) {
                // KOSPI only
                allStocks = krxApiService.getKospiVolumeRanking(50);
            } else if ("kosdaq".equalsIgnoreCase(market)) {
                // KOSDAQ only
                allStocks = krxApiService.getKosdaqVolumeRanking(50);
            } else {
                // Combined (default)
                List<KrxRankingStock> kospiVolume = new ArrayList<>();
                List<KrxRankingStock> kosdaqVolume = new ArrayList<>();
                
                try {
                    kospiVolume = krxApiService.getKospiVolumeRanking(25);
                } catch (Exception e) {
                    logger.error("Failed to fetch KOSPI volume ranking: {}", e.getMessage());
                }
                
                try {
                    kosdaqVolume = krxApiService.getKosdaqVolumeRanking(25);
                } catch (Exception e) {
                    logger.error("Failed to fetch KOSDAQ volume ranking: {}", e.getMessage());
                }
                
                // Combine both lists
                allStocks = new java.util.ArrayList<>(kospiVolume);
                allStocks.addAll(kosdaqVolume);
            }
            
            // Sort by volume and limit to top 50
            allStocks.sort((a, b) -> {
                try {
                    long volA = parseVolume(a.getVolume());
                    long volB = parseVolume(b.getVolume());
                    return Long.compare(volB, volA);
                } catch (Exception e) {
                    return 0;
                }
            });
            
            if (allStocks.size() > 50) {
                allStocks = allStocks.subList(0, 50);
            }
            
            // Update rankings
            for (int i = 0; i < allStocks.size(); i++) {
                allStocks.get(i).setRank(i + 1);
            }
            
            response.put("success", true);
            response.put("data", allStocks);
            response.put("message", "거래량 순위 조회 성공");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to fetch volume ranking", e);
            response.put("success", false);
            response.put("message", "거래량 순위 조회 실패: " + e.getMessage());
            response.put("data", new ArrayList<>());
            return ResponseEntity.ok(response); // Return 200 with error message instead of 500
        }
    }
    
    /**
     * Get combined price increase ranking from both KOSPI and KOSDAQ
     */
    @GetMapping("/ranking/price-increase-ranking")
    public ResponseEntity<Map<String, Object>> getCombinedPriceIncreaseRanking(
            @RequestParam(required = false) String market) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Fetching price increase ranking data, market filter: {}", market);
            
            List<KrxRankingStock> allStocks = new ArrayList<>();
            
            // Check market filter
            if ("kospi".equalsIgnoreCase(market)) {
                // KOSPI only
                allStocks = krxApiService.getKospiPriceIncreaseRanking(50);
            } else if ("kosdaq".equalsIgnoreCase(market)) {
                // KOSDAQ only
                allStocks = krxApiService.getKosdaqPriceIncreaseRanking(50);
            } else {
                // Combined (default)
                List<KrxRankingStock> kospiIncrease = new ArrayList<>();
                List<KrxRankingStock> kosdaqIncrease = new ArrayList<>();
                
                try {
                    kospiIncrease = krxApiService.getKospiPriceIncreaseRanking(25);
                } catch (Exception e) {
                    logger.error("Failed to fetch KOSPI price increase ranking: {}", e.getMessage());
                }
                
                try {
                    kosdaqIncrease = krxApiService.getKosdaqPriceIncreaseRanking(25);
                } catch (Exception e) {
                    logger.error("Failed to fetch KOSDAQ price increase ranking: {}", e.getMessage());
                }
                
                // Combine both lists
                allStocks = new java.util.ArrayList<>(kospiIncrease);
                allStocks.addAll(kosdaqIncrease);
            }
            
            // Sort by change rate and limit to top 50
            allStocks.sort((a, b) -> {
                try {
                    double rateA = a.getChangeRate();
                    double rateB = b.getChangeRate();
                    return Double.compare(rateB, rateA);
                } catch (Exception e) {
                    return 0;
                }
            });
            
            if (allStocks.size() > 50) {
                allStocks = allStocks.subList(0, 50);
            }
            
            // Update rankings43n
            for (int i = 0; i < allStocks.size(); i++) {
                allStocks.get(i).setRank(i + 1);
            }
            
            response.put("success", true);
            response.put("data", allStocks);
            response.put("message", "상승률 순위 조회 성공");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to fetch price increase ranking", e);
            response.put("success", false);
            response.put("message", "상승률 순위 조회 실패: " + e.getMessage());
            response.put("data", new ArrayList<>());
            return ResponseEntity.ok(response); // Return 200 with error message instead of 500
        }
    }
    
    /**
     * Get combined price decrease ranking from both KOSPI and KOSDAQ
     */
    @GetMapping("/ranking/price-decrease-ranking")
    public ResponseEntity<Map<String, Object>> getCombinedPriceDecreaseRanking(
            @RequestParam(required = false) String market) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Fetching price decrease ranking data, market filter: {}", market);
            
            List<KrxRankingStock> allStocks = new ArrayList<>();
            
            // Check market filter
            if ("kospi".equalsIgnoreCase(market)) {
                // KOSPI only
                allStocks = krxApiService.getKospiPriceDecreaseRanking(50);
            } else if ("kosdaq".equalsIgnoreCase(market)) {
                // KOSDAQ only
                allStocks = krxApiService.getKosdaqPriceDecreaseRanking(50);
            } else {
                // Combined (default)
                List<KrxRankingStock> kospiDecrease = new ArrayList<>();
                List<KrxRankingStock> kosdaqDecrease = new ArrayList<>();
                
                try {
                    kospiDecrease = krxApiService.getKospiPriceDecreaseRanking(25);
                } catch (Exception e) {
                    logger.error("Failed to fetch KOSPI price decrease ranking: {}", e.getMessage());
                }
                
                try {
                    kosdaqDecrease = krxApiService.getKosdaqPriceDecreaseRanking(25);
                } catch (Exception e) {
                    logger.error("Failed to fetch KOSDAQ price decrease ranking: {}", e.getMessage());
                }
                
                // Combine both lists
                allStocks = new java.util.ArrayList<>(kospiDecrease);
                allStocks.addAll(kosdaqDecrease);
            }
            
            // Sort by change rate (negative) and limit to top 50
            allStocks.sort((a, b) -> {
                try {
                    double rateA = a.getChangeRate();
                    double rateB = b.getChangeRate();
                    return Double.compare(rateA, rateB); // Note: reversed for decrease
                } catch (Exception e) {
                    return 0;
                }
            });
            
            if (allStocks.size() > 50) {
                allStocks = allStocks.subList(0, 50);
            }
            
            // Update rankings
            for (int i = 0; i < allStocks.size(); i++) {
                allStocks.get(i).setRank(i + 1);
            }
            
            response.put("success", true);
            response.put("data", allStocks);
            response.put("message", "하락률 순위 조회 성공");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to fetch price decrease ranking", e);
            response.put("success", false);
            response.put("message", "하락률 순위 조회 실패: " + e.getMessage());
            response.put("data", new ArrayList<>());
            return ResponseEntity.ok(response); // Return 200 with error message instead of 500
        }
    }
    
    /**
     * Get combined trade value ranking from both KOSPI and KOSDAQ
     */
    @GetMapping("/ranking/trade-value-ranking")
    public ResponseEntity<Map<String, Object>> getCombinedTradeValueRanking(
            @RequestParam(required = false) String market) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Fetching trade value ranking data, market filter: {}", market);
            
            List<KrxRankingStock> allStocks = new ArrayList<>();
            
            // Check market filter
            if ("kospi".equalsIgnoreCase(market)) {
                // KOSPI only
                allStocks = krxApiService.getKospiTradeValueRanking(50);
            } else if ("kosdaq".equalsIgnoreCase(market)) {
                // KOSDAQ only
                allStocks = krxApiService.getKosdaqTradeValueRanking(50);
            } else {
                // Combined (default)
                List<KrxRankingStock> kospiValue = new ArrayList<>();
                List<KrxRankingStock> kosdaqValue = new ArrayList<>();
                
                try {
                    kospiValue = krxApiService.getKospiTradeValueRanking(25);
                } catch (Exception e) {
                    logger.error("Failed to fetch KOSPI trade value ranking: {}", e.getMessage());
                }
                
                try {
                    kosdaqValue = krxApiService.getKosdaqTradeValueRanking(25);
                } catch (Exception e) {
                    logger.error("Failed to fetch KOSDAQ trade value ranking: {}", e.getMessage());
                }
                
                // Combine both lists
                allStocks = new java.util.ArrayList<>(kospiValue);
                allStocks.addAll(kosdaqValue);
            }
            
            // Sort by trade value and limit to top 50
            allStocks.sort((a, b) -> {
                try {
                    long valA = parseVolume(a.getTradeValue());
                    long valB = parseVolume(b.getTradeValue());
                    return Long.compare(valB, valA);
                } catch (Exception e) {
                    return 0;
                }
            });
            
            if (allStocks.size() > 50) {
                allStocks = allStocks.subList(0, 50);
            }
            
            // Update rankings
            for (int i = 0; i < allStocks.size(); i++) {
                allStocks.get(i).setRank(i + 1);
            }
            
            response.put("success", true);
            response.put("data", allStocks);
            response.put("message", "거래대금 순위 조회 성공");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to fetch trade value ranking", e);
            response.put("success", false);
            response.put("message", "거래대금 순위 조회 실패: " + e.getMessage());
            response.put("data", new ArrayList<>());
            return ResponseEntity.ok(response); // Return 200 with error message instead of 500
        }
    }
    
    /**
     * Get combined market capitalization ranking from both KOSPI and KOSDAQ
     */
    @GetMapping("/ranking/market-cap-ranking")
    public ResponseEntity<Map<String, Object>> getCombinedMarketCapRanking(
            @RequestParam(required = false) String market) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Fetching market capitalization ranking data, market filter: {}", market);
            
            List<KrxRankingStock> allStocks = new ArrayList<>();
            
            // Check market filter
            if ("kospi".equalsIgnoreCase(market)) {
                // KOSPI only
                allStocks = krxApiService.getKospiMarketCapRanking(50);
            } else if ("kosdaq".equalsIgnoreCase(market)) {
                // KOSDAQ only
                allStocks = krxApiService.getKosdaqMarketCapRanking(50);
            } else {
                // Combined (default)
                List<KrxRankingStock> kospiStocks = new ArrayList<>();
                List<KrxRankingStock> kosdaqStocks = new ArrayList<>();
                
                try {
                    // Fetch market cap ranking directly
                    kospiStocks = krxApiService.getKospiMarketCapRanking(25);
                } catch (Exception e) {
                    logger.error("Failed to fetch KOSPI market cap ranking: {}", e.getMessage());
                }
                
                try {
                    kosdaqStocks = krxApiService.getKosdaqMarketCapRanking(25);
                } catch (Exception e) {
                    logger.error("Failed to fetch KOSDAQ market cap ranking: {}", e.getMessage());
                }
                
                // Combine both lists
                allStocks = new java.util.ArrayList<>(kospiStocks);
                allStocks.addAll(kosdaqStocks);
            }
            
            // Sort by market cap and limit to top 50
            allStocks.sort((a, b) -> {
                try {
                    long capA = parseVolume(a.getMarketCap());
                    long capB = parseVolume(b.getMarketCap());
                    return Long.compare(capB, capA);
                } catch (Exception e) {
                    return 0;
                }
            });
            
            if (allStocks.size() > 50) {
                allStocks = allStocks.subList(0, 50);
            }
            
            // Update rankings
            for (int i = 0; i < allStocks.size(); i++) {
                allStocks.get(i).setRank(i + 1);
            }
            
            response.put("success", true);
            response.put("data", allStocks);
            response.put("message", "시가총액 순위 조회 성공");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to fetch market cap ranking", e);
            response.put("success", false);
            response.put("message", "시가총액 순위 조회 실패: " + e.getMessage());
            response.put("data", new ArrayList<>());
            return ResponseEntity.ok(response); // Return 200 with error message instead of 500
        }
    }
    
    /**
     * Get market indices (placeholder endpoint)
     */
    @GetMapping("/indices")
    public ResponseEntity<Map<String, Object>> getMarketIndices() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Fetching market indices data");
            
            // Return empty list for now
            response.put("success", true);
            response.put("data", new java.util.ArrayList<>());
            response.put("message", "지수 정보 조회 성공");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to fetch market indices", e);
            response.put("success", false);
            response.put("message", "지수 정보 조회 실패: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Convert KIS API format to KRX API format for frontend compatibility
     */
    private List<Map<String, Object>> convertKisToKrxFormat(List<KisStockInfo> kisData) {
        List<Map<String, Object>> convertedData = new ArrayList<>();
        
        for (KisStockInfo kisStock : kisData) {
            Map<String, Object> krxFormat = new HashMap<>();
            
            // Map KIS fields to KRX field names expected by frontend
            krxFormat.put("tradeDate", kisStock.getDate());  // stck_bsop_date -> tradeDate
            krxFormat.put("closePrice", kisStock.getClosePrice()); // stck_clpr -> closePrice  
            krxFormat.put("openPrice", kisStock.getOpenPrice());   // stck_oprc -> openPrice
            krxFormat.put("highPrice", kisStock.getHighPrice());   // stck_hgpr -> highPrice
            krxFormat.put("lowPrice", kisStock.getLowPrice());     // stck_lwpr -> lowPrice
            krxFormat.put("volume", kisStock.getVolume());         // acml_vol -> volume
            krxFormat.put("priceChange", kisStock.getPriceChange()); // prdy_vrss -> priceChange
            krxFormat.put("changeRate", kisStock.getChangeRate());   // prdy_ctrt -> changeRate
            krxFormat.put("ticker", kisStock.getTicker());
            
            convertedData.add(krxFormat);
        }
        
        logger.debug("Converted {} KIS records to KRX format", convertedData.size());
        return convertedData;
    }

    /**
     * Helper method to parse volume string to long for sorting
     * Handles both numeric strings and Korean formatted strings (억, 조, etc.)
     */
    private long parseVolume(String volume) {
        if (volume == null || volume.trim().isEmpty()) {
            return 0L;
        }
        
        try {
            // Remove commas
            String cleanVolume = volume.replace(",", "").trim();
            
            // Handle Korean suffixes
            if (cleanVolume.endsWith("조")) {
                // 1조 = 1,000,000,000,000
                String numPart = cleanVolume.substring(0, cleanVolume.length() - 1).trim();
                return (long)(Double.parseDouble(numPart) * 1_000_000_000_000L);
            } else if (cleanVolume.endsWith("억")) {
                // 1억 = 100,000,000
                String numPart = cleanVolume.substring(0, cleanVolume.length() - 1).trim();
                return (long)(Double.parseDouble(numPart) * 100_000_000L);
            } else if (cleanVolume.endsWith("만")) {
                // 1만 = 10,000
                String numPart = cleanVolume.substring(0, cleanVolume.length() - 1).trim();
                return (long)(Double.parseDouble(numPart) * 10_000L);
            } else {
                // Plain number
                return Long.parseLong(cleanVolume);
            }
        } catch (NumberFormatException e) {
            logger.warn("Failed to parse volume: {}", volume);
            return 0L;
        }
    }
    
    /**
     * Diagnose KRX API connectivity and data issues
     */
    @GetMapping("/debug-search")
    public ResponseEntity<Map<String, Object>> debugSearch() {
        Map<String, Object> debug = new HashMap<>();
        
        debug.put("stockListingService_available", stockListingService != null);
        if (stockListingService != null) {
            debug.put("stock_count", stockListingService.getStockCount());
            debug.put("sample_search_samsung", stockListingService.searchStocks("삼성").size());
        }
        
        debug.put("krxApiService_available", krxApiService != null);
        if (krxApiService != null) {
            try {
                debug.put("krx_connection", krxApiService.testConnection());
            } catch (Exception e) {
                debug.put("krx_connection_error", e.getMessage());
            }
        }
        
        return ResponseEntity.ok(debug);
    }
    
    @GetMapping("/diagnose")
    public ResponseEntity<Map<String, Object>> diagnoseKrxApi() {
        Map<String, Object> diagnosis = new HashMap<>();
        
        try {
            logger.info("Starting KRX API diagnosis...");
            
            // Test basic connectivity
            try {
                diagnosis.put("api_connection", krxApiService.testConnection());
            } catch (Exception e) {
                diagnosis.put("api_connection", false);
                diagnosis.put("connection_error", e.getMessage());
                diagnosis.put("connection_error_type", e.getClass().getSimpleName());
            }
            
            // Try to fetch a small sample
            try {
                List<KrxRankingStock> kospiSample = krxApiService.getKospiVolumeRanking(5);
                diagnosis.put("kospi_data_available", !kospiSample.isEmpty());
                diagnosis.put("kospi_sample_count", kospiSample.size());
                
                if (!kospiSample.isEmpty()) {
                    diagnosis.put("kospi_first_stock", kospiSample.get(0).getName());
                }
            } catch (Exception e) {
                diagnosis.put("kospi_error", e.getMessage());
                diagnosis.put("kospi_error_type", e.getClass().getSimpleName());
                // Log full stack trace for debugging
                logger.error("KOSPI fetch error details:", e);
            }
            
            // Try KOSDAQ
            try {
                List<KrxRankingStock> kosdaqSample = krxApiService.getKosdaqVolumeRanking(5);
                diagnosis.put("kosdaq_data_available", !kosdaqSample.isEmpty());
                diagnosis.put("kosdaq_sample_count", kosdaqSample.size());
            } catch (Exception e) {
                diagnosis.put("kosdaq_error", e.getMessage());
                diagnosis.put("kosdaq_error_type", e.getClass().getSimpleName());
            }
            
            // Check ETF detection
            try {
                List<KrxRankingStock> etfs = krxApiService.getETFDailyTradingInfo();
                diagnosis.put("etf_count", etfs.size());
                diagnosis.put("etf_fetch_success", true);
            } catch (Exception e) {
                diagnosis.put("etf_error", e.getMessage());
                diagnosis.put("etf_fetch_success", false);
            }
            
            diagnosis.put("timestamp", LocalDateTime.now());
            diagnosis.put("trading_date", krxApiService.getLastTradingDate());
            
            return ResponseEntity.ok(diagnosis);
            
        } catch (Exception e) {
            logger.error("Diagnosis failed", e);
            diagnosis.put("error", e.getMessage());
            diagnosis.put("error_type", e.getClass().getSimpleName());
            diagnosis.put("diagnosis_failed", true);
            return ResponseEntity.ok(diagnosis); // Return 200 with error info instead of 500
        }
    }
}