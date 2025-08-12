package com.Stalk.project.api.payment.dto.out;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Builder
public class ConsultationSession {
    private Long id;
    private Long userId;          // 결제한 사용자 ID
    private Long advisorId;       // 전문가 ID
    private String orderId;       // 주문 ID
    private String paymentKey;    // 토스페이먼츠 결제키
    private Integer amount;       // 결제 금액
    private String status;        // 결제 상태 (PENDING, PAID, CANCELED)
    private LocalDate date;       // 상담 날짜
    private LocalTime startTime;  // 상담 시작 시간
    private String cancelReason;  // 취소 사유
    private LocalDateTime canceledAt; // 취소 시간
    private Long canceledBy;      // 취소한 사용자 ID
}