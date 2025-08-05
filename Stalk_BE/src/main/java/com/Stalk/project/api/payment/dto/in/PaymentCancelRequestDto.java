package com.Stalk.project.api.payment.dto.in;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCancelRequestDto {
    private String cancelReason;        // 취소 사유
    private Integer cancelAmount;       // 취소 금액 (null이면 전액 취소)
    private Integer refundableAmount;   // 환불 가능 금액 (토스 요구사항)
}