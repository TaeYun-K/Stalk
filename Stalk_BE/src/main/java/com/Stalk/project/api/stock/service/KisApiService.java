package com.Stalk.project.api.stock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.Stalk.project.global.config.KisApiConfig;
import com.Stalk.project.api.stock.dto.KisStockInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for integrating with KIS (Korea Investment & Securities) Open API
 * Provides historical stock price data using official KIS API endpoints
 */
@Service
public class KisApiService {

    private static final Logger logger = LoggerFactory.getLogger(KisApiService.class);
    
    private final KisApiConfig kisApiConfig;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    // KIS API endpoints
    private static final String TOKEN_ENDPOINT = "/oauth2/tokenP";
    private static final String HISTORICAL_PRICE_ENDPOINT = "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice";
    
    private String accessToken;
    private long tokenExpiryTime;
    
    @Autowired
    public KisApiService(KisApiConfig kisApiConfig) {
        this.kisApiConfig = kisApiConfig;
        this.objectMapper = new ObjectMapper();
        this.webClient = WebClient.builder()
                .baseUrl(kisApiConfig.getBaseUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, "Mozilla/5.0")
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
    
    /**
     * Get access token for KIS API authentication
     */
    private String getAccessToken() {
        if (accessToken != null && System.currentTimeMillis() < tokenExpiryTime) {
            return accessToken;
        }
        
        try {
            logger.info("Requesting new KIS API access token");
            
            String requestBody = String.format(
                "{\"grant_type\":\"client_credentials\",\"appkey\":\"%s\",\"appsecret\":\"%s\"}", 
                kisApiConfig.getAppKey(), 
                kisApiConfig.getAppSecret()
            );
            
            String response = webClient.post()
                .uri(TOKEN_ENDPOINT)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();
            
            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                String newToken = root.path("access_token").asText();
                int expiresIn = root.path("expires_in").asInt(86400); // Default 24 hours
                
                if (!newToken.isEmpty()) {
                    this.accessToken = newToken;
                    this.tokenExpiryTime = System.currentTimeMillis() + (expiresIn - 300) * 1000L; // 5 min buffer
                    logger.info("KIS API access token obtained successfully, expires in {} seconds", expiresIn);
                    return accessToken;
                }
            }
            
            logger.error("Failed to obtain KIS API access token");
            return null;
            
        } catch (Exception e) {
            logger.error("Error getting KIS API access token", e);
            return null;
        }
    }
    
    /**
     * Fetch historical stock prices from KIS API
     * @param ticker Stock ticker code (e.g., "005930")
     * @param periodDays Number of days to fetch (up to 100 for daily data)
     * @return List of historical stock price data
     */
    @Cacheable(value = "kisHistoricalPrices", key = "#ticker + '_' + #periodDays")
    public List<KisStockInfo> getHistoricalPrices(String ticker, int periodDays) {
        logger.info("=== KIS API HISTORICAL DATA FETCH ===");
        logger.info("Fetching KIS historical prices for ticker: {}, period: {} days", ticker, periodDays);
        
        String token = getAccessToken();
        if (token == null) {
            logger.error("Cannot fetch historical data - no access token");
            return new ArrayList<>();
        }
        
        try {
            // Calculate date range (KIS API limit: max 100 records per call)
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(Math.min(periodDays, 100)); // KIS API hard limit
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
            String startDateStr = startDate.format(formatter);
            String endDateStr = endDate.format(formatter);
            
            logger.info("KIS API date range: {} to {}", startDateStr, endDateStr);
            
            // Build query parameters
            String queryParams = String.format(
                "?fid_cond_mrkt_div_code=J&fid_input_iscd=%s&fid_input_date_1=%s&fid_input_date_2=%s&fid_period_div_code=D&fid_org_adj_prc=1",
                ticker, startDateStr, endDateStr
            );
            
            String response = webClient.get()
                .uri(HISTORICAL_PRICE_ENDPOINT + queryParams)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .header("appkey", kisApiConfig.getAppKey())
                .header("appsecret", kisApiConfig.getAppSecret())
                .header("tr_id", "FHKST03010100") // Transaction ID for daily price inquiry
                .retrieve()
                .bodyToMono(String.class)
                .block();
            
            if (response != null) {
                logger.debug("KIS API response received: {}", response.substring(0, Math.min(response.length(), 200)));
                List<KisStockInfo> historicalData = parseHistoricalResponse(response, ticker);
                
                // Sort by date (oldest first) for proper chart display
                historicalData.sort((a, b) -> a.getDate().compareTo(b.getDate()));
                logger.info("Sorted {} historical data points in chronological order", historicalData.size());
                
                return historicalData;
            } else {
                logger.warn("KIS API returned null response");
                return new ArrayList<>();
            }
            
        } catch (Exception e) {
            logger.error("Error fetching KIS historical data for ticker: {}", ticker, e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Parse KIS API historical price response
     */
    private List<KisStockInfo> parseHistoricalResponse(String response, String ticker) {
        List<KisStockInfo> historicalData = new ArrayList<>();
        
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode rtCd = root.path("rt_cd");
            JsonNode msgCd = root.path("msg_cd");
            
            if (!"0".equals(rtCd.asText())) {
                logger.error("KIS API error - rt_cd: {}, msg_cd: {}, msg1: {}", 
                    rtCd.asText(), msgCd.asText(), root.path("msg1").asText());
                return historicalData;
            }
            
            JsonNode output2 = root.path("output2");
            if (output2.isArray() && output2.size() > 0) {
                logger.info("KIS API returned {} data points", output2.size());
                
                for (JsonNode dataNode : output2) {
                    KisStockInfo stockInfo = objectMapper.treeToValue(dataNode, KisStockInfo.class);
                    stockInfo.setTicker(ticker);
                    historicalData.add(stockInfo);
                }
                
                logger.info("Parsed {} historical data points from KIS API", historicalData.size());
            } else {
                logger.warn("No output2 data in KIS API response");
            }
            
        } catch (Exception e) {
            logger.error("Error parsing KIS API response", e);
        }
        
        return historicalData;
    }
    
    /**
     * Test KIS API connectivity
     */
    public boolean testConnection() {
        try {
            String token = getAccessToken();
            return token != null && !token.isEmpty();
        } catch (Exception e) {
            logger.error("KIS API connection test failed", e);
            return false;
        }
    }
}