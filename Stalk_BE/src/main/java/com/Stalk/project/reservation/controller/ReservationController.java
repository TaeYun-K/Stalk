package com.Stalk.project.reservation.controller;

import com.Stalk.project.reservation.dto.in.ConsultationReservationRequestDto;
import com.Stalk.project.reservation.dto.out.ConsultationReservationResponseDto;
import com.Stalk.project.reservation.service.ReservationService;
import com.Stalk.project.response.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
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
}