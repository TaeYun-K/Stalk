package com.Stalk.project.api.payment.dto.in;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class ConsultationSessionUpdateDto {
    private String orderId;
    private String status;
    private String cancelReason;
    private LocalDateTime canceledAt;
    private Long canceledBy;
}