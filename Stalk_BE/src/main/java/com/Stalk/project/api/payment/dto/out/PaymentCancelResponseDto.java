package com.Stalk.project.api.payment.dto.out;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCancelResponseDto {
    private String orderId;             // 주문번호
    private String paymentKey;          // 결제키
    private String cancelStatus;        // 취소 상태
    private Integer cancelAmount;       // 취소 금액
    private String cancelReason;        // 취소 사유
    private String canceledAt;          // 취소 시간
    private String message;             // 응답 메시지
}