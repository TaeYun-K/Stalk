package com.Stalk.project.api.payment.dto.out;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationPaymentResponseDto {
    private Long reservationId;      // 예약 ID
    private String orderId;          // 주문번호
    private String paymentKey;       // 결제 키
    private String paymentStatus;    // 결제 상태
    private Integer amount;          // 결제 금액
    private String paymentMethod;    // 결제 수단
    private String consultationDate; // 상담 날짜
    private String consultationTime; // 상담 시간
    private String advisorName;      // 어드바이저 이름
    private String receiptUrl;       // 영수증 URL
    private String approvedAt;       // 결제 승인 시간
}