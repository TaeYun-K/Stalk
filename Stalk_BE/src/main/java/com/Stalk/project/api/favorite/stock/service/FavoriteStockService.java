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
    private Mono<FavoriteStockResponseDto> fetchStockData(String ticker) {
        // KOSPI, KOSDAQ 시장 구분 로직 (stock-chart.tsx 참고)
        String market = ticker.startsWith("9") || ticker.startsWith("3") ? "KOSDAQ" : "KOSPI";
        String url = String.format("%s/api/krx/stock/%s?market=%s", stockApiUrl, ticker, market);
        
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(ExternalStockDataDto.class) // 응답을 DTO로 변환
                .map(data -> FavoriteStockResponseDto.builder() // 최종 응답 DTO로 매핑
                        .ticker(ticker)
                        .name(data.getName())
                        .price(data.getPrice())
                        .change(data.getChange())
                        .changeRate(data.getChangeRate())
                        .build())
                .doOnError(error -> log.error("Failed to fetch stock data for ticker {}: {}", ticker, error.getMessage()))
                .onErrorReturn(createFallbackDto(ticker)); // 에러 발생 시 기본값 반환
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