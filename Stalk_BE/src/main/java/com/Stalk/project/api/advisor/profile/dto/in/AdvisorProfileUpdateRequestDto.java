package com.Stalk.project.api.advisor.profile.dto.in;

import com.Stalk.project.api.advisor.dto.in.PreferredTradeStyle;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Schema(description = "전문가 프로필 수정 요청 DTO")
public class AdvisorProfileUpdateRequestDto {

    @Schema(description = "프로필 이미지 URL", example = "https://example.com/new-profile.jpg")
    private String profileImageUrl;

    @Schema(description = "공개 연락처", example = "010-9876-5432")
    private String publicContact;

    @Size(max = 100, message = "간단 소개는 100자 이내여야 합니다.")
    @Schema(description = "간단 소개", example = "업데이트된 소개")
    private String shortIntro;

    @Schema(description = "상세 소개", example = "업데이트된 상세 소개...")
    private String longIntro;

    @Schema(description = "선호 투자 스타일", example = "LONG",
        allowableValues = {"SHORT", "MID_SHORT", "MID", "MID_LONG", "LONG"})
    private PreferredTradeStyle preferredTradeStyle;

    @Min(value = 10000, message = "상담료는 1만원 이상 100만원 이하여야 합니다.")
    @Max(value = 1000000, message = "상담료는 1만원 이상 100만원 이하여야 합니다.")
    @Schema(description = "상담료 (원 단위)", example = "80000", minimum = "10000", maximum = "1000000")
    private Integer consultationFee;

    @Valid
    @Schema(description = "경력 정보 변경 사항 (CREATE/UPDATE/DELETE 액션 포함)")
    private List<CareerEntryDto> careerEntries;

    // Validation 메서드들
    public boolean hasCareerChanges() {
        return careerEntries != null && !careerEntries.isEmpty();
    }

    public List<CareerEntryDto> getCreateCareerEntries() {
        if (careerEntries == null) return List.of();
        return careerEntries.stream()
            .filter(CareerEntryDto::isCreateAction)
            .toList();
    }

    public List<CareerEntryDto> getUpdateCareerEntries() {
        if (careerEntries == null) return List.of();
        return careerEntries.stream()
            .filter(CareerEntryDto::isValidForUpdate)
            .toList();
    }

    public List<CareerEntryDto> getDeleteCareerEntries() {
        if (careerEntries == null) return List.of();
        return careerEntries.stream()
            .filter(CareerEntryDto::isValidForDelete)
            .toList();
    }

    // 적어도 하나의 필드가 업데이트되는지 확인
    public boolean hasAnyUpdates() {
        return profileImageUrl != null ||
            publicContact != null ||
            shortIntro != null ||
            longIntro != null ||
            preferredTradeStyle != null ||
            consultationFee != null ||
            hasCareerChanges();
    }
}