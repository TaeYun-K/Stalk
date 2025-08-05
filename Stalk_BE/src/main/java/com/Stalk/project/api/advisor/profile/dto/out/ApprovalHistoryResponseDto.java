package com.Stalk.project.api.advisor.profile.dto.out;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "승인 요청 이력 응답 DTO")
public class ApprovalHistoryResponseDto {

    @Schema(description = "요청 ID", example = "6")
    private Long requestId;

    @Schema(description = "자격증명", example = "투자상담사")
    private String certificateName;

    @Schema(description = "자격증 일련번호", example = "12345678")
    private String certificateFileSn;

    @Schema(description = "자격증 파일번호", example = "123456")
    private String certificateFileNumber;

    @Schema(description = "요청 상태", example = "PENDING", allowableValues = {"PENDING", "APPROVED", "REJECTED"})
    private String status;

    @Schema(description = "상태 표시명", example = "승인 대기")
    private String statusDisplayName;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'+09:00'")
    @Schema(description = "요청일시", example = "2025-08-04T10:00:00+09:00")
    private LocalDateTime requestedAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'+09:00'")
    @Schema(description = "처리일시", example = "2025-08-04T15:30:00+09:00")
    private LocalDateTime processedAt;

    @Schema(description = "거절 사유", example = "자격증 번호 불일치")
    private String rejectionReason;

    @Schema(description = "처리한 관리자명", example = "관리자")
    private String processedByAdminName;

    @Schema(description = "이전 요청 ID (재요청인 경우)", example = "5")
    private Long previousRequestId;

    // 상태별 표시명 설정
    public void setStatus(String status) {
        this.status = status;
        this.statusDisplayName = getStatusDisplayName(status);
    }

    private String getStatusDisplayName(String status) {
        return switch (status) {
            case "PENDING" -> "승인 대기";
            case "APPROVED" -> "승인 완료";
            case "REJECTED" -> "승인 거절";
            default -> status;
        };
    }

    // 재요청 여부 확인
    public boolean isReRequest() {
        return previousRequestId != null;
    }
}