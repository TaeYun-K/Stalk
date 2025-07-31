package com.Stalk.project.advisor.controller;

import com.Stalk.project.advisor.dao.AdvisorMapper;
import com.Stalk.project.advisor.dto.in.AdvisorBlockedTimesRequestDto;
import com.Stalk.project.advisor.dto.in.AdvisorListRequestDto;
import com.Stalk.project.advisor.dto.out.AdvisorBlockedTimesResponseDto;
import com.Stalk.project.advisor.dto.out.AdvisorBlockedTimesUpdateResponseDto;
import com.Stalk.project.advisor.dto.out.AdvisorDetailResponseDto;
import com.Stalk.project.advisor.dto.out.AdvisorResponseDto;
import com.Stalk.project.advisor.dto.out.AvailableTimeSlotsResponseDto;
import com.Stalk.project.advisor.service.AdvisorService;
import com.Stalk.project.exception.BaseException;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.response.BaseResponseStatus;
import com.Stalk.project.util.CursorPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/advisors")
@RequiredArgsConstructor
public class AdvisorController {

  private final AdvisorService advisorService;
  private final AdvisorMapper advisorMapper;  // 새로 추가

  @GetMapping
  @Operation(summary = "어드바이저 목록 조회")
  public BaseResponse<CursorPage<AdvisorResponseDto>> getAdvisorList(
      AdvisorListRequestDto requestDto) {
    CursorPage<AdvisorResponseDto> result = advisorService.getAdvisorList(requestDto);
    return new BaseResponse<>(result); // 생성자 사용
  }

  /**
   * 어드바이저 상세 정보 조회
   */
  @GetMapping("/{advisorId}")
  public ResponseEntity<BaseResponse<AdvisorDetailResponseDto>> getAdvisorDetail(
      @PathVariable("advisorId") Long advisorId) {

    AdvisorDetailResponseDto result = advisorService.getAdvisorDetail(advisorId);
    return ResponseEntity.ok(new BaseResponse<>(result));
  }

  /**
   * 전문가 예약 가능 시간 조회
   */
  @GetMapping("/{advisor_id}/available-times")
  @Operation(summary = "전문가 예약 가능 시간 조회",
      description = "특정 날짜의 전문가 예약 가능한 시간대를 조회합니다.")
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "예약 가능 시간 조회 성공"),
      @ApiResponse(responseCode = "400", description = "잘못된 요청 (날짜 형식 오류 등)"),
      @ApiResponse(responseCode = "404", description = "존재하지 않는 전문가 ID"),
      @ApiResponse(responseCode = "500", description = "서버 내부 오류")
  })
  public BaseResponse<AvailableTimeSlotsResponseDto> getAvailableTimeSlots(
      @PathVariable("advisor_id") @Parameter(description = "전문가 ID", example = "42") Long advisorId,
      @RequestParam(value = "date", required = false)
      @Parameter(description = "조회할 날짜 (YYYY-MM-DD 형식)", example = "2025-07-24")
      @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date) {

    try {
      // 날짜가 없으면 오늘 날짜로 설정
      if (date == null) {
        date = LocalDate.now();
      }

      AvailableTimeSlotsResponseDto result = advisorService.getAvailableTimeSlots(advisorId, date);
      return new BaseResponse<>(result);

    } catch (BaseException exception) {
      return new BaseResponse<>(exception.getStatus());
    }
  }

  // AdvisorController.java에 추가할 엔드포인트들

  /**
   * 전문가 시간 차단 조회
   */
  @GetMapping("/blocked-times")
  @Operation(summary = "전문가 시간 차단 조회", description = "특정 날짜에 전문가가 차단한 시간 목록을 조회합니다.")
  public BaseResponse<AdvisorBlockedTimesResponseDto> getAdvisorBlockedTimes(
      @RequestParam @Parameter(description = "조회할 날짜 (YYYY-MM-DD)", example = "2025-07-30") String date,
      @RequestHeader("Authorization") String authorization) {

    // 토큰에서 사용자 정보 추출
    Long currentUserId = extractUserIdFromToken(authorization);

    // 사용자가 전문가인지 확인
    if (!isAdvisor(currentUserId)) {
      throw new BaseException(BaseResponseStatus.ADVISOR_ONLY_ACCESS);
    }

    // advisor_id = user_id 관계 활용
    Long advisorId = currentUserId;

    AdvisorBlockedTimesResponseDto result = advisorService.getAdvisorBlockedTimes(advisorId, date);
    return new BaseResponse<>(result);
  }

  /**
   * 전문가 시간 차단 업데이트
   */
  @PutMapping("/blocked-times")
  @Operation(summary = "전문가 시간 차단 업데이트", description = "특정 날짜의 전문가 시간 차단을 업데이트합니다.")
  public BaseResponse<AdvisorBlockedTimesUpdateResponseDto> updateAdvisorBlockedTimes(
      @RequestParam @Parameter(description = "업데이트할 날짜 (YYYY-MM-DD)", example = "2025-07-30") String date,
      @Valid @RequestBody AdvisorBlockedTimesRequestDto requestDto,
      @RequestHeader("Authorization") String authorization) {

    // 토큰에서 사용자 정보 추출
    Long currentUserId = extractUserIdFromToken(authorization);

    // 사용자가 전문가인지 확인
    if (!isAdvisor(currentUserId)) {
      throw new BaseException(BaseResponseStatus.ADVISOR_ONLY_ACCESS);
    }

    // advisor_id = user_id 관계 활용
    Long advisorId = currentUserId;

    AdvisorBlockedTimesUpdateResponseDto result = advisorService.updateAdvisorBlockedTimes(
        advisorId, date, requestDto);
    return new BaseResponse<>(result);
  }

  /**
   * 토큰에서 사용자 ID 추출
   */
  private Long extractUserIdFromToken(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new BaseException(BaseResponseStatus.INVALID_TOKEN);
    }

    String token = authorization.substring(7);
    String[] parts = token.split("_");

    // 토큰 형식: MOCK_TOKEN_{UUID}_{TYPE}_{USER_ID}_{ROLE} (6개 파트)
    if (parts.length != 6) {
      throw new BaseException(BaseResponseStatus.INVALID_TOKEN);
    }

    // parts[4]가 USER_ID
    return Long.parseLong(parts[4]);
  }

  /**
   * 사용자가 전문가인지 확인
   */
  private boolean isAdvisor(Long userId) {
    // 기존 구현된 로직 사용 또는 새로운 쿼리 작성
    return advisorMapper.isAdvisorExistsAndApproved(userId);
  }
}