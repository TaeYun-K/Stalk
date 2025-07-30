package com.Stalk.project.reservation.controller;

import com.Stalk.project.auth.mock.util.TokenUtils;
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

  @Operation(
      summary = "상담 예약하기",
      description = """
          전문가와의 상담을 예약합니다.
          
          ### 🔐 인증 필요
          - Authorization 헤더에 Bearer 토큰 필요
          - 로그인 API에서 받은 accessToken 사용
          
          ### 📋 사용법
          1. `/api/auth/login`으로 로그인하여 accessToken 획득
          2. Authorization 헤더에 `Bearer {accessToken}` 설정
          3. 예약 정보와 함께 요청
          
          ### ⚠️ 제한사항
          - 본인 예약 불가 (일반 사용자만 전문가 예약 가능)
          - 과거/당일 예약 불가 (하루 전까지만)
          - 주말 예약 불가 (평일 09:00~20:00만)
          - 차단/예약된 시간 불가
          """,
      parameters = {
          @Parameter(
              name = "Authorization",
              description = "Bearer 토큰",
              required = true,
              example = "Bearer MOCK_TOKEN_a1b2c3d4_ACCESS_1001_USER"
          )
      }
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "예약 성공"),
      @ApiResponse(responseCode = "400", description = "유효하지 않은 날짜/시간 입력",
          content = @Content(schema = @Schema(implementation = BaseResponse.class))),
      @ApiResponse(responseCode = "401", description = "인증 실패 (토큰 없음/유효하지 않음)",
          content = @Content(schema = @Schema(implementation = BaseResponse.class))),
      @ApiResponse(responseCode = "409", description = "해당 전문가의 해당 시간대에 이미 예약 존재",
          content = @Content(schema = @Schema(implementation = BaseResponse.class))),
      @ApiResponse(responseCode = "500", description = "서버 오류 또는 DB 저장 실패",
          content = @Content(schema = @Schema(implementation = BaseResponse.class)))
  })
  @PostMapping("/reservations")
  public BaseResponse<ConsultationReservationResponseDto> createConsultationReservation(
      @RequestHeader("Authorization") String authorization,
      @Valid @RequestBody ConsultationReservationRequestDto requestDto) {

    // 토큰에서 사용자 ID 추출
    Long currentUserId = TokenUtils.extractUserId(authorization);

    log.info("상담 예약 요청: userId={}, advisorUserId={}, date={}, time={}",
        currentUserId, requestDto.getAdvisorUserId(), requestDto.getDate(), requestDto.getTime());

    // 기존 서비스 로직 호출 (currentUserId를 서비스 메서드에 전달하도록 수정 필요)
    ConsultationReservationResponseDto result = reservationService.createConsultationReservation(
        currentUserId, requestDto);

    log.info("상담 예약 성공: userId={}, reservationId={}", currentUserId, result.getReservationId());

    return new BaseResponse<>(result);
  }

  @GetMapping
  @Operation(
      summary = "예약 내역 조회",
      description = """
          현재 로그인한 사용자의 예약 내역을 조회합니다.
          
          ### 🔐 인증 필요
          - Authorization 헤더에 Bearer 토큰 필요
          
          ### 👥 사용자별 응답
          - **일반 사용자**: 본인이 예약한 상담 목록 (전문가 정보 포함)
          - **전문가**: 본인에게 들어온 예약 목록 (고객 정보 포함)
          
          ### 📄 페이징
          - CursorPage 형식으로 무한스크롤 지원
          - 최신순 정렬 (created_at DESC)
          """,
      parameters = {
          @Parameter(
              name = "Authorization",
              description = "Bearer 토큰",
              required = true,
              example = "Bearer MOCK_TOKEN_a1b2c3d4_ACCESS_1001_USER"
          )
      }
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "조회 성공"),
      @ApiResponse(responseCode = "401", description = "인증 실패 (토큰 없음/유효하지 않음)",
          content = @Content(schema = @Schema(implementation = BaseResponse.class)))
  })
  public BaseResponse<CursorPage<ReservationDetailResponseDto>> getReservationList(
      @RequestHeader("Authorization") String authorization,
      @ModelAttribute PageRequestDto pageRequest) {

    // 토큰에서 사용자 ID 추출
    Long currentUserId = TokenUtils.extractUserId(authorization);

    log.info("예약 내역 조회 요청: userId={}, pageNo={}", currentUserId, pageRequest.getPageNo());

    CursorPage<ReservationDetailResponseDto> result =
        reservationService.getReservationList(currentUserId, pageRequest);

    log.info("예약 내역 조회 성공: userId={}, count={}", currentUserId, result.getContent().size());

    return new BaseResponse<>(result);
  }

  @PutMapping("/{reservationId}/cancel")
  @Operation(
      summary = "예약 취소",
      description = """
          예약을 취소합니다.
          
          ### 🔐 인증 필요
          - Authorization 헤더에 Bearer 토큰 필요
          
          ### 📋 취소 조건
          - 본인이 관련된 예약만 취소 가능 (예약자 또는 전문가)
          - PENDING 상태 예약만 취소 가능
          - 당일 취소 불가 (전날까지만)
          
          ### 🔔 알림 생성
          - 취소 시 상대방에게 자동 알림 발송
          - 일반 사용자 취소 → 전문가에게 알림
          - 전문가 취소 → 일반 사용자에게 알림
          """,
      parameters = {
          @Parameter(
              name = "Authorization",
              description = "Bearer 토큰",
              required = true,
              example = "Bearer MOCK_TOKEN_a1b2c3d4_ACCESS_1001_USER"
          )
      }
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "취소 성공"),
      @ApiResponse(responseCode = "400", description = "잘못된 요청 (당일 취소, 이미 취소된 예약 등)"),
      @ApiResponse(responseCode = "401", description = "인증 실패 (토큰 없음/유효하지 않음)"),
      @ApiResponse(responseCode = "403", description = "취소 권한 없음"),
      @ApiResponse(responseCode = "404", description = "예약을 찾을 수 없음")
  })
  public BaseResponse<ReservationCancelResponseDto> cancelReservation(
      @RequestHeader("Authorization") String authorization,
      @PathVariable @Parameter(description = "취소할 예약 ID", example = "101") Long reservationId,
      @RequestBody @Valid ReservationCancelRequestDto requestDto) {

    // 토큰에서 사용자 ID 추출
    Long currentUserId = TokenUtils.extractUserId(authorization);

    log.info("예약 취소 요청: userId={}, reservationId={}, reason={}",
        currentUserId, reservationId, requestDto.getCancelReason());

    ReservationCancelResponseDto response =
        reservationService.cancelReservation(reservationId, currentUserId, requestDto);

    log.info("예약 취소 성공: userId={}, reservationId={}", currentUserId, reservationId);

    return new BaseResponse<>(response);
  }
}