package com.Stalk.project.api.favorite.stock.dto.in;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// 클라이언트로부터 요청을 받을 때 사용할 DTO (inbound)
@Data
public class FavoriteStockRequestDto {

    @NotBlank(message = "티커는 비워둘 수 없습니다.")
    private String ticker;
}