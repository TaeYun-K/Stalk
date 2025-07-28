package com.Stalk.project.advisor.controller;

import com.Stalk.project.advisor.dto.in.AdvisorListRequestDto;
import com.Stalk.project.advisor.dto.out.AdvisorDetailResponseDto;
import com.Stalk.project.advisor.dto.out.AdvisorResponseDto;
import com.Stalk.project.advisor.dto.out.AvailableTimeSlotsResponseDto;
import com.Stalk.project.advisor.service.AdvisorService;
import com.Stalk.project.exception.BaseException;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.util.CursorPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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

    @GetMapping
    @Operation(summary = "어드바이저 목록 조회")
    public BaseResponse<CursorPage<AdvisorResponseDto>> getAdvisorList(AdvisorListRequestDto requestDto) {
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
}