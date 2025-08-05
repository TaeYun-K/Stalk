package com.Stalk.project.api.payment.dto.in;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentConfirmRequestDto {
    private String paymentKey;   // 토스에서 발급한 결제 키
    private String orderId;      // 주문번호
    private Integer amount;      // 결제 금액
}