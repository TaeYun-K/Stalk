package com.Stalk.project.api.payment.dto.in;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentPrepareRequestDto {
    private Long advisorId;          // 어드바이저 ID
    private String consultationDate; // 상담 날짜 (YYYY-MM-DD)
    private String consultationTime; // 상담 시간 (HH:00)
    private String requestMessage;   // 상담 요청 메시지
}