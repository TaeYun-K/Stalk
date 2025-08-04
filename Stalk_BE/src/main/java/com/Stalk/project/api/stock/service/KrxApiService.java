package com.Stalk.project.api.stock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.Stalk.project.global.config.KrxApiConfig;
import com.Stalk.project.api.stock.dto.KrxRankingStock;
import com.Stalk.project.api.stock.dto.KrxStockInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;

/**
 * Service for integrating with KRX Open API to fetch Korean stock market data
 * Supports KOSPI and KOSDAQ market data with various ranking criteria
 */
@Service
public class KrxApiService {

    private static final Logger logger = LoggerFactory.getLogger(KrxApiService.class);
    
    private final KrxApiConfig krxApiConfig;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final NumberFormat numberFormat;
    private final DecimalFormat decimalFormat;
    
    // KRX API endpoint identifiers for different data types  
    private static final String MARKET_DATA_BLD = "dbms/MDC/STAT/standard/MDCSTAT01501";
    private static final String INDIVIDUAL_STOCK_BLD = "dbms/MDC/STAT/standard/MDCSTAT01901"; // Individual stock info
    private static final String VOLUME_RANKING_BLD = "dbms/MDC/STAT/standard/MDCSTAT02301";
    private static final String TRADE_VALUE_RANKING_BLD = "dbms/MDC/STAT/standard/MDCSTAT02401"; 
    private static final String PRICE_CHANGE_RANKING_BLD = "dbms/MDC/STAT/standard/MDCSTAT02501";
    private static final String INVESTOR_TRADING_BLD = "dbms/MDC/STAT/standard/MDCSTAT02203";
    
    @Autowired
    private org.springframework.cache.CacheManager cacheManager;
    
