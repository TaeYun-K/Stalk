package com.Stalk.project.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class AppConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
    
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        cacheManager.setCacheNames(java.util.Arrays.asList(
            "kospiVolumeRanking",
            "kospiTradeValueRanking", 
            "kospiPriceIncreaseRanking",
            "kospiPriceDecreaseRanking",
            "kosdaqVolumeRanking",
            "kosdaqTradeValueRanking",
            "kosdaqPriceIncreaseRanking", 
            "kosdaqPriceDecreaseRanking",
            "individualStockInfo",
            "etfDailyTrading",
            "historicalPrices",
            "realHistoricalPrices",
            "kisHistoricalPrices"
        ));
        return cacheManager;
    }
}