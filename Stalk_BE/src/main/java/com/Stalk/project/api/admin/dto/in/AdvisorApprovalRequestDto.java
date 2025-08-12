package com.Stalk.project.api.admin.dto.in;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdvisorApprovalRequestDto {

    // 요청 기본 정보
    private Long requestId;
    private Long advisorId;
    private String status;
    private String requestedAt;
    private String processedAt;

    // 전문가 기본 정보
    private String advisorName;
    private String email;
    private String contact;

    // 자격증 정보 (직접 필드로 추가)
    private String certificateFileSn;
    private String birth;
    private String certificateFileNumber;
    private String certificateName;

    // 기존 중첩 객체 (호환성 유지)
    private CertificateInfoDto certificateInfo;

    // 처리 관련 정보
    private AdminInfoDto processedBy;
    private String rejectionReason;
    private String customReason;

    @Getter
    @Setter
    public static class CertificateInfoDto {
        private String certificateName;
        private String certificateNumber;
        private String serialNumber;
    }

    @Getter
    @Setter
    public static class AdminInfoDto {
        private Long adminId;
        private String adminName;
    }
}