    @Autowired
    public KrxApiService(KrxApiConfig krxApiConfig) {
        this.krxApiConfig = krxApiConfig;
        this.objectMapper = new ObjectMapper();
        this.numberFormat = NumberFormat.getInstance(Locale.KOREA);
        this.decimalFormat = new DecimalFormat("#,##0.00");
        
        // Configure WebClient with proper settings for KRX API
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024)) // 16MB
                .build();
                
        this.webClient = WebClient.builder()
                .baseUrl(krxApiConfig.getBaseUrl())
                .exchangeStrategies(strategies)
                .defaultHeader(HttpHeaders.USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .defaultHeader(HttpHeaders.ACCEPT, "application/json, text/plain, */*")
                .defaultHeader(HttpHeaders.ACCEPT_LANGUAGE, "ko-KR,ko;q=0.9,en;q=0.8")
                .defaultHeader(HttpHeaders.ACCEPT_CHARSET, "UTF-8")
                .defaultHeader("Referer", "http://data.krx.co.kr/")
                .build();
    }
    
    /**
     * Fetch KOSPI volume ranking (거래량 순위)
     * @param limit Number of stocks to return (default: 50)
     * @return List of KrxRankingStock sorted by volume
     */
    @Cacheable(value = "kospiVolumeRanking", key = "#limit")
    public List<KrxRankingStock> getKospiVolumeRanking(int limit) {
        logger.info("Fetching KOSPI volume ranking, limit: {} (with caching)", limit);
        return fetchRankingData("STK", MARKET_DATA_BLD, "ACC_TRDVOL", limit);
    }
    
    /**
     * Fetch KOSPI trade value ranking (거래대금 순위)
     * @param limit Number of stocks to return (default: 50)
     * @return List of KrxRankingStock sorted by trade value
     */
    @Cacheable(value = "kospiTradeValueRanking", key = "#limit")
    public List<KrxRankingStock> getKospiTradeValueRanking(int limit) {
        logger.info("Fetching KOSPI trade value ranking, limit: {} (with caching)", limit);
        return fetchRankingData("STK", MARKET_DATA_BLD, "ACC_TRDVAL", limit);
    }
    
    /**
     * Fetch KOSPI price increase ranking (상승률 순위)
     * @param limit Number of stocks to return (default: 50)
     * @return List of KrxRankingStock sorted by price increase rate
     */
    @Cacheable(value = "kospiPriceIncreaseRanking", key = "#limit")
    public List<KrxRankingStock> getKospiPriceIncreaseRanking(int limit) {
        logger.info("Fetching KOSPI price increase ranking, limit: {} (with caching)", limit);
        return fetchRankingData("STK", MARKET_DATA_BLD, "FLUC_RT", limit);
    }
    
    /**
     * Fetch KOSPI price decrease ranking (하락률 순위)
     * @param limit Number of stocks to return (default: 50)
     * @return List of KrxRankingStock sorted by price decrease rate
     */
    public List<KrxRankingStock> getKospiPriceDecreaseRanking(int limit) {
        logger.info("Fetching KOSPI price decrease ranking, limit: {}", limit);
        return fetchRankingData("STK", MARKET_DATA_BLD, "FLUC_RT_DESC", limit);
    }
    
    /**
     * Fetch KOSDAQ volume ranking (거래량 순위)
     * @param limit Number of stocks to return (default: 50)
     * @return List of KrxRankingStock sorted by volume
     */
    public List<KrxRankingStock> getKosdaqVolumeRanking(int limit) {
        logger.info("Fetching KOSDAQ volume ranking, limit: {}", limit);
        return fetchRankingData("KSQ", MARKET_DATA_BLD, "ACC_TRDVOL", limit);
    }
    
    /**
     * Fetch KOSDAQ trade value ranking (거래대금 순위)
     * @param limit Number of stocks to return (default: 50)
     * @return List of KrxRankingStock sorted by trade value
     */
    public List<KrxRankingStock> getKosdaqTradeValueRanking(int limit) {
        logger.info("Fetching KOSDAQ trade value ranking, limit: {}", limit);
        return fetchRankingData("KSQ", MARKET_DATA_BLD, "ACC_TRDVAL", limit);
    }
    
    /**
     * Fetch KOSDAQ price increase ranking (상승률 순위)
     * @param limit Number of stocks to return (default: 50)
     * @return List of KrxRankingStock sorted by price increase rate
     */
    public List<KrxRankingStock> getKosdaqPriceIncreaseRanking(int limit) {
        logger.info("Fetching KOSDAQ price increase ranking, limit: {}", limit);
        return fetchRankingData("KSQ", MARKET_DATA_BLD, "FLUC_RT", limit);
    }
    
    /**
     * Fetch KOSDAQ price decrease ranking (하락률 순위)
     * @param limit Number of stocks to return (default: 50)
     * @return List of KrxRankingStock sorted by price decrease rate
     */
    public List<KrxRankingStock> getKosdaqPriceDecreaseRanking(int limit) {
        logger.info("Fetching KOSDAQ price decrease ranking, limit: {}", limit);
        return fetchRankingData("KSQ", MARKET_DATA_BLD, "FLUC_RT_DESC", limit);
    }
    
    /**
     * Fetch individual stock information with 5-minute caching
     * @param ticker Stock ticker symbol (e.g., "005930" for Samsung Electronics)
     * @param market Market type ("STK" for KOSPI, "KSQ" for KOSDAQ)
     * @return KrxStockInfo containing detailed stock information
     */
    @Cacheable(value = "individualStockInfo", key = "#ticker + '_' + #market")
    public KrxStockInfo getIndividualStockInfo(String ticker, String market) {
        logger.info("Fetching individual stock info for ticker: {}, market: {}", ticker, market);
        
        try {
            // Use the individual stock endpoint
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("bld", INDIVIDUAL_STOCK_BLD);
            params.add("locale", "ko_KR");
            params.add("isuCd", ticker);  // Use ticker directly as stock code
            params.add("trdDd", getLastTradingDate());
            params.add("share", "1");
            params.add("money", "1");
            params.add("csvxls_isNo", "false");
            
            logger.info("KRX individual stock request params: {}", params);
            String response = executeApiCall(params);
            JsonNode root = objectMapper.readTree(response);
            
            // Check multiple possible response structures
            JsonNode stockData = null;
            if (root.has("OutBlock_1") && root.path("OutBlock_1").isArray() && root.path("OutBlock_1").size() > 0) {
                stockData = root.path("OutBlock_1").get(0);
            } else if (root.has("output") && root.path("output").isArray() && root.path("output").size() > 0) {
                stockData = root.path("output").get(0);
            } else if (root.has("block1") && root.path("block1").isArray() && root.path("block1").size() > 0) {
                stockData = root.path("block1").get(0);
            }
            
            if (stockData != null) {
                logger.info("Found stock data for ticker: {}", ticker);
                return mapToKrxStockInfo(stockData);
            } else {
                logger.warn("No stock data found for ticker: {} using individual endpoint, trying market data fallback", ticker);
                // Fallback to market data endpoint
                return getIndividualStockInfoFromMarketData(ticker, market);
            }
            
        } catch (Exception e) {
            logger.error("Failed to fetch individual stock info for ticker: {}, market: {}", ticker, market, e);
            throw new RuntimeException("Failed to fetch stock information: " + e.getMessage(), e);
        }
    }
    
    /**
     * Fallback method to get individual stock info from market data
     */
    private KrxStockInfo getIndividualStockInfoFromMarketData(String ticker, String market) {
        try {
            MultiValueMap<String, String> params = createBaseParams(market, MARKET_DATA_BLD);
            
            String response = executeApiCall(params);
            JsonNode root = objectMapper.readTree(response);
            JsonNode blocks = root.path("OutBlock_1");
            
            if (blocks.isArray() && blocks.size() > 0) {
                logger.info("Found {} stock entries in market data for ticker: {}", blocks.size(), ticker);
                
                // Look for the specific ticker in the response
                for (JsonNode stockEntry : blocks) {
                    String responseTicker = stockEntry.path("ISU_SRT_CD").asText("");
                    if (ticker.equals(responseTicker)) {
                        logger.info("Found matching ticker {} in market data", ticker);
                        return mapToKrxStockInfo(stockEntry);
                    }
                }
                
                logger.error("Ticker {} not found in market data response", ticker);
                return null;
            } else {
                logger.warn("No stock data found in market data for ticker: {} in market: {}", ticker, market);
                return null;
            }
        } catch (Exception e) {
            logger.error("Failed to fetch stock from market data for ticker: {}", ticker, e);
            return null;
        }
    }
    
    /**
     * Generic method to fetch ranking data from KRX API
     */
    private List<KrxRankingStock> fetchRankingData(String market, String bld, String sortField, int limit) {
        List<KrxRankingStock> rankings = new ArrayList<>();
        
        try {
            MultiValueMap<String, String> params = createBaseParams(market, bld);
            
            String response = executeApiCall(params);
            JsonNode root = objectMapper.readTree(response);
            
            // Log the structure to understand the response
            logger.info("Response structure - has OutBlock_1: {}, has block1: {}, has output: {}", 
                root.has("OutBlock_1"), root.has("block1"), root.has("output"));
            
            // Try different possible response structures
            JsonNode blocks = null;
            if (root.has("OutBlock_1")) {
                blocks = root.path("OutBlock_1");
            } else if (root.has("block1")) {
                blocks = root.path("block1");
            } else if (root.has("output")) {
                blocks = root.path("output");
            } else if (root.isArray()) {
                blocks = root;
            }
            
            if (blocks != null && blocks.isArray() && blocks.size() > 0) {
                logger.info("Found {} stocks in response for market: {}", blocks.size(), market);
                
                // Convert to list for sorting using wrapper class
                List<StockDataWrapper> allStocks = new ArrayList<>();
                
                for (JsonNode stock : blocks) {
                    StockDataWrapper wrapper = createStockDataWrapper(stock);
                    if (wrapper != null) {
                        allStocks.add(wrapper);
                    }
                }
                
                logger.info("Created {} valid stock wrappers from {} total", allStocks.size(), blocks.size());
                
                // Sort based on sortField
                sortWrappedStocksByField(allStocks, sortField);
                
                // Take only the requested limit and convert to KrxRankingStock
                int actualLimit = Math.min(limit, allStocks.size());
                for (int i = 0; i < actualLimit; i++) {
                    StockDataWrapper wrapper = allStocks.get(i);
                    KrxRankingStock stock = wrapper.toKrxRankingStock(i + 1);
                    rankings.add(stock);
                }
                
                logger.info("Successfully fetched {} ranking stocks for market: {}, sorted by: {}", 
                    rankings.size(), market, sortField);
            } else {
                logger.warn("No ranking data found for market: {}, bld: {}. Response keys: {}", 
                    market, bld, root.fieldNames());
            }
            
        } catch (Exception e) {
            logger.error("Failed to fetch ranking data for market: {}, bld: {}", market, bld, e);
            throw new RuntimeException("Failed to fetch ranking data: " + e.getMessage(), e);
        }
        
        return rankings;
    }
    
    
    /**
     * Create base parameters for KRX API requests
     */
    private MultiValueMap<String, String> createBaseParams(String market, String bld) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("bld", bld);
        params.add("locale", "ko_KR");
        params.add("mktId", market);
        params.add("trdDd", getLastTradingDate());
        params.add("share", "1");
        params.add("money", "1");
        params.add("csvxls_isNo", "false");
        return params;
    }
    
    /**
     * Get the most recent trading date (excludes weekends)
     */
    public String getLastTradingDate() {
        LocalDate date = LocalDate.now();
        
        // Go back to the most recent weekday (Monday-Friday)
        while (date.getDayOfWeek().getValue() > 5) { // Saturday=6, Sunday=7
            date = date.minusDays(1);
        }
        
        // For early morning hours before market open (9 AM), use previous trading day
        LocalDateTime now = LocalDateTime.now();
        if (now.getHour() < 9) {
            date = date.minusDays(1);
            // Ensure it's still a weekday
            while (date.getDayOfWeek().getValue() > 5) {
                date = date.minusDays(1);
            }
        }
        
        String tradingDate = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        logger.info("Using trading date: {}", tradingDate);
        return tradingDate;
    }
    
    /**
     * Execute API call to KRX with proper error handling
     */
    private String executeApiCall(MultiValueMap<String, String> params) {
        try {
            logger.info("Making KRX API call with params: {}", params);
            
            String response = webClient.post()
                    .uri("")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .acceptCharset(StandardCharsets.UTF_8)
                    .header("Origin", "http://data.krx.co.kr")
                    .body(Mono.just(params), MultiValueMap.class)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            if (response == null || response.trim().isEmpty()) {
                logger.error("Empty response from KRX API");
                throw new RuntimeException("Empty response from KRX API");
            }
            
            logger.info("Received response from KRX API, length: {}", response.length());
            // Log first 500 characters of response for debugging
            logger.debug("Response preview: {}", response.substring(0, Math.min(response.length(), 500)));
            return response;
            
        } catch (WebClientResponseException e) {
            logger.error("WebClient error calling KRX API: Status={}, Body={}", 
                e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("KRX API call failed with status: " + e.getStatusCode(), e);
        } catch (Exception e) {
            logger.error("Unexpected error calling KRX API", e);
            throw new RuntimeException("KRX API call failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Map KRX API response to KrxStockInfo DTO
     */
    private KrxStockInfo mapToKrxStockInfo(JsonNode stockData) {
        KrxStockInfo stockInfo = new KrxStockInfo();
        
        stockInfo.setTicker(stockData.path("ISU_SRT_CD").asText(""));
        stockInfo.setName(stockData.path("ISU_ABBRV").asText(""));
        stockInfo.setClosePrice(stockData.path("TDD_CLSPRC").asText("0"));
        stockInfo.setPriceChange(stockData.path("CMPPREVDD_PRC").asText("0"));
        stockInfo.setChangeRate(stockData.path("FLUC_RT").asText("0"));
        stockInfo.setVolume(stockData.path("ACC_TRDVOL").asText("0"));
        stockInfo.setTradeValue(stockData.path("ACC_TRDVAL").asText("0"));
        stockInfo.setMarketCap(stockData.path("MKTCAP").asText("0"));
        stockInfo.setListedShares(stockData.path("LIST_SHRS").asText("0"));
        
        return stockInfo;
    }
    
    /**
     * Parse string to double with error handling
     */
    private double parseDouble(String value) {
        if (value == null || value.trim().isEmpty() || "-".equals(value.trim())) {
            return 0.0;
        }
        
        try {
            // Remove commas and parse
            String cleanValue = value.replace(",", "").trim();
            return Double.parseDouble(cleanValue);
        } catch (NumberFormatException e) {
            logger.debug("Failed to parse double value: {}", value);
            return 0.0;
        }
    }
    
    /**
     * Format large numbers for display using Korean units (억/만)
     */
    private String formatLargeNumber(String value) {
        if (value == null || value.trim().isEmpty() || "-".equals(value.trim())) {
            return "0";
        }
        
        try {
            long number = Long.parseLong(value.replace(",", "").trim());
            
            if (number >= 100_000_000L) { // 억 (100 million)
                double eok = number / 100_000_000.0;
                if (eok >= 10000) { // 조 (1 trillion = 10,000 억)
                    return decimalFormat.format(eok / 10000.0) + "조";
                }
                return decimalFormat.format(eok) + "억";
            } else if (number >= 10_000L) { // 만 (10 thousand)
                return decimalFormat.format(number / 10_000.0) + "만";
            } else {
                return numberFormat.format(number);
            }
        } catch (NumberFormatException e) {
            logger.debug("Failed to format large number: {}", value);
            return value;
        }
    }
    
    /**
     * Test KRX API connectivity
     * @return true if connection is successful, false otherwise
     */
    public boolean testConnection() {
        try {
            logger.info("Testing KRX API connectivity...");
            
            MultiValueMap<String, String> testParams = createBaseParams("STK", MARKET_DATA_BLD);
            logger.info("Test params: {}", testParams);
            
            String response = executeApiCall(testParams);
            logger.info("Test response received, length: {}", response.length());
            
            JsonNode root = objectMapper.readTree(response);
            
            // Log all top-level fields for debugging
            Iterator<String> fieldNames = root.fieldNames();
            List<String> fields = new ArrayList<>();
            while (fieldNames.hasNext()) {
                fields.add(fieldNames.next());
            }
            logger.info("Response fields: {}", fields);
            
            boolean hasData = root.path("OutBlock_1").isArray() && root.path("OutBlock_1").size() > 0;
            
            if (hasData) {
                logger.info("KRX API connection test successful");
                return true;
            } else {
                logger.warn("KRX API connection test returned empty data");
                return false;
            }
            
        } catch (Exception e) {
            logger.error("KRX API connection test failed", e);
            return false;
        }
    }
    
    /**
     * Fetch ETF daily trading information (ETF 일별매매정보)
     * Fetches from both KOSPI and KOSDAQ markets and filters ETFs
     * @return List of ETF trading data
     */
    public List<KrxRankingStock> getETFDailyTradingInfo() {
        logger.info("Fetching ETF daily trading information from KRX API");
        
        try {
            List<KrxRankingStock> etfList = new ArrayList<>();
            
            // Log the attempt to fetch data
            logger.info("Attempting to fetch KOSPI stocks for ETF filtering...");
            List<KrxRankingStock> kospiStocks = fetchRankingData("STK", MARKET_DATA_BLD, "ACC_TRDVOL", 100);
            logger.info("Fetched {} KOSPI stocks", kospiStocks.size());
            
            logger.info("Attempting to fetch KOSDAQ stocks for ETF filtering...");
            List<KrxRankingStock> kosdaqStocks = fetchRankingData("KSQ", MARKET_DATA_BLD, "ACC_TRDVOL", 100);
            logger.info("Fetched {} KOSDAQ stocks", kosdaqStocks.size());
            
            // Filter ETFs from KOSPI
            for (KrxRankingStock stock : kospiStocks) {
                if (isETF(stock)) {
                    logger.debug("Found ETF in KOSPI: {} ({})", stock.getName(), stock.getTicker());
                    etfList.add(stock);
                }
            }
            
            // Filter ETFs from KOSDAQ
            for (KrxRankingStock stock : kosdaqStocks) {
                if (isETF(stock)) {
                    logger.debug("Found ETF in KOSDAQ: {} ({})", stock.getName(), stock.getTicker());
                    etfList.add(stock);
                }
            }
            
            // Sort by volume
            etfList.sort((a, b) -> {
                double volA = parseVolumeString(a.getVolume());
                double volB = parseVolumeString(b.getVolume());
                return Double.compare(volB, volA);
            });
            
            // Re-rank ETFs
            for (int i = 0; i < etfList.size(); i++) {
                etfList.get(i).setRank(i + 1);
            }
            
            logger.info("Found {} ETFs from KRX API (KOSPI: {}, KOSDAQ: {})", 
                etfList.size(), 
                kospiStocks.stream().filter(this::isETF).count(),
                kosdaqStocks.stream().filter(this::isETF).count());
            return etfList;
            
        } catch (Exception e) {
            logger.error("Failed to fetch ETF daily trading information: {}", e.getMessage(), e);
            // Return empty list instead of throwing exception to prevent frontend errors
            return new ArrayList<>();
        }
    }
    
    /**
     * Check if a stock is an ETF based on name patterns
     */
    private boolean isETF(KrxRankingStock stock) {
        if (stock == null || stock.getName() == null) return false;
        
        String name = stock.getName().toUpperCase();
        
        // Log for debugging
        if (name.contains("KODEX") || name.contains("TIGER") || name.contains("ETF")) {
            logger.debug("Checking potential ETF: {}", stock.getName());
        }
        
        // ETFs in Korea typically have these patterns in the name
        // Most Korean ETFs have specific prefixes or contain "ETF"
        boolean isEtf = name.contains("ETF") || 
               name.endsWith("ETN") ||
               name.startsWith("KODEX") ||
               name.startsWith("TIGER") ||
               name.startsWith("KINDEX") ||
               name.startsWith("ARIRANG") ||
               name.startsWith("HANARO") ||
               name.startsWith("KOSEF") ||
               name.startsWith("ACE ") ||
               name.startsWith("SOL ") ||
               name.startsWith("KBSTAR") ||
               name.startsWith("SMART") ||
               name.startsWith("FOCUS") ||
               name.startsWith("MASTER") ||
               name.contains("인버스") ||  // Inverse ETFs
               name.contains("레버리지");   // Leveraged ETFs
               
        if (isEtf) {
            logger.info("Identified ETF: {}", stock.getName());
        }
        
        return isEtf;
    }
    
    /**
     * Parse volume string to numeric value for sorting
     */
    private double parseVolumeString(String volumeStr) {
        if (volumeStr == null || volumeStr.isEmpty()) return 0;
        
        // Remove commas and any non-numeric suffixes
        String cleaned = volumeStr.replaceAll(",", "");
        
        // Handle Korean suffixes
        if (cleaned.endsWith("조")) {
            return Double.parseDouble(cleaned.substring(0, cleaned.length() - 1)) * 1_000_000_000_000L;
        } else if (cleaned.endsWith("억")) {
            return Double.parseDouble(cleaned.substring(0, cleaned.length() - 1)) * 100_000_000L;
        } else if (cleaned.endsWith("만")) {
            return Double.parseDouble(cleaned.substring(0, cleaned.length() - 1)) * 10_000L;
        }
        // Also handle English suffixes for backward compatibility
        else if (cleaned.endsWith("T") || cleaned.endsWith("t")) {
            return Double.parseDouble(cleaned.substring(0, cleaned.length() - 1)) * 1_000_000_000_000L;
        } else if (cleaned.endsWith("B") || cleaned.endsWith("b")) {
            return Double.parseDouble(cleaned.substring(0, cleaned.length() - 1)) * 1_000_000_000L;
        } else if (cleaned.endsWith("M") || cleaned.endsWith("m")) {
            return Double.parseDouble(cleaned.substring(0, cleaned.length() - 1)) * 1_000_000L;
        } else if (cleaned.endsWith("K") || cleaned.endsWith("k")) {
            return Double.parseDouble(cleaned.substring(0, cleaned.length() - 1)) * 1_000L;
        }
        
        try {
            return Double.parseDouble(cleaned);
        } catch (NumberFormatException e) {
            logger.warn("Could not parse volume string: {}", volumeStr);
            return 0;
        }
    }
    

    /**
     * Clear all caches
     */
    public void clearCache() {
        logger.info("Clearing KRX API service caches");
        try {
            if (cacheManager != null) {
                cacheManager.getCacheNames().forEach(cacheName -> {
                    org.springframework.cache.Cache cache = cacheManager.getCache(cacheName);
                    if (cache != null) {
                        cache.clear();
                        logger.info("Cleared cache: {}", cacheName);
                    }
                });
                logger.info("All KRX API caches cleared successfully");
            } else {
                logger.warn("CacheManager not available, cannot clear caches");
            }
        } catch (Exception e) {
            logger.error("Error clearing caches", e);
        }
    }
    
    /**
     * Create a wrapper for stock data that preserves raw numeric values for sorting
     */
    private StockDataWrapper createStockDataWrapper(JsonNode stockData) {
        try {
            String ticker = stockData.path("ISU_SRT_CD").asText("");
            String name = stockData.path("ISU_ABBRV").asText("");
            
            if (ticker.isEmpty() || name.isEmpty()) {
                logger.debug("Skipping stock with empty ticker or name");
                return null;
            }
            
            double price = parseDouble(stockData.path("TDD_CLSPRC").asText("0"));
            double change = parseDouble(stockData.path("CMPPREVDD_PRC").asText("0"));
            double changeRate = parseDouble(stockData.path("FLUC_RT").asText("0"));
            
            // Keep raw numeric values for sorting
            double volumeRaw = parseDouble(stockData.path("ACC_TRDVOL").asText("0"));
            double tradeValueRaw = parseDouble(stockData.path("ACC_TRDVAL").asText("0"));
            
            // If trade value is 0, calculate it from volume * price for proper sorting
            if (tradeValueRaw == 0.0 && volumeRaw > 0 && price > 0) {
                tradeValueRaw = volumeRaw * price;
                logger.debug("Calculated trade value for sorting: {} = {} * {}", name, tradeValueRaw, volumeRaw, price);
            }
            
            double marketCapRaw = parseDouble(stockData.path("MKTCAP").asText("0"));
            
            return new StockDataWrapper(ticker, name, price, change, changeRate, 
                                      volumeRaw, tradeValueRaw, marketCapRaw);
                                      
        } catch (Exception e) {
            logger.error("Error creating stock data wrapper", e);
            return null;
        }
    }
    
    /**
     * Sort wrapped stocks by the specified field
     */
    private void sortWrappedStocksByField(List<StockDataWrapper> stocks, String sortField) {
        switch (sortField) {
            case "ACC_TRDVOL":
                stocks.sort((a, b) -> Double.compare(b.volumeRaw, a.volumeRaw));
                break;
            case "ACC_TRDVAL":
                stocks.sort((a, b) -> Double.compare(b.tradeValueRaw, a.tradeValueRaw));
                break;
            case "FLUC_RT":
                // Sort by change rate descending (highest positive changes first)
                stocks.sort((a, b) -> Double.compare(b.changeRate, a.changeRate));
                break;
            case "FLUC_RT_DESC":
                // Sort by change rate ascending (lowest negative changes first)
                stocks.sort((a, b) -> Double.compare(a.changeRate, b.changeRate));
                break;
            default:
                logger.warn("Unknown sort field: {}", sortField);
                break;
        }
    }
    
    /**
     * Inner class to wrap stock data with raw numeric values for sorting
     */
    private static class StockDataWrapper {
        final String ticker;
        final String name;
        final double price;
        final double change;
        final double changeRate;
        final double volumeRaw;
        final double tradeValueRaw;
        final double marketCapRaw;
        
        StockDataWrapper(String ticker, String name, double price, double change, double changeRate,
                        double volumeRaw, double tradeValueRaw, double marketCapRaw) {
            this.ticker = ticker;
            this.name = name;
            this.price = price;
            this.change = change;
            this.changeRate = changeRate;
            this.volumeRaw = volumeRaw;
            this.tradeValueRaw = tradeValueRaw;
            this.marketCapRaw = marketCapRaw;
        }
        
        KrxRankingStock toKrxRankingStock(int rank) {
            return new KrxRankingStock(
                rank, ticker, name, price, change, changeRate,
                formatLargeNumberStatic(volumeRaw),
                formatLargeNumberStatic(marketCapRaw),
                formatLargeNumberStatic(tradeValueRaw)
            );
        }
        
        private static String formatLargeNumberStatic(double number) {
            DecimalFormat df = new DecimalFormat("#,##0.00");
            NumberFormat nf = NumberFormat.getInstance(Locale.KOREA);
            
            if (number >= 100_000_000L) { // 억 (100 million)
                double eok = number / 100_000_000.0;
                if (eok >= 10000) { // 조 (1 trillion = 10,000 억)
                    return df.format(eok / 10000.0) + "조";
                }
                return df.format(eok) + "억";
            } else if (number >= 10_000L) { // 만 (10 thousand)
                return df.format(number / 10_000.0) + "만";
            } else {
                return nf.format((long)number);
            }
        }
    }
    
    /**
     * Helper method to parse numeric strings with commas
     */
    private long parseNumber(String value) {
        if (value == null || value.isEmpty()) {
            return 0;
        }
        try {
            return Long.parseLong(value.replaceAll(",", ""));
        } catch (NumberFormatException e) {
            logger.warn("Failed to parse number: {}", value);
            return 0;
        }
    }
}