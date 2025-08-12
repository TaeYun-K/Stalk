package com.Stalk.project.api.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReservationDto {
    private Long id;
    private Long userId;
    private Long advisorId;
    private String date;
    private String startTime;
    private String endTime;
    private String requestMessage;
    private String orderId;
    private Integer amount;
    private String paymentStatus;
    private String paymentKey;
    private String paymentMethod;
    private String cardCompany;
    private String receiptUrl;
    private String status;
    // getter, setter, builder...
}