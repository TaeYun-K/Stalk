package com.Stalk.project.api.reservation.dto.out;

import com.Stalk.project.api.payment.dto.out.PaymentPrepareResponseDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentReservationResponseDto {

    @Schema(description = "생성된 예약 ID", example = "101")
    private Long reservationId;

    @Schema(description = "예약된 일시(ISO 8601)", example = "2025-07-20T15:00:00+09:00")
    private String scheduledTime;
    
    @Schema(description = "주문 ID (결제 추적용)", example = "CONSULT_20250720150000_1001_2")
    private String orderId;
    
    @Schema(description = "결제 금액", example = "50000")
    private Integer amount;
    
    @Schema(description = "토스페이먼츠 결제에 필요한 모든 정보")
    private PaymentPrepareResponseDto paymentData;
}