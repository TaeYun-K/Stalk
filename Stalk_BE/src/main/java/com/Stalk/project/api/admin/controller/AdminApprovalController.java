package com.Stalk.project.api.admin.controller;

import com.Stalk.project.api.admin.dto.in.ApprovalActionRequestDto;
import com.Stalk.project.api.admin.dto.in.ApprovalRequestListDto;
import com.Stalk.project.api.admin.dto.in.AdvisorApprovalRequestDto;
import com.Stalk.project.api.admin.dto.out.ApprovalActionResponseDto;
import com.Stalk.project.api.admin.service.AdminApprovalService;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.global.util.CursorPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/admin/advisor-requests")
@RequiredArgsConstructor
@Tag(name = "관리자 - 전문가 인증 관리", description = "관리자가 전문가 인증 요청을 조회/승인/거절하는 API")
public class AdminApprovalController {
    
    private final AdminApprovalService adminApprovalService;
    
    @GetMapping
    @Operation(summary = "전문가 인증 요청 목록 조회", description = "관리자가 전문가 인증 요청 목록을 조회합니다.")
    public BaseResponse<CursorPage<AdvisorApprovalRequestDto>> getApprovalRequests(
            @ModelAttribute ApprovalRequestListDto requestDto) {
        
        log.info("전문가 인증 요청 목록 조회: status={}, pageNo={}, pageSize={}", 
                requestDto.getStatus(), requestDto.getPageNo(), requestDto.getPageSize());
        
        CursorPage<AdvisorApprovalRequestDto> result = adminApprovalService.getApprovalRequests(requestDto);
        return new BaseResponse<>(result);
    }
    
    @PutMapping("/{requestId}/approve")
    @Operation(summary = "전문가 인증 요청 승인", description = "관리자가 특정 전문가 인증 요청을 승인합니다.")
    public BaseResponse<ApprovalActionResponseDto> approveRequest(
            @Parameter(description = "인증 요청 ID") @PathVariable Long requestId) {
        
        log.info("전문가 인증 요청 승인: requestId={}", requestId);
        
        ApprovalActionResponseDto result = adminApprovalService.approveRequest(requestId);
        return new BaseResponse<>(result);
    }
    
    @PutMapping("/{requestId}/reject")
    @Operation(summary = "전문가 인증 요청 거절", description = "관리자가 특정 전문가 인증 요청을 거절합니다.")
    public BaseResponse<ApprovalActionResponseDto> rejectRequest(
            @Parameter(description = "인증 요청 ID") @PathVariable Long requestId,
            @Valid @RequestBody ApprovalActionRequestDto requestDto) {
        
        log.info("전문가 인증 요청 거절: requestId={}, reason={}", 
                requestId, requestDto.getRejectionReason());
        
        ApprovalActionResponseDto result = adminApprovalService.rejectRequest(requestId, requestDto);
        return new BaseResponse<>(result);
    }
}
