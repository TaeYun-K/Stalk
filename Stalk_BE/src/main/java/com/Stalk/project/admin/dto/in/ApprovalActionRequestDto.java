package com.Stalk.project.admin.dto.in;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalActionRequestDto {
    
    @NotNull(message = "거절 사유는 필수입니다.")
    @Schema(description = "거절 사유", example = "INVALID_CERTIFICATE")
    private RejectionReason rejectionReason;
    
    @Size(max = 500, message = "추가 사유는 500자를 초과할 수 없습니다.")
    @Schema(description = "추가 거절 사유 (선택사항)", example = "제출된 자격증이 유효하지 않습니다.")
    private String customReason;
}
