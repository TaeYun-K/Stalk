package com.Stalk.project.stock.controller;

import com.Stalk.project.stock.dto.KrxRankingStock;
import com.Stalk.project.stock.dto.KrxStockInfo;
import com.Stalk.project.stock.service.KrxApiService;
import com.Stalk.project.stock.service.StockListingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
     */
    @GetMapping("/stock/{ticker}")
    public ResponseEntity<KrxStockInfo> getStockInfo(
            @PathVariable String ticker,
            @RequestParam(defaultValue = "STK") String market) {
        try {
            logger.info("API request for stock info - ticker: {}, market: {}", ticker, market);
            KrxStockInfo stockInfo = krxApiService.getIndividualStockInfo(ticker, market);
            if (stockInfo != null) {
                logger.info("Stock info retrieved - ticker: {}, name: {}, price: {}", 
                    stockInfo.getTicker(), stockInfo.getName(), stockInfo.getClosePrice());
                return ResponseEntity.ok(stockInfo);
            } else {
                logger.warn("No stock info found for ticker: {}", ticker);
                return ResponseEntity.notFound().build();
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
    
    /**
     * Diagnose KRX API connectivity and data issues
     */
    @GetMapping("/diagnose")
    public ResponseEntity<Map<String, Object>> diagnoseKrxApi() {
        Map<String, Object> diagnosis = new HashMap<>();
        
        try {
            logger.info("Starting KRX API diagnosis...");
            
            // Test basic connectivity
            diagnosis.put("api_connection", krxApiService.testConnection());
            
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
            }
            
            // Try KOSDAQ
            try {
                List<KrxRankingStock> kosdaqSample = krxApiService.getKosdaqVolumeRanking(5);
                diagnosis.put("kosdaq_data_available", !kosdaqSample.isEmpty());
                diagnosis.put("kosdaq_sample_count", kosdaqSample.size());
            } catch (Exception e) {
                diagnosis.put("kosdaq_error", e.getMessage());
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
            diagnosis.put("diagnosis_failed", true);
            return ResponseEntity.internalServerError().body(diagnosis);
        }
    }
}