package com.Stalk.project.api.payment.dto.out;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TossPaymentResponseDto {
    private String paymentKey;
    private String orderId;
    private String orderName;
    private String status;           // READY, IN_PROGRESS, WAITING_FOR_DEPOSIT, DONE, CANCELED, PARTIAL_CANCELED, ABORTED, EXPIRED
    private Integer totalAmount;
    private Integer balanceAmount;
    private String method;           // 결제수단
    private String requestedAt;      // 결제 요청 시간
    private String approvedAt;       // 결제 승인 시간
    private String canceledAt;       // 결제 취소 시간 ⭐ 새로 추가
    private Integer cancelAmount;    // 취소 금액 ⭐ 새로 추가

    // 카드 정보
    private Card card;

    // 계좌이체 정보
    private Transfer transfer;

    // 간편결제 정보
    private EasyPay easyPay;

    // 영수증 정보
    private Receipt receipt;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Card {
        private String company;      // 카드사
        private String number;       // 카드번호 (마스킹)
        private String installmentPlanMonths; // 할부 개월 수
        private String approveNo;    // 승인번호
        private String useCardPoint; // 카드포인트 사용여부
        private String cardType;     // 카드 타입
        private String ownerType;    // 개인/법인
        private String acquireStatus; // 매입 상태
        private Boolean isInterestFree; // 무이자 여부
        private String interestPayer; // 무이자 제공주체
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Transfer {
        private String bankCode;     // 은행 코드
        private String settlementStatus; // 정산 상태
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EasyPay {
        private String provider;     // 간편결제 제공업체
        private Integer amount;      // 간편결제 금액
        private Integer discountAmount; // 간편결제 할인금액
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Receipt {
        private String url;          // 영수증 URL
    }
}