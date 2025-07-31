package com.Stalk.project.reservation.controller;

import com.Stalk.project.login.util.SecurityUtil;
import com.Stalk.project.reservation.dto.in.ConsultationReservationRequestDto;
import com.Stalk.project.reservation.dto.in.ReservationCancelRequestDto;
import com.Stalk.project.reservation.dto.out.ConsultationReservationResponseDto;
import com.Stalk.project.reservation.dto.out.ReservationCancelResponseDto;
import com.Stalk.project.reservation.dto.out.ReservationDetailResponseDto;
import com.Stalk.project.reservation.service.ReservationService;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.util.CursorPage;
import com.Stalk.project.util.PageRequestDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Reservation", description = "예약 관련 API")
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping("/advisors/consult/reservations")
    @Operation(summary = "상담 예약 생성", description = "일반 사용자만 전문가와의 상담 예약을 생성할 수 있습니다.")
    public BaseResponse<ConsultationReservationResponseDto> createReservation(
            @Valid @RequestBody ConsultationReservationRequestDto requestDto) {
        
        // JWT에서 현재 사용자 정보 추출 (users.id + role)
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        String currentUserRole = SecurityUtil.getCurrentUserRole();
        
        ConsultationReservationResponseDto result = reservationService.createConsultationReservation(
            currentUserId, currentUserRole, requestDto);
        return new BaseResponse<>(result);
    }

    @GetMapping("/reservations")
    @Operation(summary = "예약 내역 조회", description = "현재 로그인한 사용자의 예약 내역을 조회합니다.")
    public BaseResponse<CursorPage<ReservationDetailResponseDto>> getReservationList(
            @ModelAttribute PageRequestDto pageRequest) {
        
        // JWT에서 현재 사용자 ID 추출 (users.id)
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        
        CursorPage<ReservationDetailResponseDto> result = reservationService.getReservationList(
            currentUserId, pageRequest);
        return new BaseResponse<>(result);
    }

    @PutMapping("/reservations/{reservationId}/cancel")
    @Operation(summary = "예약 취소", description = "예약을 취소하고 상대방에게 알림을 발송합니다.")
    public BaseResponse<ReservationCancelResponseDto> cancelReservation(
            @PathVariable Long reservationId,
            @Valid @RequestBody ReservationCancelRequestDto requestDto) {
        
        // JWT에서 현재 사용자 ID 추출 (users.id)
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        
        ReservationCancelResponseDto result = reservationService.cancelReservation(
            reservationId, currentUserId, requestDto);
        return new BaseResponse<>(result);
    }
}