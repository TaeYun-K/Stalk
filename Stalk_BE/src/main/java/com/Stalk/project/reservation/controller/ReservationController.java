package com.Stalk.project.reservation.controller;

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
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@Tag(name = "Reservation", description = "예약 관련 API")
@Slf4j
@RestController
@RequestMapping("/api/advisors/consult")
@RequiredArgsConstructor
public class ReservationController {

  private final ReservationService reservationService;

  @Operation(summary = "상담 예약하기", description = "전문가와의 상담을 예약합니다.")
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "예약 성공"),
      @ApiResponse(responseCode = "400", description = "유효하지 않은 날짜/시간 입력",
          content = @Content(schema = @Schema(implementation = BaseResponse.class))),
      @ApiResponse(responseCode = "409", description = "해당 전문가의 해당 시간대에 이미 예약 존재",
          content = @Content(schema = @Schema(implementation = BaseResponse.class))),
      @ApiResponse(responseCode = "500", description = "서버 오류 또는 DB 저장 실패",
          content = @Content(schema = @Schema(implementation = BaseResponse.class)))
  })
  @PostMapping("/reservations")
  public BaseResponse<ConsultationReservationResponseDto> createConsultationReservation(
      @Valid @RequestBody ConsultationReservationRequestDto requestDto) {

    log.info("상담 예약 요청: advisorUserId={}, date={}, time={}",
        requestDto.getAdvisorUserId(), requestDto.getDate(), requestDto.getTime());

    ConsultationReservationResponseDto result = reservationService.createConsultationReservation(
        requestDto);

    log.info("상담 예약 성공: reservationId={}", result.getReservationId());

    return new BaseResponse<>(result);
  }

  @GetMapping
  @Operation(summary = "예약 내역 조회", description = "현재 로그인한 사용자의 예약 내역을 조회합니다.")
  public BaseResponse<CursorPage<ReservationDetailResponseDto>> getReservationList(
                  @ModelAttribute PageRequestDto pageRequest) {

    // Mock 사용자 ID (실제로는 인증에서 가져와야 함)
    Long currentUserId = 1001L;

    CursorPage<ReservationDetailResponseDto> result =
                    reservationService.getReservationList(currentUserId, pageRequest);

    return new BaseResponse<>(result);
  }

  /**
   * 예약 취소
   */
  @PutMapping("/{reservationId}/cancel")
  @Operation(summary = "예약 취소", description = "예약을 취소합니다. (당일 취소 불가, PENDING 상태만 취소 가능)")
  @ApiResponses(value = {
                  @ApiResponse(responseCode = "200", description = "취소 성공"),
                  @ApiResponse(responseCode = "400", description = "잘못된 요청 (당일 취소, 이미 취소된 예약 등)"),
                  @ApiResponse(responseCode = "403", description = "취소 권한 없음"),
                  @ApiResponse(responseCode = "404", description = "예약을 찾을 수 없음")
  })
  public BaseResponse<ReservationCancelResponseDto> cancelReservation(
                  @PathVariable @Parameter(description = "취소할 예약 ID", example = "101") Long reservationId,
                  @RequestBody @Valid ReservationCancelRequestDto requestDto) {

    // TODO: 실제 구현 시에는 JWT에서 사용자 ID 추출
    Long currentUserId = 1001L; // Mock 사용자 ID

    ReservationCancelResponseDto
                    response = reservationService.cancelReservation(reservationId, currentUserId, requestDto);
    return new BaseResponse<>(response);
  }
}
