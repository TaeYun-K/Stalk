package com.Stalk.project.api.favorite.stock.service;

import com.Stalk.project.api.favorite.stock.dao.FavoriteStockMapper;
import com.Stalk.project.api.favorite.stock.dto.in.ExternalStockDataDto;
import com.Stalk.project.api.favorite.stock.dto.out.FavoriteStockResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteStockService {

    private final FavoriteStockMapper favoriteStockMapper;
    private final WebClient webClient;

    // application.properties에서 외부 API의 기본 URL을 주입
    @Value("${external.api.stock.url}")
    private String stockApiUrl;

    /**
     * 사용자의 관심 목록 전체를 조회하고, 각 종목의 최신 정보를 포함하여 반환합니다.
     * @param userId 사용자 ID
     * @return 최신 정보가 포함된 관심 종목 DTO 리스트
     */
    public List<FavoriteStockResponseDto> getFavorites(Long userId) {
        // DB에서 사용자가 등록한 관심 종목 티커 목록 조회
        List<String> tickers = favoriteStockMapper.findTickersByUserId(userId);

        if (tickers.isEmpty()) {
            return Collections.emptyList();
        }

        // 각 티커에 대해 외부 API를 비동기적으로 호출하여 최신 주식 정보를 가져옴
        // Flux를 사용하여 여러 API 요청을 병렬로 처리함으로써 성능을 향상
        return Flux.fromIterable(tickers)
                .flatMap(this::fetchStockData) // 각 티커로 fetchStockData 메소드 호출
                .collectList() // 모든 결과를 List로 수집
                .block(); // 비동기 작업이 완료될 때까지 대기 (Controller는 동기 방식이므로)
    }

    /**
     * 특정 티커의 최신 주식 정보를 외부 API를 통해 가져옵니다.
     * @param ticker 종목 티커
     * @return 최신 정보가 포함된 DTO
     */
    // FavoriteStockService.java

    private Mono<FavoriteStockResponseDto> fetchStockData(String ticker) {
        String guess = (ticker.startsWith("9") || ticker.startsWith("3")) ? "KOSDAQ" : "KOSPI";
        String other = guess.equals("KOSPI") ? "KOSDAQ" : "KOSPI";

        return callOnceFlexible(ticker, guess)
            .onErrorResume(e -> callOnceFlexible(ticker, other))
            .onErrorReturn(createFallbackDto(ticker));
    }

    private Mono<FavoriteStockResponseDto> callOnceFlexible(String ticker, String market) {
        String url = String.format("%s/api/krx/stock/%s?market=%s", stockApiUrl, ticker, market);
        return webClient.get()
            .uri(url)
            .retrieve()
            .bodyToMono(com.fasterxml.jackson.databind.JsonNode.class)
            .map(node -> {
                // 래퍼 처리: { success, data: {...} } 형태면 data로 이동
                com.fasterxml.jackson.databind.JsonNode data = node.has("data") ? node.get("data") : node;

                String name = pick(data, "name", "ISU_ABBRV");
                String price = pick(data, "price", "closePrice", "TDD_CLSPRC");
                String change = pick(data, "change", "priceChange", "CMPPREVDD_PRC");
                String changeRate = pick(data, "changeRate", "FLUC_RT");

                return FavoriteStockResponseDto.builder()
                    .ticker(ticker)
                    .name(emptyTo(name, "정보 조회 실패"))
                    .price(emptyTo(price, "0"))
                    .change(emptyTo(change, "0"))
                    .changeRate(emptyTo(changeRate, "0"))
                    .build();
            });
    }

    private String pick(com.fasterxml.jackson.databind.JsonNode node, String... keys) {
        for (String k : keys) {
            com.fasterxml.jackson.databind.JsonNode v = node.get(k);
            if (v != null && !v.isNull() && !v.asText().isBlank()) return v.asText();
        }
        return null;
    }

    private String emptyTo(String v, String fallback) {
        return (v == null || v.isBlank() || "-".equals(v)) ? fallback : v;
    }

    // API 호출 실패 시 반환할 기본 DTO 객체 생성
    private FavoriteStockResponseDto createFallbackDto(String ticker) {
        return FavoriteStockResponseDto.builder()
                .ticker(ticker)
                .name("정보 조회 실패")
                .price("-")
                .change("-")
                .changeRate("-")
                .build();
    }

    // --- [저장 로직] ---
    @Transactional
    public void addFavorite(Long userId, String ticker) {
        // 1. 이미 등록된 종목인지 확인
        if (favoriteStockMapper.exists(userId, ticker) > 0) {
            // 여기서는 간단히 예외를 던지거나, 혹은 아무 동작도 안하고 리턴할 수 있습니다.
            throw new IllegalArgumentException("이미 관심 종목으로 등록된 티커입니다.");
        }
        // 2. DB에 저장
        favoriteStockMapper.addFavorite(userId, ticker);
    }

    // --- [삭제 로직] ---
    @Transactional
    public void deleteFavorite(Long userId, String ticker) {
        favoriteStockMapper.deleteFavorite(userId, ticker);
    }
}