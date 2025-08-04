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
@RequestMapping("/api/stalk")
public class StockController {
    
    private static final Logger logger = LoggerFactory.getLogger(StockController.class);
    
    @Autowired
    private KrxApiService krxApiService;
    
    @GetMapping("/daily/{stockCode}")
    public ResponseEntity<Map<String, Object>> getDailyStockData(
            @PathVariable String stockCode,
            @RequestParam(defaultValue = "30") int period) {
        
        logger.info("Fetching stock data for code: {}, period: {}", stockCode, period);
        
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
            
            // Determine aggregation type based on period parameter
            String aggregationType = "daily";
            List<Map<String, Object>> currentData;
            
            if (period < 0) {
                // Negative period indicates aggregated data
                if (period == -14) {
                    aggregationType = "weekly";
                    currentData = generateWeeklyData(stockCode, currentPrice, 14);
                } else if (period == -12) {
                    aggregationType = "monthly";
                    currentData = generateMonthlyData(stockCode, currentPrice, 12);
                } else {
                    // Default to weekly for other negative values
                    aggregationType = "weekly";
                    currentData = generateWeeklyData(stockCode, currentPrice, Math.abs(period));
                }
            } else {
                // Positive period means daily data
                currentData = generateDailyData(stockCode, currentPrice, period);
            }
            
            response.put("success", true);
            response.put("data", currentData);
            response.put("stockCode", stockCode);
            response.put("period", period);
            response.put("aggregationType", aggregationType);
            response.put("message", "Showing realistic data based on current real price.");
            
            logger.info("Returning {} {} data points for stock: {} with period: {}", 
                       currentData.size(), aggregationType, stockCode, period);
            
            // Log first and last data points for debugging
            if (!currentData.isEmpty()) {
                logger.info("First data point: {}", currentData.get(0));
                logger.info("Last data point: {}", currentData.get(currentData.size() - 1));
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to fetch stock data", e);
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
        Random random = new Random(stockCode.hashCode()); // Consistent random for same stock
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        
        double price = currentPrice;
        int daysBack = 0;
        
        // Generate daily data working backwards from today
        while (data.size() < days && daysBack < days + 50) {
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
                double changePercent = (random.nextDouble() - 0.5) * 0.04; // ±2% daily change
                price = price / (1 + changePercent);
            }
            
            daysBack++;
        }
        
        logger.info("Generated {} daily data points for {} ending at price {}", 
                   data.size(), stockCode, currentPrice);
        
        return data;
    }
    
    /**
     * Generate weekly data (7-day intervals, ending at today)
     */
    private List<Map<String, Object>> generateWeeklyData(String stockCode, double currentPrice, int weeks) {
        List<Map<String, Object>> data = new ArrayList<>();
        Random random = new Random(stockCode.hashCode());
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        
        double price = currentPrice;
        
        // Start from today and go back in 7-day intervals
        for (int i = 0; i < weeks; i++) {
            LocalDate targetDate = LocalDate.now().minusWeeks(i);
            
            Map<String, Object> weekData = new HashMap<>();
            weekData.put("date", targetDate.format(formatter));
            weekData.put("close", Math.round(price));
            
            // Weekly volume is higher (sum of week)
            long baseVolume = 5000000 + random.nextInt(20000000);
            weekData.put("volume", baseVolume);
            
            data.add(0, weekData); // Add to beginning (oldest first)
            
            // Generate price for previous week (larger changes than daily)
            if (i < weeks - 1) { // Don't change price for the last iteration
                double changePercent = (random.nextDouble() - 0.5) * 0.10; // ±5% weekly change
                price = price / (1 + changePercent);
            }
        }
        
        logger.info("Generated {} weekly data points for {} ending at today with price {}", 
                   data.size(), stockCode, currentPrice);
        
        return data;
    }
    
    /**
     * Generate monthly data (first day of each month, ending at today)
     */
    private List<Map<String, Object>> generateMonthlyData(String stockCode, double currentPrice, int months) {
        List<Map<String, Object>> data = new ArrayList<>();
        Random random = new Random(stockCode.hashCode());
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        
        double price = currentPrice;
        
        // First, add today's data as the most recent point
        Map<String, Object> todayData = new HashMap<>();
        todayData.put("date", LocalDate.now().format(formatter));
        todayData.put("close", Math.round(currentPrice));
        todayData.put("volume", 20000000 + random.nextInt(80000000));
        data.add(todayData);
        
        // Then generate previous months' data (1st of each month)
        for (int i = 1; i < months; i++) {
            LocalDate targetDate = LocalDate.now().minusMonths(i).withDayOfMonth(1);
            
            // Generate price for previous month
            double changePercent = (random.nextDouble() - 0.5) * 0.20; // ±10% monthly change
            price = price / (1 + changePercent);
            
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("date", targetDate.format(formatter));
            monthData.put("close", Math.round(price));
            
            // Monthly volume is much higher (sum of month)
            long baseVolume = 20000000 + random.nextInt(80000000);
            monthData.put("volume", baseVolume);
            
            data.add(0, monthData); // Add to beginning (oldest first)
        }
        
        logger.info("Generated {} monthly data points for {} ending at today with price {}", 
                   data.size(), stockCode, currentPrice);
        
        return data;
    }
}