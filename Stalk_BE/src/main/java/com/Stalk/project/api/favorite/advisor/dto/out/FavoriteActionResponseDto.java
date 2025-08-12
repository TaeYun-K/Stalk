package com.Stalk.project.api.favorite.advisor.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "찜 추가/삭제 응답 DTO")
public class FavoriteActionResponseDto {
    
    @Schema(description = "처리된 전문가 ID", example = "1")
    private Long advisorId;
}
