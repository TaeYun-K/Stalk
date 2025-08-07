package com.Stalk.project.api.payment.controller;

import com.Stalk.project.api.reservation.dao.ReservationMapper;
import com.Stalk.project.global.config.TossPaymentConfig;
import com.Stalk.project.api.payment.dto.in.PaymentConfirmRequestDto;
import com.Stalk.project.api.payment.dto.in.PaymentPrepareRequestDto;
import com.Stalk.project.api.payment.dto.out.PaymentPrepareResponseDto;
import com.Stalk.project.api.payment.dto.out.TossPaymentResponseDto;
import com.Stalk.project.api.payment.service.PaymentService;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.global.response.BaseResponseStatus;
import com.Stalk.project.global.util.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import com.Stalk.project.api.payment.dto.in.PaymentCancelRequestDto;
import com.Stalk.project.api.payment.dto.out.PaymentCancelResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final ReservationMapper reservationMapper;
    private final PaymentService paymentService;

    /**
     * 간단한 연결 테스트 API
     */
    @GetMapping("/test")
    public BaseResponse<String> testConnection() {
        log.info("결제 API 연결 테스트 호출됨");
        return new BaseResponse<>("결제 API 연결 성공!");
    }

    /**
     * 결제 준비 API - JWT 토큰 인증 + USER 권한 체크
     */
    @PostMapping("/prepare")
    public BaseResponse<PaymentPrepareResponseDto> preparePayment(
        @RequestBody PaymentPrepareRequestDto requestDto) {

        log.info("결제 준비 요청: advisorId={}, date={}, time={}",
            requestDto.getAdvisorId(), requestDto.getConsultationDate(), requestDto.getConsultationTime());

        // 1. 일반 사용자(USER) 권한 체크
        if (!SecurityUtil.isCurrentUserRegularUser()) {
            log.warn("결제 준비 권한 없음: 일반 사용자만 결제 가능");
            return new BaseResponse<>(BaseResponseStatus.PAYMENT_ACCESS_DENIED);
        }

        // 2. 현재 사용자 ID 가져오기
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        log.info("결제 요청 사용자: userId={}", currentUserId);

        try {
            // PaymentService의 preparePayment 호출 (DB에 예약 생성)
            PaymentPrepareResponseDto response = paymentService.preparePayment(requestDto, currentUserId);

            log.info("결제 준비 응답: orderId={}, amount={}",
                response.getOrderId(), response.getAmount());

            return new BaseResponse<>(response);

        } catch (Exception e) {
            log.error("결제 준비 중 오류: userId={}, error={}", currentUserId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 🔥 중요: 프론트엔드에서 결제 성공 후 호출하는 결제 승인 API
     * JWT 토큰 인증 필요
     */
    @PostMapping("/confirm")
    public BaseResponse<TossPaymentResponseDto> confirmPayment(
        @RequestBody PaymentConfirmRequestDto requestDto) {

        System.out.println("🔥 결제 승인 API 호출됨!");

        log.info("결제 승인 요청: paymentKey={}, orderId={}, amount={}",
            requestDto.getPaymentKey(), requestDto.getOrderId(), requestDto.getAmount());

        // JWT 토큰에서 사용자 정보 추출
        Long userId = SecurityUtil.getCurrentUserPrimaryId();
        log.info("결제 승인 요청 사용자: userId={}", userId);

        try {
            // 토스페이먼츠에 결제 승인 요청 + DB 업데이트
            TossPaymentResponseDto response = paymentService.confirmPayment(requestDto);

            log.info("결제 승인 완료: orderId={}, status={}, userId={}",
                requestDto.getOrderId(), response.getStatus(), userId);

            return new BaseResponse<>(response);

        } catch (Exception e) {
            log.error("결제 승인 중 오류: orderId={}, userId={}, error={}",
                requestDto.getOrderId(), userId, e.getMessage(), e);

            // 🔥 추가: 결제 실패 시 예약 삭제 처리
            handlePaymentConfirmFailure(requestDto.getOrderId(), e);

            throw e;
        }
    }

    /**
     * 결제 승인 실패 시 예약 삭제 처리
     */
    private void handlePaymentConfirmFailure(String orderId, Exception e) {
        try {
            log.info("결제 승인 실패로 인한 예약 삭제 시작: orderId={}", orderId);

            // 주문 ID로 예약 ID 조회
            Long reservationId = reservationMapper.getReservationIdByOrderId(orderId);

            if (reservationId != null) {
                // 예약 삭제
                int deletedRows = reservationMapper.deleteReservation(reservationId);

                if (deletedRows > 0) {
                    log.info("결제 실패로 예약 삭제 완료: reservationId={}, orderId={}",
                        reservationId, orderId);
                } else {
                    log.warn("삭제할 예약을 찾을 수 없음: orderId={}", orderId);
                }
            } else {
                log.warn("주문 ID로 예약을 찾을 수 없음: orderId={}", orderId);
            }

        } catch (Exception deleteException) {
            log.error("예약 삭제 중 오류 발생: orderId={}", orderId, deleteException);
            // 삭제 실패해도 원래 예외를 그대로 던지도록 함
        }
    }

    /**
     * 결제 취소 API - JWT 토큰 인증 + USER 권한 체크
     */
    @PostMapping("/cancel/{orderId}")
    public BaseResponse<PaymentCancelResponseDto> cancelPayment(
        @PathVariable String orderId,
        @RequestBody PaymentCancelRequestDto requestDto) {

        log.info("결제 취소 요청: orderId={}, reason={}", orderId, requestDto.getCancelReason());

        // 1. 일반 사용자(USER) 권한 체크
        if (!SecurityUtil.isCurrentUserRegularUser()) {
            log.warn("결제 취소 권한 없음: 일반 사용자만 취소 가능");
            return new BaseResponse<>(BaseResponseStatus.PAYMENT_ACCESS_DENIED);
        }

        // 2. 현재 사용자 ID 가져오기
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        log.info("결제 취소 요청 사용자: userId={}", currentUserId);

        try {
            PaymentCancelResponseDto response = paymentService.cancelPayment(orderId, requestDto, currentUserId);

            log.info("결제 취소 완료: orderId={}, cancelStatus={}, userId={}",
                orderId, response.getCancelStatus(), currentUserId);

            return new BaseResponse<>(response);

        } catch (Exception e) {
            log.error("결제 취소 중 오류: orderId={}, userId={}, error={}",
                orderId, currentUserId, e.getMessage());
            throw e;
        }
    }
}