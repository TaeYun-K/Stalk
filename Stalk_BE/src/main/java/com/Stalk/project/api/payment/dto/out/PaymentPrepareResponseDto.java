package com.Stalk.project.api.payment.dto.out;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentPrepareResponseDto {
    private String orderId;          // 주문번호
    private String orderName;        // 주문명
    private Integer amount;          // 결제 금액
    private String customerEmail;    // 고객 이메일
    private String customerName;     // 고객 이름
    private String successUrl;       // 성공 URL
    private String failUrl;          // 실패 URL
    private String clientKey;        // 토스 클라이언트 키
    private Long reservationId;      // ⭐ 추가: 생성된 예약 ID
}