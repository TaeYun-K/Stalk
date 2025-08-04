package com.Stalk.project.api.stock.controller;

import com.Stalk.project.api.stock.service.KrxApiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/stock")
public class StockDataController {
    
    private static final Logger logger = LoggerFactory.getLogger(StockDataController.class);
    
    @Autowired
    private KrxApiService krxApiService;
    
    @GetMapping("/daily/{stockCode}")
    public ResponseEntity<Map<String, Object>> getDailyStockData(
            @PathVariable String stockCode,
            @RequestParam(defaultValue = "30") int period) {
        
        logger.info("Stock API: Fetching stock data for code: {}, period: {}", stockCode, period);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get current real price from KRX API
            double currentPrice = getCurrentRealPrice(stockCode);
            
            if (currentPrice <= 0) {
                response.put("success", false);
                response.put("error", "No real-time data available for stock: " + stockCode);
                response.put("stockCode", stockCode);
                return ResponseEntity.ok(response);
            }
            
            // Generate realistic historical data points based on current real price
            List<Map<String, Object>> currentData = generateDailyData(stockCode, currentPrice, Math.abs(period));
            
            response.put("success", true);
            response.put("data", currentData);
            response.put("stockCode", stockCode);
            response.put("period", period);
            response.put("aggregationType", "current");
            response.put("message", "Showing realistic data based on current real price. Historical data not yet implemented.");
            
            logger.info("Stock API: Returning {} data points for stock: {}", currentData.size(), stockCode);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Stock API: Failed to fetch stock data", e);
            response.put("success", false);
            response.put("error", "Failed to fetch stock data: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get current real price from KRX API
     */
    private double getCurrentRealPrice(String stockCode) {
        try {
            // Try STK market first, then KSQ if not found
            var stockInfo = krxApiService.getIndividualStockInfo(stockCode, "STK");
            if (stockInfo == null) {
                stockInfo = krxApiService.getIndividualStockInfo(stockCode, "KSQ");
            }
            
            if (stockInfo != null) {
                String priceStr = stockInfo.getClosePrice();
                if (priceStr != null && !priceStr.isEmpty()) {
                    double price = Double.parseDouble(priceStr.replace(",", ""));
                    logger.info("Retrieved current real price for {}: {}", stockCode, price);
                    return price;
                }
            }
            
        } catch (Exception e) {
            logger.error("Failed to get current price for stock: {}", stockCode, e);
        }
        
        return 0;
    }
    
    /**
     * Generate daily historical data based on current real price
     */
    private List<Map<String, Object>> generateDailyData(String stockCode, double currentPrice, int days) {
        List<Map<String, Object>> data = new ArrayList<>();
        Random random = new Random(stockCode.hashCode());
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        
        double price = currentPrice;
        
        // Generate at least 20 data points for a proper chart
        int minPoints = Math.max(days, 20);
        int daysBack = 0;
        
        while (data.size() < minPoints && daysBack < 100) {
            LocalDate date = LocalDate.now().minusDays(daysBack);
            
            // Skip weekends
            if (date.getDayOfWeek().getValue() < 6) {
                Map<String, Object> dayData = new HashMap<>();
                dayData.put("date", date.format(formatter));
                dayData.put("close", Math.round(price));
                
                long baseVolume = 1000000 + random.nextInt(5000000);
                dayData.put("volume", baseVolume);
                
                data.add(0, dayData); // Add to beginning (oldest first)
                
                // Generate price for previous day
                double changePercent = (random.nextDouble() - 0.5) * 0.06; // ±3% daily change
                price = price / (1 + changePercent);
            }
            
            daysBack++;
        }
        
        logger.info("Generated {} data points for {} ending at real price {}", 
                   data.size(), stockCode, currentPrice);
        
        return data;
    }
}