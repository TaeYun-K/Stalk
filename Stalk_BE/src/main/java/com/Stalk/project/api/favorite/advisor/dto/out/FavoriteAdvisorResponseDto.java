package com.Stalk.project.api.favorite.advisor.dto.out;

import com.Stalk.project.api.favorite.advisor.dto.in.PreferredTradeStyle;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "찜한 전문가 응답 DTO")
public class FavoriteAdvisorResponseDto {

    @Schema(description = "전문가 고유 ID", example = "1")
    private Long advisorId;

    @Schema(description = "전문가 이름", example = "이수진")
    private String name;

    @Schema(description = "전문가 프로필 이미지 URL", example = "/images/profiles/advisor1.png")
    private String profileImage;

    @Schema(description = "전문가 평점", example = "4.8")
    private Double averageRating;

    @Schema(description = "전문가 리뷰 수", example = "127")
    private Integer reviewCount;

    @Schema(description = "전문가가 선호하는 투자방식", example = "MID_LONG")
    private PreferredTradeStyle preferredTradeStyle;

    @Schema(description = "전문가 간단한 소개 문구", example = "중장기 안정적 투자 전문가")
    private String shortIntro;
}
