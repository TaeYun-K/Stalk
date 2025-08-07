package com.Stalk.project.api.reservation.controller;

import com.Stalk.project.api.reservation.dto.in.PaymentReservationRequestDto;
import com.Stalk.project.api.reservation.dto.in.ReservationCancelRequestDto;
import com.Stalk.project.api.reservation.dto.out.PaymentReservationResponseDto;
import com.Stalk.project.api.reservation.dto.out.ReservationCancelResponseDto;
import com.Stalk.project.api.reservation.dto.out.ReservationDetailResponseDto;
import com.Stalk.project.api.reservation.service.ReservationService;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.global.util.CursorPage;
import com.Stalk.project.global.util.PageRequestDto;
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
     * 예약 취소 API (SecurityUtil 기반)
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
}