package com.Stalk.project.global.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@Getter
public class TossPaymentConfig {

    @Value("${payment.toss.test_client_api_key}")
    private String testClientApiKey;

    @Value("${payment.toss.test_secret_api_key}")
    private String testSecretKey;

    // 토스페이먼츠 API URL
    public static final String URL = "https://api.tosspayments.com/v1/payments/";
    
    // 결제 승인 API URL
    public static final String CONFIRM_URL = URL + "confirm";
    
    // 결제 취소 API URL  
    public static final String CANCEL_URL = URL;  // + paymentKey + "/cancel"
    
    // 상담 예약 기본 금액
    @Value("${consultation.default_fee:30000}")
    private int defaultConsultationFee;
    
    // 주문번호 접두사
    @Value("${consultation.order_prefix:CONSULT}")
    private String orderPrefix;

    /**
     * HTTP 통신을 위한 RestTemplate Bean
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    
    /**
     * Basic 인증 헤더 생성 (시크릿 키를 Base64 인코딩)
     */
    public String getAuthorizationHeader() {
        return "Basic " + java.util.Base64.getEncoder()
                .encodeToString((testSecretKey + ":").getBytes());
    }
    
    /**
     * 주문번호 생성 (CONSULT_20250805_143022_1001_2)
     */
    public String generateOrderId(Long userId, Long advisorId) {
        String timestamp = java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return String.format("%s_%s_%d_%d", orderPrefix, timestamp, userId, advisorId);
    }
}