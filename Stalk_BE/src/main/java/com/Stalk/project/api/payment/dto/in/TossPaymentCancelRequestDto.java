package com.Stalk.project.api.payment.dto.in;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TossPaymentCancelRequestDto {
    private String paymentKey;
    private String cancelReason;
    private Integer cancelAmount;
}