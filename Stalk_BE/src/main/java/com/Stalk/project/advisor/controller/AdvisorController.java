package com.Stalk.project.advisor.controller;

import com.Stalk.project.advisor.dto.in.AdvisorListRequestDto;
import com.Stalk.project.advisor.dto.out.AdvisorDetailResponseDto;
import com.Stalk.project.advisor.dto.out.AdvisorResponseDto;
import com.Stalk.project.advisor.service.AdvisorService;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.util.CursorPage;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}