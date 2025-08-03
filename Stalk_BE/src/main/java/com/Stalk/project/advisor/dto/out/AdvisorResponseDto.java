package com.Stalk.project.advisor.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
public class AdvisorResponseDto {

    @Schema(description = "어드바이저 ID", example = "1")
    private Long id;

    @Schema(description = "어드바이저 이름", example = "김재현")
    private String name;

    @Schema(description = "프로필 이미지 URL", example = "https://cdn.domain.com/img/user27.jpg")
    private String profileImageUrl;

    @Schema(description = "선호 투자 성향", example = "LONG")
    private String preferredStyle;

    @Schema(description = "한줄 소개", example = "여러분의 투자 전문가 김재현입니다.")
    private String shortIntro;

    @Schema(description = "평균 평점", example = "4.7")
    private Double averageRating;

    @Schema(description = "후기 개수", example = "38")
    private Integer reviewCount;

    @Schema(description = "상담료")
    private Integer consultationFee;

    @Schema(description = "승인 여부")
    private Boolean isApproved;

    @Schema(description = "생성일시")
    private LocalDateTime createdAt;

    @Schema(description = "자격증 목록")
    private List<CertificateDto> certificates;

    @Data
    @NoArgsConstructor
    public static class CertificateDto {
        @Schema(description = "전문가 ID (내부용)", hidden = true)
        private Long advisorId; // 쿼리 결과 매핑용 (JSON 응답에서는 제외)

        @Schema(description = "자격증명", example = "투자상담사")
        private String certificateName;

        @Schema(description = "발급기관", example = "한국금융투자협회")
        private String issuedBy;
    }
}
