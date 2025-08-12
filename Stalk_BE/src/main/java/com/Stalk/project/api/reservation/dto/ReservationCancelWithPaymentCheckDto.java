package com.Stalk.project.api.reservation.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ReservationCancelWithPaymentCheckDto {
    private Long id;
    private Long userId;
    private Long advisorId;
    private LocalDate date;
    private LocalTime startTime;
    private String status;
    private String paymentStatus;  // 결제 상태 추가
    private String paymentKey;     // 결제키 추가
    private Integer amount;        // 결제 금액 추가
    private String advisorName;
    private String clientName;
    private String orderId;
}