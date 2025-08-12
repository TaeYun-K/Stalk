package com.Stalk.project.api.advisor.profile.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "자격증 승인 요청 처리 결과 응답 DTO")
public class CertificateApprovalResponseDto {

    @Schema(description = "승인 요청 ID", example = "6")
    private Long requestId;

    @Schema(description = "요청 상태", example = "PENDING")
    private String status;

    @Schema(description = "요청 타입", example = "신규요청")
    private String requestType;

    @Schema(description = "추가 메시지", example = "자격 승인 요청이 접수되었습니다.")
    private String message;

    // 정적 팩토리 메서드들
    public static CertificateApprovalResponseDto newRequest(Long requestId) {
        CertificateApprovalResponseDto response = new CertificateApprovalResponseDto();
        response.setRequestId(requestId);
        response.setStatus("PENDING");
        response.setRequestType("신규요청");
        return response;
    }

    public static CertificateApprovalResponseDto reRequest(Long requestId) {
        CertificateApprovalResponseDto response = new CertificateApprovalResponseDto();
        response.setRequestId(requestId);
        response.setStatus("PENDING");
        response.setRequestType("재요청");
        return response;
    }

    public CertificateApprovalResponseDto withMessage(String message) {
        this.setMessage(message);
        return this;
    }
}