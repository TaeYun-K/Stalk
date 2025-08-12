package com.Stalk.project.api.favorite.stock.dto.out;

import lombok.Builder;
import lombok.Data;

// 최종적으로 클라이언트에게 응답할 DTO
@Data
@Builder
public class FavoriteStockResponseDto {
    private String ticker;      // 종목 티커
    private String name;        // 종목명
    private String price;       // 현재가
    private String change;      // 전일 대비 변동가
    private String changeRate;  // 전일 대비 등락률
}