package com.Stalk.project.admin.dto.out;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApprovalActionResponseDto {
    
    private Long requestId;
    private Long advisorId;
    private String status;
    private String processedAt;
    private String processedBy;
    
    // 거절 시에만 포함
    private String rejectionReason;
    private String customReason;
}
