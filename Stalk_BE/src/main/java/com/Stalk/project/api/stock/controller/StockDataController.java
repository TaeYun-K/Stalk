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
            
            // Return only current price data - no mock data generation
            Map<String, Object> currentData = new HashMap<>();
            currentData.put("price", currentPrice);
            currentData.put("date", LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")));
            
            response.put("success", true);
            response.put("data", currentData);
            response.put("stockCode", stockCode);
            response.put("period", period);
            response.put("message", "Only current price available. Historical data requires real KRX API implementation.");
            
            logger.info("Stock API: Returning current price data for stock: {}", stockCode);
            
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
    
}