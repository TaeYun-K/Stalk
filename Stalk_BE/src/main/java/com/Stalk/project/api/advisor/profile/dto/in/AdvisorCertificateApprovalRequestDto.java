package com.Stalk.project.api.advisor.profile.dto.in;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "전문가 자격증 승인 요청 DTO")
public class AdvisorCertificateApprovalRequestDto {

    @Schema(description = "이전 요청 ID (재요청 시에만 필요)", example = "5")
    private Long previousRequestId;

    @NotBlank(message = "자격증명은 필수입니다.")
    @Schema(description = "자격증명", example = "투자상담사", required = true)
    private String certificateName;

    @NotBlank(message = "자격증 일련번호는 필수입니다.")
    @Pattern(regexp = "^\\d{8}$", message = "자격증 일련번호는 8자리 숫자여야 합니다.")
    @Schema(description = "자격증 일련번호", example = "12345678", required = true)
    private String certificateFileSn;

    @NotBlank(message = "생년월일은 필수입니다.")
    @Pattern(regexp = "^\\d{8}$", message = "생년월일은 YYYYMMDD 형식이어야 합니다.")
    @Schema(description = "생년월일", example = "19900101", required = true)
    private String birth;

    @NotBlank(message = "자격증 파일번호는 필수입니다.")
    @Pattern(regexp = "^\\d{6}$", message = "자격증 파일번호는 6자리 숫자여야 합니다.")
    @Schema(description = "자격증 파일번호", example = "123456", required = true)
    private String certificateFileNumber;

    // 재요청 여부 확인
    public boolean isReRequest() {
        return previousRequestId != null;
    }

    // 요청 타입을 문자열로 반환
    public String getRequestType() {
        return isReRequest() ? "재요청" : "신규요청";
    }
}