package com.Stalk.project.api.advisor.profile.controller;

import com.Stalk.project.api.advisor.profile.dto.in.AdvisorCertificateApprovalRequestDto;
import com.Stalk.project.api.advisor.profile.dto.in.AdvisorProfileCreateRequestDto;
import com.Stalk.project.api.advisor.profile.dto.in.AdvisorProfileUpdateRequestDto;
import com.Stalk.project.api.advisor.profile.dto.out.AdvisorProfileResponseDto;
import com.Stalk.project.api.advisor.profile.dto.out.ApprovalHistoryResponseDto;
import com.Stalk.project.api.advisor.profile.dto.out.CertificateApprovalResponseDto;
import com.Stalk.project.api.advisor.profile.service.AdvisorProfileService;
import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.global.response.BaseResponseStatus;
import com.Stalk.project.global.util.CursorPage;
import com.Stalk.project.global.util.PageRequestDto;
import com.Stalk.project.global.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/advisors")
@RequiredArgsConstructor
@Tag(name = "Advisor Profile", description = "전문가 프로필 관리 API")
public class AdvisorProfileController {

    private final AdvisorProfileService advisorProfileService;

    // ===== 전문가 상세 정보 등록 =====

    @PostMapping("/profile")
    @Operation(
        summary = "전문가 상세 정보 등록",
        description = "승인된 전문가가 상세 프로필 정보를 등록합니다. 경력 정보는 최소 1개 이상 필수입니다."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "프로필 등록 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 (경력 정보 누락 등)"),
        @ApiResponse(responseCode = "403", description = "권한 없음 (미승인 전문가 등)"),
        @ApiResponse(responseCode = "409", description = "이미 등록된 프로필이 존재"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public BaseResponse<AdvisorProfileResponseDto> createAdvisorProfile(
        @Valid @RequestBody AdvisorProfileCreateRequestDto request) {

        log.info("POST /api/advisors/profile - Creating advisor profile");

        // 1. JWT 토큰에서 현재 사용자 정보 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();

        // 2. 전문가 권한 확인
        if (!SecurityUtil.isCurrentUserAdvisor()) {
            throw new BaseException(BaseResponseStatus.UNAUTHORIZED_ADVISOR_ACCESS);
        }

        // 3. 서비스 호출
        AdvisorProfileResponseDto result = advisorProfileService.createAdvisorProfile(
            currentUserId, request);

        return new BaseResponse<>(result);
    }

    // ===== 전문가 상세 정보 수정 =====

    @PutMapping("/profile")
    @Operation(
        summary = "전문가 상세 정보 수정",
        description = "등록된 프로필 정보를 수정합니다. 경력 정보는 개별적으로 생성/수정/삭제가 가능합니다."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "프로필 수정 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 (수정할 내용 없음 등)"),
        @ApiResponse(responseCode = "403", description = "권한 없음"),
        @ApiResponse(responseCode = "404", description = "등록된 프로필 없음"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public BaseResponse<AdvisorProfileResponseDto> updateAdvisorProfile(
        @Valid @RequestBody AdvisorProfileUpdateRequestDto request) {

        log.info("PUT /api/advisors/profile - Updating advisor profile");

        // 1. JWT 토큰에서 현재 사용자 정보 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();

        // 2. 전문가 권한 확인
        if (!SecurityUtil.isCurrentUserAdvisor()) {
            throw new BaseException(BaseResponseStatus.UNAUTHORIZED_ADVISOR_ACCESS);
        }

        // 3. 서비스 호출
        AdvisorProfileResponseDto result = advisorProfileService.updateAdvisorProfile(
            currentUserId, request);

        return new BaseResponse<>(result);
    }

    // ===== 자격 승인 요청 =====

    @PostMapping("/certificate-approval")
    @Operation(
        summary = "자격증 승인 요청",
        description = "새로운 자격증 승인을 요청하거나, 거절된 자격증을 재요청합니다."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "승인 요청 접수 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 (유효하지 않은 자격증 정보 등)"),
        @ApiResponse(responseCode = "403", description = "권한 없음"),
        @ApiResponse(responseCode = "404", description = "이전 요청을 찾을 수 없음 (재요청 시)"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public BaseResponse<CertificateApprovalResponseDto> requestCertificateApproval(
        @Valid @RequestBody AdvisorCertificateApprovalRequestDto request) {

        log.info("POST /api/advisors/certificate-approval - Processing certificate approval request, isReRequest: {}",
            request.isReRequest());

        // 1. JWT 토큰에서 현재 사용자 정보 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();

        // 2. 전문가 권한 확인 (모든 전문가 요청 가능)
        if (!SecurityUtil.isCurrentUserAdvisor()) {
            throw new BaseException(BaseResponseStatus.UNAUTHORIZED_ADVISOR_ACCESS);
        }

        // 3. 서비스 호출
        CertificateApprovalResponseDto result = advisorProfileService.requestCertificateApproval(
            currentUserId, request);

        return new BaseResponse<>(result);
    }

    // ===== 승인 요청 이력 조회 =====

    @GetMapping("/certificate-approval")
    @Operation(
        summary = "승인 요청 이력 조회",
        description = "현재 전문가의 자격증 승인 요청 이력을 페이지별로 조회합니다."
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "승인 이력 조회 성공",
            content = @Content(schema = @Schema(implementation = CursorPage.class))
        ),
        @ApiResponse(responseCode = "403", description = "권한 없음"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public BaseResponse<CursorPage<ApprovalHistoryResponseDto>> getApprovalHistory(
        @Parameter(description = "페이지 번호", example = "1")
        @RequestParam(defaultValue = "1") int pageNo,

        @Parameter(description = "페이지 크기", example = "10")
        @RequestParam(defaultValue = "10") int pageSize) {

        log.info("GET /api/advisors/certificate-approval - Getting approval history, pageNo: {}, pageSize: {}",
            pageNo, pageSize);

        // 1. JWT 토큰에서 현재 사용자 정보 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();

        // 2. 전문가 권한 확인
        if (!SecurityUtil.isCurrentUserAdvisor()) {
            throw new BaseException(BaseResponseStatus.UNAUTHORIZED_ADVISOR_ACCESS);
        }

        // 3. 페이지 요청 DTO 생성
        PageRequestDto pageRequest = new PageRequestDto(pageNo, pageSize);

        // 4. 서비스 호출
        CursorPage<ApprovalHistoryResponseDto> result = advisorProfileService.getApprovalHistory(
            currentUserId, pageRequest);

        return new BaseResponse<>(result);
    }

    // ===== 추가 유틸리티 엔드포인트 (선택사항) =====

    @GetMapping("/profile/status")
    @Operation(
        summary = "프로필 상태 확인",
        description = "현재 전문가의 프로필 등록 상태를 확인합니다."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "상태 조회 성공"),
        @ApiResponse(responseCode = "403", description = "권한 없음")
    })
    public BaseResponse<ProfileStatusResponseDto> getProfileStatus() {

        log.info("GET /api/advisors/profile/status - Checking profile status");

        // 1. JWT 토큰에서 현재 사용자 정보 추출
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();

        // 2. 전문가 권한 확인
        if (!SecurityUtil.isCurrentUserAdvisor()) {
            throw new BaseException(BaseResponseStatus.UNAUTHORIZED_ADVISOR_ACCESS);
        }

        // 3. 상태 정보 생성 (간단한 상태만 반환)
        ProfileStatusResponseDto status = ProfileStatusResponseDto.builder()
            .advisorId(currentUserId)
            .message("프로필 상태 조회 성공")
            .build();

        return new BaseResponse<>(status);
    }

    // ===== 내부 응답 DTO =====

    @Schema(description = "프로필 상태 응답 DTO")
    public static class ProfileStatusResponseDto {

        @Schema(description = "전문가 ID", example = "1")
        private Long advisorId;

        @Schema(description = "상태 메시지", example = "프로필 상태 조회 성공")
        private String message;

        // Builder 패턴
        public static ProfileStatusResponseDtoBuilder builder() {
            return new ProfileStatusResponseDtoBuilder();
        }

        public static class ProfileStatusResponseDtoBuilder {
            private Long advisorId;
            private String message;

            public ProfileStatusResponseDtoBuilder advisorId(Long advisorId) {
                this.advisorId = advisorId;
                return this;
            }

            public ProfileStatusResponseDtoBuilder message(String message) {
                this.message = message;
                return this;
            }

            public ProfileStatusResponseDto build() {
                ProfileStatusResponseDto dto = new ProfileStatusResponseDto();
                dto.advisorId = this.advisorId;
                dto.message = this.message;
                return dto;
            }
        }

        // Getters
        public Long getAdvisorId() { return advisorId; }
        public String getMessage() { return message; }
    }
}