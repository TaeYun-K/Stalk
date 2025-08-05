package com.Stalk.project.api.payment.dto.in;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TossPaymentCancelRequestDto {
    private String cancelReason;        // 취소 사유 (필수)
    private Integer cancelAmount;       // 취소 금액 (선택, 부분취소 시)
    private Integer refundableAmount;   // 환불 가능 금액 (선택)
    private String refundReceiveAccount; // 환불 계좌 (가상계좌 결제 시)
}