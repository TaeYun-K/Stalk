package com.Stalk.project.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KisApiConfig {
    
    @Value("${kis.api.app-key}")
    private String appKey;
    
    @Value("${kis.api.app-secret}")
    private String appSecret;
    
    @Value("${kis.api.base-url}")
    private String baseUrl;
    
    // Production URL - change to this if needed
    // @Value("${kis.api.base-url:https://openapivts.koreainvestment.com:29443}")
    
    public String getAppKey() {
        return appKey;
    }
    
    public String getAppSecret() {
        return appSecret;
    }
    
    public String getBaseUrl() {
        return baseUrl;
    }
}