package com.Stalk.project.api.favorite.stock.dto.in;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

// WebClient로 외부 주식 API 호출 시 응답을 매핑하기 위한 DTO
@Data
public class ExternalStockDataDto {
    @JsonProperty("ISU_ABBRV") // 종목명
    private String name;

    @JsonProperty("TDD_CLSPRC") // 당일 종가 (현재가)
    private String price;

    @JsonProperty("CMPPREVDD_PRC") // 전일 대비 가격
    private String change;

    @JsonProperty("FLUC_RT") // 등락률
    private String changeRate;
}