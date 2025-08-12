package com.Stalk.project.api.advisor.profile.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "전문가 프로필 처리 결과 응답 DTO")
public class AdvisorProfileResponseDto {

    @Schema(description = "처리 성공 여부", example = "true")
    private Boolean success;

    @Schema(description = "추가 메시지", example = "프로필이 성공적으로 등록되었습니다.")
    private String message;

    // 정적 팩토리 메서드들
    public static AdvisorProfileResponseDto success() {
        AdvisorProfileResponseDto response = new AdvisorProfileResponseDto();
        response.setSuccess(true);
        return response;
    }

    public static AdvisorProfileResponseDto success(String message) {
        AdvisorProfileResponseDto response = new AdvisorProfileResponseDto();
        response.setSuccess(true);
        response.setMessage(message);
        return response;
    }

    public static AdvisorProfileResponseDto failure(String message) {
        AdvisorProfileResponseDto response = new AdvisorProfileResponseDto();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
}