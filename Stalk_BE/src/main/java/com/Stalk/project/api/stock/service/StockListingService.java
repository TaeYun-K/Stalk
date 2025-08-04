package com.Stalk.project.api.stock.service;

import com.Stalk.project.api.stock.dto.KrxRankingStock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class StockListingService {

    private static final Logger logger = LoggerFactory.getLogger(StockListingService.class);
    
    // In-memory cache for fast searching
    private final Map<String, StockListing> stockCache = new ConcurrentHashMap<>();
    
    @Autowired(required = false)
    private KrxApiService krxApiService;
    
    @PostConstruct
    private void init() {
        // Log the initialization status
        logger.info("StockListingService initializing...");
        
        // Load from KRX API
        if (krxApiService != null) {
            logger.info("Attempting to load stocks from KRX API...");
            loadFromKrxApi();
            logger.info("StockListingService initialized with {} stocks in cache", stockCache.size());
        } else {
            logger.warn("KrxApiService is not available, stock cache will be empty");
        }
    }
    
    private void loadFromKrxApi() {
        try {
            logger.info("Loading stock listings from KRX API...");
            
            // Try to load more stocks by fetching larger volume rankings
            // This is a temporary solution until we can fetch all stocks
            int fetchLimit = 1000; // Increase from 200 to 1000
            
            // Fetch KOSPI stocks
            logger.info("Fetching KOSPI stocks with limit: {}", fetchLimit);
            List<KrxRankingStock> kospiStocks = krxApiService.getKospiVolumeRanking(fetchLimit);
            for (KrxRankingStock stock : kospiStocks) {
                StockListing listing = new StockListing(stock.getTicker(), stock.getName(), "KOSPI");
                stockCache.put(stock.getTicker(), listing);
            }
            logger.info("Loaded {} KOSPI stocks", kospiStocks.size());
            
            // Fetch KOSDAQ stocks
            logger.info("Fetching KOSDAQ stocks with limit: {}", fetchLimit);
            List<KrxRankingStock> kosdaqStocks = krxApiService.getKosdaqVolumeRanking(fetchLimit);
            for (KrxRankingStock stock : kosdaqStocks) {
                StockListing listing = new StockListing(stock.getTicker(), stock.getName(), "KOSDAQ");
                stockCache.put(stock.getTicker(), listing);
            }
            logger.info("Loaded {} KOSDAQ stocks", kosdaqStocks.size());
            
            // Also try to fetch from other ranking types to get more stocks
            try {
                // Get stocks from price increase ranking (might include different stocks)
                List<KrxRankingStock> kospiRising = krxApiService.getKospiPriceIncreaseRanking(500);
                for (KrxRankingStock stock : kospiRising) {
                    if (!stockCache.containsKey(stock.getTicker())) {
                        StockListing listing = new StockListing(stock.getTicker(), stock.getName(), "KOSPI");
                        stockCache.put(stock.getTicker(), listing);
                    }
                }
                
                List<KrxRankingStock> kosdaqRising = krxApiService.getKosdaqPriceIncreaseRanking(500);
                for (KrxRankingStock stock : kosdaqRising) {
                    if (!stockCache.containsKey(stock.getTicker())) {
                        StockListing listing = new StockListing(stock.getTicker(), stock.getName(), "KOSDAQ");
                        stockCache.put(stock.getTicker(), listing);
                    }
                }
                
                // Get stocks from price decrease ranking
                List<KrxRankingStock> kospiFalling = krxApiService.getKospiPriceDecreaseRanking(500);
                for (KrxRankingStock stock : kospiFalling) {
                    if (!stockCache.containsKey(stock.getTicker())) {
                        StockListing listing = new StockListing(stock.getTicker(), stock.getName(), "KOSPI");
                        stockCache.put(stock.getTicker(), listing);
                    }
                }
                
                List<KrxRankingStock> kosdaqFalling = krxApiService.getKosdaqPriceDecreaseRanking(500);
                for (KrxRankingStock stock : kosdaqFalling) {
                    if (!stockCache.containsKey(stock.getTicker())) {
                        StockListing listing = new StockListing(stock.getTicker(), stock.getName(), "KOSDAQ");
                        stockCache.put(stock.getTicker(), listing);
                    }
                }
            } catch (Exception e) {
                logger.warn("Failed to load additional stocks from other ranking types: {}", e.getMessage());
            }
            
            logger.info("Loaded total {} stocks from KRX API", stockCache.size());
        } catch (Exception e) {
            logger.error("Failed to load stocks from KRX API", e);
        }
    }
    
    public List<StockListing> searchStocks(String query) {
        if (query == null || query.trim().isEmpty()) {
            return new ArrayList<>(stockCache.values());
        }
        
        String lowerQuery = query.toLowerCase().trim();
        List<StockListing> results = new ArrayList<>();
        
        for (StockListing stock : stockCache.values()) {
            if (stock.getTicker().equals(query) || 
                stock.getTicker().contains(query) ||
                stock.getCompanyName().toLowerCase().contains(lowerQuery)) {
                results.add(stock);
            }
        }
        
        return results;
    }
    
    public Optional<StockListing> getByTicker(String ticker) {
        return Optional.ofNullable(stockCache.get(ticker));
    }
    
    public void refreshStockList() {
        logger.info("Refreshing stock list...");
        stockCache.clear();
        if (krxApiService != null) {
            loadFromKrxApi();
        } else {
            logger.warn("Cannot refresh stock list - KrxApiService is not available");
        }
    }
    
    public int getStockCount() {
        return stockCache.size();
    }
    
    public static class StockListing {
        private final String ticker;
        private final String companyName;
        private final String market;
        
        public StockListing(String ticker, String companyName, String market) {
            this.ticker = ticker;
            this.companyName = companyName;
            this.market = market;
        }
        
        public String getTicker() { return ticker; }
        public String getCompanyName() { return companyName; }
        public String getMarket() { return market; }
    }
}