package com.Stalk.project.api.advisor.profile.dto.in;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Schema(description = "전문가 프로필 등록 요청 DTO")
public class AdvisorProfileCreateRequestDto {

    @Schema(description = "프로필 이미지 URL", example = "https://example.com/profile.jpg")
    private String profileImageUrl;

    @Schema(description = "공개 연락처", example = "010-1234-5678")
    private String publicContact;

    @NotBlank(message = "간단 소개는 필수입니다.")
    @Size(max = 100, message = "간단 소개는 100자 이내여야 합니다.")
    @Schema(description = "간단 소개", example = "중장기 투자 전문가", required = true)
    private String shortIntro;

    @Schema(description = "상세 소개", example = "10년 경력의 투자 상담 전문가입니다...")
    private String longIntro;

    @NotNull(message = "선호 투자 스타일은 필수입니다.")
    @Schema(description = "선호 투자 스타일", example = "MID_LONG", 
            allowableValues = {"SHORT", "MID_SHORT", "MID", "MID_LONG", "LONG"}, required = true)
    private String preferredTradeStyle;

    @NotEmpty(message = "경력 정보는 최소 1개 이상 등록해야 합니다.")
    @Valid
    @Schema(description = "경력 정보 목록", required = true)
    private List<CareerEntryDto> careerEntries;

    // Validation 메서드
    public boolean hasValidCareerEntries() {
        if (careerEntries == null || careerEntries.isEmpty()) {
            return false;
        }
        
        // CREATE 액션이 아닌 경력이 있으면 등록 요청에서는 유효하지 않음
        return careerEntries.stream()
                .allMatch(career -> career.getAction() == null || career.isCreateAction());
    }
}