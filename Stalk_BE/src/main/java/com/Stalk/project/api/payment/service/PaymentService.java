package com.Stalk.project.api.payment.service;

import com.Stalk.project.api.payment.dto.in.PaymentCancelRequestDto;
import com.Stalk.project.api.payment.dto.out.PaymentCancelResponseDto;
import com.Stalk.project.global.config.TossPaymentConfig;
import com.Stalk.project.api.payment.dto.PaymentReservationDto;
import com.Stalk.project.api.payment.dto.UserInfoDto;
import com.Stalk.project.api.payment.dto.in.PaymentConfirmRequestDto;
import com.Stalk.project.api.payment.dto.in.PaymentPrepareRequestDto;
import com.Stalk.project.api.payment.dto.out.PaymentPrepareResponseDto;
import com.Stalk.project.api.payment.dto.out.TossPaymentResponseDto;
import com.Stalk.project.api.reservation.dao.ReservationMapper;
import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.response.BaseResponseStatus;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalTime;
import com.Stalk.project.api.payment.dto.in.TossPaymentCancelRequestDto;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final TossPaymentConfig tossPaymentConfig;
    private final RestTemplate restTemplate;
    private final ReservationMapper reservationMapper;

    /**
     * 결제 준비 - 주문번호 생성 및 결제 정보 준비
     */
    @Transactional
    public PaymentPrepareResponseDto preparePayment(PaymentPrepareRequestDto requestDto, Long currentUserId) {
        
        // 1. 어드바이저 존재 여부 확인
        if (!reservationMapper.isValidAdvisor(requestDto.getAdvisorId())) {
            throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND);
        }
        
        // 2. 예약 시간 중복 체크
        int conflictCount = reservationMapper.checkReservationConflict(
            requestDto.getAdvisorId(), 
            requestDto.getConsultationDate(), 
            requestDto.getConsultationTime()
        );
        
        if (conflictCount > 0) {
            throw new BaseException(BaseResponseStatus.TIME_SLOT_ALREADY_RESERVED);
        }
        
        // 3. 주문번호 생성
        String orderId = tossPaymentConfig.generateOrderId(currentUserId, requestDto.getAdvisorId());
        
        // 4. 어드바이저 및 사용자 정보 조회
        String advisorName = reservationMapper.getAdvisorNameById(requestDto.getAdvisorId());
        UserInfoDto userInfo = reservationMapper.getUserInfoById(currentUserId);
        
        // 5. 주문명 생성
        String orderName = String.format("%s 전문가 상담 예약 (%s %s)", 
            advisorName, requestDto.getConsultationDate(), requestDto.getConsultationTime());
        
        // 6. 예약 정보를 PENDING 상태로 DB에 저장
        PaymentReservationDto reservationDto = PaymentReservationDto.builder()
                .userId(currentUserId)
                .advisorId(requestDto.getAdvisorId())
                .date(requestDto.getConsultationDate())
                .startTime(requestDto.getConsultationTime())
                .endTime(calculateEndTime(requestDto.getConsultationTime()))
                .requestMessage(requestDto.getRequestMessage())
                .orderId(orderId)
                .amount(tossPaymentConfig.getDefaultConsultationFee())
                .paymentStatus("PENDING")
                .status("PENDING")
                .build();
        
        Long reservationId = reservationMapper.createPendingReservation(reservationDto);
        
        log.info("결제 대기 예약 생성 완료: reservationId={}, orderId={}", reservationId, orderId);
        
        return PaymentPrepareResponseDto.builder()
                .orderId(orderId)
                .orderName(orderName)
                .amount(tossPaymentConfig.getDefaultConsultationFee())
                .customerName(userInfo.getName())
                .customerEmail(userInfo.getEmail())
                .successUrl(tossPaymentConfig.getSuccessUrl())
                .failUrl(tossPaymentConfig.getFailUrl())
                .clientKey(tossPaymentConfig.getTestClientApiKey())
                .build();
    }

    /**
     * 토스페이먼츠 결제 승인 처리
     */
    @Transactional
    public TossPaymentResponseDto confirmPayment(PaymentConfirmRequestDto requestDto) {
        try {
            log.info("결제 승인 요청 시작: paymentKey={}, orderId={}, amount={}", 
                requestDto.getPaymentKey(), requestDto.getOrderId(), requestDto.getAmount());
            
            // 1. 예약 정보 존재 여부 확인
            PaymentReservationDto reservation = reservationMapper.findReservationByOrderId(requestDto.getOrderId());
            if (reservation == null) {
                throw new BaseException(BaseResponseStatus.RESERVATION_NOT_FOUND);
            }
            
            // 2. 토스페이먼츠에 결제 승인 요청
            TossPaymentResponseDto tossResponse = requestPaymentConfirm(requestDto);
            
            log.info("토스페이먼츠 결제 승인 응답: status={}, method={}, approvedAt={}", 
                tossResponse.getStatus(), tossResponse.getMethod(), tossResponse.getApprovedAt());
            
            // 3. 결제 승인 성공 시 DB 업데이트
            if ("DONE".equals(tossResponse.getStatus())) {
                updatePaymentSuccess(requestDto.getOrderId(), tossResponse);
                log.info("결제 승인 성공 - DB 업데이트 완료: orderId={}", requestDto.getOrderId());
            } else {
                updatePaymentFailure(requestDto.getOrderId(), "PAYMENT_NOT_COMPLETED", tossResponse.getStatus());
                log.warn("결제 승인 실패: status={}", tossResponse.getStatus());
                throw new BaseException(BaseResponseStatus.PAYMENT_CONFIRM_FAILED);
            }
            
            return tossResponse;
            
        } catch (Exception e) {
            // 결제 실패 시 DB 업데이트
            updatePaymentFailure(requestDto.getOrderId(), "PAYMENT_CONFIRM_ERROR", e.getMessage());
            log.error("결제 승인 중 오류 발생: orderId={}", requestDto.getOrderId(), e);
            throw new BaseException(BaseResponseStatus.PAYMENT_CONFIRM_FAILED);
        }
    }

    /**
     * 토스페이먼츠 결제 승인 API 호출
     */
    private TossPaymentResponseDto requestPaymentConfirm(PaymentConfirmRequestDto requestDto) {
        // HTTP 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", tossPaymentConfig.getAuthorizationHeader());
        
        log.info("토스페이먼츠 API 호출 - URL: {}", TossPaymentConfig.CONFIRM_URL);
        
        // 요청 엔티티 생성
        HttpEntity<PaymentConfirmRequestDto> entity = new HttpEntity<>(requestDto, headers);
        
        try {
            // API 호출
            ResponseEntity<TossPaymentResponseDto> response = restTemplate.exchange(
                TossPaymentConfig.CONFIRM_URL,
                HttpMethod.POST,
                entity,
                TossPaymentResponseDto.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            } else {
                log.error("토스페이먼츠 API 응답 오류: status={}, body={}", 
                    response.getStatusCode(), response.getBody());
                throw new BaseException(BaseResponseStatus.PAYMENT_CONFIRM_FAILED);
            }
            
        } catch (Exception e) {
            log.error("토스페이먼츠 API 호출 실패", e);
            throw new BaseException(BaseResponseStatus.PAYMENT_CONFIRM_FAILED);
        }
    }

    /**
     * 결제 성공 시 DB 업데이트
     */
    private void updatePaymentSuccess(String orderId, TossPaymentResponseDto tossResponse) {
        String paymentMethod = tossResponse.getMethod();
        String cardCompany = null;
        String receiptUrl = null;
        
        // 카드 결제인 경우 카드사 정보 추출
        if ("카드".equals(paymentMethod) && tossResponse.getCard() != null) {
            cardCompany = tossResponse.getCard().getCompany();
        }
        
        // 영수증 URL 추출
        if (tossResponse.getReceipt() != null) {
            receiptUrl = tossResponse.getReceipt().getUrl();
        }
        
        int updateCount = reservationMapper.updateReservationPaymentSuccess(
            orderId, 
            tossResponse.getPaymentKey(),
            paymentMethod,
            cardCompany,
            receiptUrl,
            tossResponse.getApprovedAt()
        );
        
        if (updateCount == 0) {
            log.error("결제 성공 DB 업데이트 실패: orderId={}", orderId);
            throw new BaseException(BaseResponseStatus.PAYMENT_CONFIRM_FAILED);
        }
    }

    /**
     * 결제 실패 시 DB 업데이트
     */
    private void updatePaymentFailure(String orderId, String failureCode, String failureReason) {
        int updateCount = reservationMapper.updateReservationPaymentFailure(
            orderId, failureCode, failureReason
        );
        
        if (updateCount == 0) {
            log.warn("결제 실패 DB 업데이트 실패: orderId={}", orderId);
        }
    }

    /**
     * 결제 취소 처리
     */
    @Transactional
    public PaymentCancelResponseDto cancelPayment(String orderId, PaymentCancelRequestDto requestDto) {
        try {
            log.info("결제 취소 요청 시작: orderId={}, reason={}", orderId, requestDto.getCancelReason());
            
            // 1. 예약 정보 조회
            PaymentReservationDto reservation = reservationMapper.findReservationByOrderId(orderId);
            if (reservation == null) {
                throw new BaseException(BaseResponseStatus.RESERVATION_NOT_FOUND);
            }
            
            // 2. 결제 상태 확인 (PAID 상태만 취소 가능)
            if (!"PAID".equals(reservation.getPaymentStatus())) {
                throw new BaseException(BaseResponseStatus.PAYMENT_ALREADY_PROCESSED);
            }
            
            // 3. 토스페이먼츠에 결제 취소 요청
            TossPaymentResponseDto tossResponse = requestPaymentCancel(
                reservation.getPaymentKey(), 
                requestDto, 
                reservation.getAmount()
            );
            
            log.info("토스페이먼츠 결제 취소 응답: status={}, canceledAt={}", 
                tossResponse.getStatus(), tossResponse.getApprovedAt());
            
            // 4. 취소 성공 시 DB 업데이트
            if ("CANCELED".equals(tossResponse.getStatus()) || "PARTIAL_CANCELED".equals(tossResponse.getStatus())) {
                updatePaymentCancellation(orderId, requestDto, tossResponse);
                log.info("결제 취소 성공 - DB 업데이트 완료: orderId={}", orderId);
            } else {
                log.warn("결제 취소 실패: status={}", tossResponse.getStatus());
                throw new BaseException(BaseResponseStatus.PAYMENT_CANCEL_FAILED);
            }
            
            return PaymentCancelResponseDto.builder()
                    .orderId(orderId)
                    .paymentKey(reservation.getPaymentKey())
                    .cancelStatus(tossResponse.getStatus())
                    .cancelAmount(requestDto.getCancelAmount() != null ? requestDto.getCancelAmount() : reservation.getAmount())
                    .cancelReason(requestDto.getCancelReason())
                    .canceledAt(tossResponse.getApprovedAt())
                    .message("결제가 성공적으로 취소되었습니다.")
                    .build();
            
        } catch (Exception e) {
            log.error("결제 취소 중 오류 발생: orderId={}", orderId, e);
            if (e instanceof BaseException) {
                throw e;
            }
            throw new BaseException(BaseResponseStatus.PAYMENT_CANCEL_FAILED);
        }
    }

    /**
     * 종료 시간 계산 (시작 시간 + 1시간)
     */
    private String calculateEndTime(String startTime) {
        LocalTime start = LocalTime.parse(startTime, DateTimeFormatter.ofPattern("HH:mm"));
        LocalTime end = start.plusHours(1);
        return end.format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    /**
     * 토스페이먼츠 결제 취소 API 호출
     */
    private TossPaymentResponseDto requestPaymentCancel(String paymentKey, PaymentCancelRequestDto requestDto, Integer originalAmount) {
        // HTTP 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", tossPaymentConfig.getAuthorizationHeader());
        
        // 토스 API 요청 데이터 생성
        TossPaymentCancelRequestDto tossRequest = TossPaymentCancelRequestDto.builder()
                .cancelReason(requestDto.getCancelReason())
                .cancelAmount(requestDto.getCancelAmount()) // null이면 전액 취소
                .refundableAmount(requestDto.getRefundableAmount())
                .build();
        
        // 요청 URL: https://api.tosspayments.com/v1/payments/{paymentKey}/cancel
        String cancelUrl = TossPaymentConfig.CANCEL_URL + paymentKey + "/cancel";
        
        log.info("토스페이먼츠 취소 API 호출 - URL: {}, paymentKey: {}", cancelUrl, paymentKey);
        
        // 요청 엔티티 생성
        HttpEntity<TossPaymentCancelRequestDto> entity = new HttpEntity<>(tossRequest, headers);
        
        try {
            // API 호출
            ResponseEntity<TossPaymentResponseDto> response = restTemplate.exchange(
                cancelUrl,
                HttpMethod.POST,
                entity,
                TossPaymentResponseDto.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            } else {
                log.error("토스페이먼츠 취소 API 응답 오류: status={}, body={}", 
                    response.getStatusCode(), response.getBody());
                throw new BaseException(BaseResponseStatus.PAYMENT_CANCEL_FAILED);
            }
            
        } catch (Exception e) {
            log.error("토스페이먼츠 취소 API 호출 실패", e);
            throw new BaseException(BaseResponseStatus.PAYMENT_CANCEL_FAILED);
        }
    }

    /**
     * 결제 취소 시 DB 업데이트
     */
    private void updatePaymentCancellation(String orderId, PaymentCancelRequestDto requestDto, TossPaymentResponseDto tossResponse) {
        int updateCount = reservationMapper.updateReservationPaymentCancellation(
            orderId,
            requestDto.getCancelReason(),
            tossResponse.getApprovedAt() // 취소 승인 시간
        );
        
        if (updateCount == 0) {
            log.error("결제 취소 DB 업데이트 실패: orderId={}", orderId);
            throw new BaseException(BaseResponseStatus.PAYMENT_CANCEL_FAILED);
        }
    }
}