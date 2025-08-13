package com.Stalk.project.api.review.dto.in;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReviewCreateRequestDto {
    
    @NotNull(message = "상담 ID는 필수입니다.")
    @Schema(description = "상담 ID", example = "123")
    private Long consultationId;
    
    @NotNull(message = "평점은 필수입니다.")
    @Min(value = 1, message = "평점은 1점 이상이어야 합니다.")
    @Max(value = 5, message = "평점은 5점 이하여야 합니다.")
    @Schema(description = "평점 (1-5점)", example = "5")
    private Integer rating;
    
    @NotBlank(message = "리뷰 내용은 필수입니다.")
    @Schema(description = "리뷰 내용", example = "정말 도움이 되었습니다.")
    private String content;
}