package com.Stalk.project.api.payment.controller;

import com.Stalk.project.global.config.TossPaymentConfig;
import com.Stalk.project.api.payment.dto.in.PaymentConfirmRequestDto;
import com.Stalk.project.api.payment.dto.in.PaymentPrepareRequestDto;
import com.Stalk.project.api.payment.dto.out.PaymentPrepareResponseDto;
import com.Stalk.project.api.payment.dto.out.TossPaymentResponseDto;
import com.Stalk.project.api.payment.service.PaymentService;
import com.Stalk.project.global.response.BaseResponse;
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

    private final TossPaymentConfig tossPaymentConfig;
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
     * 결제 준비 API - 실제 DB 연동
     */
    @PostMapping("/prepare")
    public BaseResponse<PaymentPrepareResponseDto> preparePayment(
            @RequestBody PaymentPrepareRequestDto requestDto) {
        
        log.info("결제 준비 요청: advisorId={}, date={}, time={}", 
            requestDto.getAdvisorId(), requestDto.getConsultationDate(), requestDto.getConsultationTime());
        
        // 현재 사용자 ID (임시로 1001 사용, 실제로는 SecurityUtil에서 가져오기)
        Long currentUserId = 1001L; // TODO: SecurityUtil.getCurrentUserPrimaryId()
        
        try {
            // PaymentService의 preparePayment 호출 (DB에 예약 생성)
            PaymentPrepareResponseDto response = paymentService.preparePayment(requestDto, currentUserId);
            
            log.info("결제 준비 응답: orderId={}, amount={}", 
                response.getOrderId(), response.getAmount());
            
            return new BaseResponse<>(response);
            
        } catch (Exception e) {
            log.error("결제 준비 중 오류: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 결제 성공 콜백 - 실제 결제 승인 처리
     */
    @GetMapping("/toss/success")
    public String paymentSuccess(
            @RequestParam String paymentKey,
            @RequestParam String orderId,
            @RequestParam Integer amount) {
        
        log.info("결제 성공 콜백: paymentKey={}, orderId={}, amount={}", 
            paymentKey, orderId, amount);
        
        try {
            // 토스페이먼츠에 결제 승인 요청
            PaymentConfirmRequestDto confirmRequest = PaymentConfirmRequestDto.builder()
                    .paymentKey(paymentKey)
                    .orderId(orderId)
                    .amount(amount)
                    .build();
            
            TossPaymentResponseDto tossResponse = paymentService.confirmPayment(confirmRequest);
            
            // 결제 승인 성공
            String paymentMethod = getPaymentMethodDisplay(tossResponse);
            String approvedAt = tossResponse.getApprovedAt();
            
            log.info("결제 승인 완료: orderId={}, status={}, method={}", 
                orderId, tossResponse.getStatus(), paymentMethod);
            
            // 성공 페이지 반환 (더 자세한 정보 포함)
            return String.format("""
                <html>
                <head>
                    <title>결제 성공</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .success { color: #28a745; }
                        .info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
                        .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <h1 class="success">✅ 결제 성공!</h1>
                    <div class="info">
                        <p><strong>주문번호:</strong> %s</p>
                        <p><strong>결제키:</strong> %s</p>
                        <p><strong>결제금액:</strong> %,d원</p>
                        <p><strong>결제수단:</strong> %s</p>
                        <p><strong>결제상태:</strong> %s</p>
                        <p><strong>승인시간:</strong> %s</p>
                    </div>
                    <a href="/payment-test.html" class="btn">다시 테스트하기</a>
                    <script>
                        // 5초 후 자동으로 테스트 페이지로 이동
                        setTimeout(() => {
                            window.location.href = '/payment-test.html';
                        }, 5000);
                    </script>
                </body>
                </html>
                """, orderId, paymentKey, amount, paymentMethod, tossResponse.getStatus(), approvedAt);
                
        } catch (Exception e) {
            log.error("결제 승인 처리 중 오류: orderId={}", orderId, e);
            
            // 실패 페이지로 리다이렉트
            return String.format("""
                <html>
                <head><title>결제 승인 실패</title></head>
                <body>
                    <h1 style="color: red;">❌ 결제 승인 실패</h1>
                    <p>주문번호: %s</p>
                    <p>오류: 결제 승인 처리 중 문제가 발생했습니다.</p>
                    <a href="/payment-test.html">다시 시도하기</a>
                </body>
                </html>
                """, orderId);
        }
    }

    /**
     * 결제 수단 표시명 변환
     */
    private String getPaymentMethodDisplay(TossPaymentResponseDto response) {
        String method = response.getMethod();
        if (method == null) return "알 수 없음";
        
        return switch (method) {
            case "카드" -> {
                if (response.getCard() != null) {
                    yield response.getCard().getCompany() + " 카드";
                }
                yield "카드";
            }
            case "간편결제" -> {
                if (response.getEasyPay() != null) {
                    yield response.getEasyPay().getProvider() + " 간편결제";
                }
                yield "간편결제";
            }
            case "계좌이체" -> "계좌이체";
            default -> method;
        };
    }

    /**
     * 결제 실패 콜백 (임시)
     */
    @GetMapping("/toss/fail")
    public String paymentFail(
            @RequestParam String code,
            @RequestParam String message,
            @RequestParam String orderId) {
        
        log.warn("결제 실패 콜백: code={}, message={}, orderId={}", code, message, orderId);
        
        // 임시로 간단한 실패 페이지 반환
        return String.format("""
            <html>
            <head><title>결제 실패</title></head>
            <body>
                <h1>❌ 결제 실패</h1>
                <p>주문번호: %s</p>
                <p>에러코드: %s</p>
                <p>에러메시지: %s</p>
                <a href="/payment-test.html">다시 시도하기</a>
            </body>
            </html>
            """, orderId, code, message);
    }

    /**
     * 결제 취소 API
     */
    @PostMapping("/cancel/{orderId}")
    public BaseResponse<PaymentCancelResponseDto> cancelPayment(
            @PathVariable String orderId,
            @RequestBody PaymentCancelRequestDto requestDto) {
        
        log.info("결제 취소 요청: orderId={}, reason={}", orderId, requestDto.getCancelReason());
        
        try {
            PaymentCancelResponseDto response = paymentService.cancelPayment(orderId, requestDto);
            
            log.info("결제 취소 완료: orderId={}, cancelStatus={}", 
                orderId, response.getCancelStatus());
            
            return new BaseResponse<>(response);
            
        } catch (Exception e) {
            log.error("결제 취소 중 오류: orderId={}, error={}", orderId, e.getMessage());
            throw e;
        }
    }

    /**
     * 어드바이저 이름 가져오기 (임시)
     */
    private String getAdvisorName(Long advisorId) {
        return switch (advisorId.intValue()) {
            case 1 -> "이수진";
            case 2 -> "박민수";
            case 3 -> "김영희";
            default -> "전문가";
        };
    }
}