package com.Stalk.project.api.advisor.controller;

import com.Stalk.project.api.advisor.dto.in.AdvisorBlockedTimesRequestDto;
import com.Stalk.project.api.advisor.dto.in.AdvisorListRequestDto;
import com.Stalk.project.api.advisor.dto.in.AvailableTimeSlotsRequestDto;
import com.Stalk.project.api.advisor.dto.out.AdvisorBlockedTimesResponseDto;
import com.Stalk.project.api.advisor.dto.out.AdvisorBlockedTimesUpdateResponseDto;
import com.Stalk.project.api.advisor.dto.out.AdvisorDetailResponseDto;
import com.Stalk.project.api.advisor.dto.out.AdvisorResponseDto;
import com.Stalk.project.api.advisor.dto.out.AvailableTimeSlotsResponseDto;
import com.Stalk.project.api.advisor.service.AdvisorService;
import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.util.SecurityUtil;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.global.response.BaseResponseStatus;
import com.Stalk.project.global.util.CursorPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/advisors")
@RequiredArgsConstructor
@Tag(name = "Advisor", description = "어드바이저 관련 API")
public class AdvisorController {

  private final AdvisorService advisorService;

  // ============ Public APIs (인증 불필요) ============

  /**
   * 어드바이저 목록 조회 (Public API)
   */
  @GetMapping
  @Operation(summary = "어드바이저 목록 조회", description = "필터링과 페이징을 지원하는 어드바이저 목록을 조회합니다.")
  public BaseResponse<CursorPage<AdvisorResponseDto>> getAdvisorList(
      @ModelAttribute AdvisorListRequestDto requestDto) {
    CursorPage<AdvisorResponseDto> result = advisorService.getAdvisorList(requestDto);
    return new BaseResponse<>(result);
  }

  /**
   * 어드바이저 상세 정보 조회 (Public API)
   */
  @GetMapping("/{advisorId}")
  @Operation(summary = "어드바이저 상세 정보 조회", description = "특정 어드바이저의 상세 정보를 조회합니다.")
  public ResponseEntity<BaseResponse<AdvisorDetailResponseDto>> getAdvisorDetail(
      @PathVariable("advisorId") @Parameter(description = "어드바이저 ID") Long advisorId) {

    AdvisorDetailResponseDto result = advisorService.getAdvisorDetail(advisorId);
    return ResponseEntity.ok(new BaseResponse<>(result));
  }

  // ============ User-Only APIs (일반 사용자만) ============

  /**
   * 예약 가능 시간 조회 (일반 사용자만)
   */
  @GetMapping("/{advisor_id}/available-times")
  @Operation(
      summary = "예약 가능 시간 조회",
      description = "일반 사용자만 특정 전문가의 예약 가능한 시간대를 조회할 수 있습니다.",
      security = @SecurityRequirement(name = "Bearer Authentication")
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "예약 가능 시간 조회 성공"),
      @ApiResponse(responseCode = "400", description = "잘못된 요청 (날짜 형식 오류 등)"),
      @ApiResponse(responseCode = "401", description = "인증 필요"),
      @ApiResponse(responseCode = "403", description = "일반 사용자만 접근 가능"),
      @ApiResponse(responseCode = "404", description = "존재하지 않는 전문가 ID"),
  })
  public BaseResponse<AvailableTimeSlotsResponseDto> getAvailableTimeSlots(
      @PathVariable("advisor_id") @Parameter(description = "전문가 ID") Long advisorId,
      @ModelAttribute AvailableTimeSlotsRequestDto requestDto) {

    // 인증 확인
    if (!SecurityUtil.isAuthenticated()) {
      throw new BaseException(BaseResponseStatus.INVALID_USER_JWT);
    }

    // 일반 사용자만 접근 가능
    if (!SecurityUtil.isCurrentUserRegularUser()) {
      throw new BaseException(BaseResponseStatus.UNAUTHORIZED_ROLE);
    }

    // JWT에서 현재 사용자 역할 추출 (인증된 상태이므로 Required 버전 사용)
    String currentUserRole = SecurityUtil.getCurrentUserRoleRequired();

    AvailableTimeSlotsResponseDto result = advisorService.getAvailableTimeSlots(
        advisorId, currentUserRole, requestDto);
    return new BaseResponse<>(result);
  }

  // ============ Advisor-Only APIs (전문가만) ============

  /**
   * 전문가 차단 시간 조회 (전문가만)
   */
  @GetMapping("/blocked-times")
  @Operation(
      summary = "전문가 차단 시간 조회",
      description = "전문가만 자신의 특정 날짜 차단 시간 목록을 조회할 수 있습니다.",
      security = @SecurityRequirement(name = "Bearer Authentication")
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "차단 시간 조회 성공"),
      @ApiResponse(responseCode = "401", description = "인증 필요"),
      @ApiResponse(responseCode = "403", description = "전문가만 접근 가능")
  })
  public BaseResponse<AdvisorBlockedTimesResponseDto> getAdvisorBlockedTimes(
      @RequestParam @Parameter(description = "조회할 날짜 (YYYY-MM-DD)", example = "2025-07-30") String date) {

    // 인증 확인
    if (!SecurityUtil.isAuthenticated()) {
      throw new BaseException(BaseResponseStatus.INVALID_USER_JWT);
    }

    // 전문가만 접근 가능
    if (!SecurityUtil.isCurrentUserAdvisor()) {
      throw new BaseException(BaseResponseStatus.ADVISOR_ONLY_ACCESS);
    }

    // JWT에서 현재 사용자 정보 추출 (인증된 상태이므로 Required 버전 사용)
    Long currentUserId = SecurityUtil.getCurrentUserPrimaryIdRequired();

    AdvisorBlockedTimesResponseDto result = advisorService.getAdvisorBlockedTimes(currentUserId, date);
    return new BaseResponse<>(result);
  }

  /**
   * 전문가 차단 시간 업데이트 (전문가만)
   */
  @PutMapping("/blocked-times")
  @Operation(
      summary = "전문가 차단 시간 업데이트",
      description = "전문가만 자신의 특정 날짜 차단 시간을 업데이트할 수 있습니다.",
      security = @SecurityRequirement(name = "Bearer Authentication")
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "차단 시간 업데이트 성공"),
      @ApiResponse(responseCode = "401", description = "인증 필요"),
      @ApiResponse(responseCode = "403", description = "전문가만 접근 가능")
  })
  public BaseResponse<AdvisorBlockedTimesUpdateResponseDto> updateAdvisorBlockedTimes(
      @RequestParam @Parameter(description = "업데이트할 날짜 (YYYY-MM-DD)", example = "2025-07-30") String date,
      @Valid @RequestBody AdvisorBlockedTimesRequestDto requestDto) {

    // 인증 확인
    if (!SecurityUtil.isAuthenticated()) {
      throw new BaseException(BaseResponseStatus.INVALID_USER_JWT);
    }

    // 전문가만 접근 가능
    if (!SecurityUtil.isCurrentUserAdvisor()) {
      throw new BaseException(BaseResponseStatus.ADVISOR_ONLY_ACCESS);
    }

    // JWT에서 현재 사용자 정보 추출 (인증된 상태이므로 Required 버전 사용)
    Long currentUserId = SecurityUtil.getCurrentUserPrimaryIdRequired();

    AdvisorBlockedTimesUpdateResponseDto result = advisorService.updateAdvisorBlockedTimes(
        currentUserId, date, requestDto);
    return new BaseResponse<>(result);
  }
}