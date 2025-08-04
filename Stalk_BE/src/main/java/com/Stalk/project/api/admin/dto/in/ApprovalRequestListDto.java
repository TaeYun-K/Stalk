package com.Stalk.project.api.admin.dto.in;

import com.Stalk.project.global.util.PageRequestDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalRequestListDto extends PageRequestDto {
    
    @Schema(defaultValue = "ALL", description = "인증 요청 상태 (ALL, PENDING, APPROVED, REJECTED)")
    private ApprovalStatus status = ApprovalStatus.ALL;
}
