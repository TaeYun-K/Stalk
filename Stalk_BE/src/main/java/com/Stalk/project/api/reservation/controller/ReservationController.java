package com.Stalk.project.api.reservation.controller;

import com.Stalk.project.api.payment.dto.in.PaymentCancelRequestDto;
import com.Stalk.project.api.reservation.dao.ReservationMapper;
import com.Stalk.project.api.reservation.dto.in.PaymentReservationRequestDto;
import com.Stalk.project.api.reservation.dto.in.ReservationCancelRequestDto;
import com.Stalk.project.api.reservation.dto.out.PaymentReservationResponseDto;
import com.Stalk.project.api.reservation.dto.out.ReservationCancelResponseDto;
import com.Stalk.project.api.reservation.dto.out.ReservationDetailResponseDto;
import com.Stalk.project.api.reservation.service.ReservationService;
import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.global.response.BaseResponseStatus;
import com.Stalk.project.global.util.CursorPage;
import com.Stalk.project.global.util.PageRequestDto;
import com.Stalk.project.global.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reservation", description = "예약 관련 API")
public class ReservationController {

    private final ReservationService reservationService;
    private final ReservationMapper  reservationMapper;


    /**
     * 예약 내역 조회 API (SecurityUtil 기반)
     */
    @GetMapping("/reservations")
    @Operation(summary = "예약 내역 조회",
        description = "현재 로그인한 사용자의 예약 내역을 조회합니다. (전문가/일반 사용자 구분)")
    public BaseResponse<CursorPage<ReservationDetailResponseDto>> getReservationList(
        @Parameter(description = "페이지 요청 정보") PageRequestDto pageRequest) {

        log.info("예약 내역 조회 요청: pageNo={}, pageSize={}",
            pageRequest.getPageNo(), pageRequest.getPageSize());

        CursorPage<ReservationDetailResponseDto> response =
            reservationService.getReservationList(pageRequest);

        return new BaseResponse<>(response);
    }

    /**
     * 결제를 포함한 상담 예약 생성
     */
    @PostMapping("/reservations/with-payment")
    @Operation(summary = "결제를 포함한 상담 예약 생성", description = "전문가와의 상담 예약을 생성하고 토스페이먼츠 결제 정보를 반환합니다.")
    @ApiResponse(responseCode = "200", description = "예약 생성 성공")
    @ApiResponse(responseCode = "400", description = "잘못된 요청")
    @ApiResponse(responseCode = "403", description = "권한 없음")
    public BaseResponse<PaymentReservationResponseDto> createReservationWithPayment(
        @Valid @RequestBody PaymentReservationRequestDto requestDto) {

        PaymentReservationResponseDto response = reservationService.createReservationWithPayment(requestDto);
        return new BaseResponse<>(response);
    }

    /**
     * 이미 결제 완료한 예약에 대한 예약 취소 API (SecurityUtil 기반)
     */
    @PutMapping("/reservations/{reservationId}/cancel")
    @Operation(summary = "예약 취소", description = "예약을 취소하고 상대방에게 알림을 발송합니다.")
    public BaseResponse<ReservationCancelResponseDto> cancelReservation(
        @Parameter(description = "예약 ID") @PathVariable Long reservationId,
        @Valid @RequestBody ReservationCancelRequestDto requestDto) {

        log.info("예약 취소 요청: reservationId={}, cancelReason={}",
            reservationId, requestDto.getCancelReason());

        ReservationCancelResponseDto response =
            reservationService.cancelReservation(reservationId, requestDto);

        return new BaseResponse<>(response);
    }

    /**
     * 프론트엔드에서 결제 취소/이탈 시 예약 정보를 DB에서 제거하기 위한 API
     * 결제 중 뒤로가기, 창 닫기, 취소 버튼 등으로 이탈한 경우
     */
    @PostMapping("/cancel")
    public BaseResponse<Void> cancelPaymentReservation(
        @RequestBody PaymentCancelRequestDto requestDto) {

        log.info("결제 취소/이탈로 인한 예약 삭제 요청: orderId={}", requestDto.getOrderId());

        Long userId = SecurityUtil.getCurrentUserPrimaryId();

        try {
            // 주문 ID로 예약 조회
            Long reservationId = reservationMapper.getReservationIdByOrderId(requestDto.getOrderId());

            if (reservationId != null) {
                // 해당 사용자의 예약인지 확인 + PENDING 상태인지 확인
                boolean isValidForCancel = reservationMapper.isValidPendingReservation(reservationId, userId);

                if (isValidForCancel) {
                    int deletedRows = reservationMapper.deleteReservation(reservationId);

                    if (deletedRows > 0) {
                        log.info("결제 취소로 예약 삭제 완료: reservationId={}, orderId={}, userId={}",
                            reservationId, requestDto.getOrderId(), userId);
                    } else {
                        log.warn("삭제할 예약을 찾을 수 없음: orderId={}", requestDto.getOrderId());
                    }
                } else {
                    log.warn("취소할 수 없는 예약: reservationId={}, userId={}", reservationId, userId);
                    throw new BaseException(BaseResponseStatus.RESERVATION_NOT_CANCELABLE);
                }
            } else {
                log.warn("주문 ID로 예약을 찾을 수 없음: orderId={}", requestDto.getOrderId());
            }

            return new BaseResponse<>();

        } catch (BaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("예약 삭제 중 오류: orderId={}, userId={}", requestDto.getOrderId(), userId, e);
            throw new BaseException(BaseResponseStatus.CANCEL_REQUEST_FAILED);
        }
    }
}