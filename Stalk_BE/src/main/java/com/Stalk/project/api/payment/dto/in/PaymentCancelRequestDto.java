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

    private String orderId;
    private String cancelReason;         // 취소 사유
    private Integer cancelAmount;        // 취소 금액 (null이면 전액 취소)
    private Integer refundableAmount;    // 환불 가능 금액 (토스 요구사항)

    @Builder.Default
    private String currency = "KRW";     // 통화 단위 (기본값 KRW)

    private Integer taxFreeAmount;       // 비과세 금액 (선택 사항)

    // 선택적으로 포함: paymentKey (실제 요청 시 path param으로만 쓸 경우 생략 가능)
    private String paymentKey;
}
