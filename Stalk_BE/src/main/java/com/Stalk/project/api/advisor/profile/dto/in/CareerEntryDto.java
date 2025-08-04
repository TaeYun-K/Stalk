package com.Stalk.project.api.advisor.profile.dto.in;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Schema(description = "전문가 경력 정보 DTO")
public class CareerEntryDto {

    @Schema(description = "경력 ID (수정/삭제 시 필요)", example = "1")
    private Long id;

    @Schema(description = "작업 유형 (CREATE/UPDATE/DELETE)", example = "CREATE")
    private String action;

    @NotBlank(message = "경력 제목은 필수입니다.")
    @Schema(description = "경력 제목", example = "ABC증권 투자상담사", required = true)
    private String title;

    @NotBlank(message = "경력 설명은 필수입니다.")
    @Schema(description = "경력 설명", example = "개인 투자자 대상 포트폴리오 상담 업무", required = true)
    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Schema(description = "시작일", example = "2020-01-01")
    private LocalDate startedAt;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Schema(description = "종료일", example = "2023-12-31")
    private LocalDate endedAt;

    // Validation 메서드들
    public boolean isCreateAction() {
        return "CREATE".equals(action);
    }

    public boolean isUpdateAction() {
        return "UPDATE".equals(action);
    }

    public boolean isDeleteAction() {
        return "DELETE".equals(action);
    }

    // UPDATE나 DELETE 액션일 때는 ID가 필수
    public boolean isValidForUpdate() {
        return isUpdateAction() && id != null;
    }

    public boolean isValidForDelete() {
        return isDeleteAction() && id != null;
    }
}