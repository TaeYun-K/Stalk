package com.Stalk.project.admin.service;

import com.Stalk.project.admin.dao.AdminApprovalMapper;
import com.Stalk.project.admin.dto.in.ApprovalActionRequestDto;
import com.Stalk.project.admin.dto.in.ApprovalRequestListDto;
import com.Stalk.project.admin.dto.in.AdvisorApprovalRequestDto;
import com.Stalk.project.admin.dto.out.ApprovalActionResponseDto;
import com.Stalk.project.exception.BaseException;
import com.Stalk.project.util.CursorPage;
import com.Stalk.project.login.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static com.Stalk.project.response.BaseResponseStatus.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminApprovalService {

    private final AdminApprovalMapper adminApprovalMapper;

    /**
     * 전문가 인증 요청 목록 조회
     */
    public CursorPage<AdvisorApprovalRequestDto> getApprovalRequests(ApprovalRequestListDto requestDto) {
        // 관리자 권한 확인
        validateAdminPermission();

        // 데이터 조회
        List<AdvisorApprovalRequestDto> requests = adminApprovalMapper.findApprovalRequests(
                        requestDto.getStatus(), requestDto
        );

        // CursorPage 생성
        boolean hasNext = requests.size() > requestDto.getPageSize();
        if (hasNext) {
            requests.remove(requests.size() - 1);
        }

        return CursorPage.<AdvisorApprovalRequestDto>builder()
                        .content(requests)
                        .nextCursor(null)
                        .hasNext(hasNext)
                        .pageSize(requestDto.getPageSize())
                        .pageNo(requestDto.getPageNo())
                        .build();
    }

    /**
     * 전문가 인증 요청 승인
     */
    @Transactional
    public ApprovalActionResponseDto approveRequest(Long requestId) {
        // 관리자 권한 확인
        validateAdminPermission();
        Long adminId = SecurityUtil.getCurrentUserPrimaryId();

        // 요청 존재 및 상태 확인
        AdvisorApprovalRequestDto request = validateRequestForProcessing(requestId);

        try {
            // 1. approval_logs 테이블 업데이트
            int approvalResult = adminApprovalMapper.approveRequest(requestId, adminId);
            if (approvalResult == 0) {
                throw new BaseException(APPROVAL_PROCESSING_FAILED);
            }

            // 2. advisor 테이블의 is_approved 업데이트
            int advisorUpdateResult = adminApprovalMapper.updateAdvisorApprovalStatus(request.getAdvisorId());
            if (advisorUpdateResult == 0) {
                throw new BaseException(APPROVAL_PROCESSING_FAILED);
            }

            // 3. 전문가에게 승인 알림 발송
            createApprovalNotification(request.getAdvisorId(), true, null);

            // 4. 응답 생성
            return createActionResponse(requestId, request.getAdvisorId(), "APPROVED", null, null);

        } catch (Exception e) {
            log.error("승인 처리 중 오류 발생: requestId={}", requestId, e);
            throw new BaseException(APPROVAL_PROCESSING_FAILED);
        }
    }

    /**
     * 전문가 인증 요청 거절
     */
    @Transactional
    public ApprovalActionResponseDto rejectRequest(Long requestId, ApprovalActionRequestDto requestDto) {
        // 관리자 권한 확인
        validateAdminPermission();
        Long adminId = SecurityUtil.getCurrentUserPrimaryId();

        // 요청 존재 및 상태 확인
        AdvisorApprovalRequestDto request = validateRequestForProcessing(requestId);

        try {
            // 1. approval_logs 테이블 업데이트
            int rejectionResult = adminApprovalMapper.rejectRequest(
                            requestId, adminId,
                            requestDto.getRejectionReason().name(),
                            requestDto.getCustomReason()
            );
            if (rejectionResult == 0) {
                throw new BaseException(REJECTION_PROCESSING_FAILED);
            }

            // 2. 전문가에게 거절 알림 발송
            createApprovalNotification(request.getAdvisorId(), false, requestDto);

            // 3. 응답 생성
            return createActionResponse(
                            requestId, request.getAdvisorId(), "REJECTED",
                            requestDto.getRejectionReason().name(), requestDto.getCustomReason()
            );

        } catch (Exception e) {
            log.error("거절 처리 중 오류 발생: requestId={}", requestId, e);
            throw new BaseException(REJECTION_PROCESSING_FAILED);
        }
    }

    /**
     * 관리자 권한 확인
     */
    private void validateAdminPermission() {
        try {
            String currentUserId = SecurityUtil.getCurrentUserId();
            String currentUserRole = SecurityUtil.getCurrentUserRole();
            Long currentUserPrimaryId = SecurityUtil.getCurrentUserPrimaryId();

            log.info("현재 사용자 정보 - UserId: {}, Role: {}, PrimaryId: {}",
                            currentUserId, currentUserRole, currentUserPrimaryId);

            if (!SecurityUtil.isCurrentUserAdmin()) {
                throw new BaseException(ADMIN_ACCESS_DENIED);
            }
        } catch (Exception e) {
            log.error("권한 확인 중 오류 발생: ", e);
            throw new BaseException(ADMIN_ACCESS_DENIED);
        }
    }

    /**
     * 처리 가능한 요청인지 확인
     */
    private AdvisorApprovalRequestDto validateRequestForProcessing(Long requestId) {
        AdvisorApprovalRequestDto request = adminApprovalMapper.findApprovalRequestById(requestId);
        if (request == null) {
            throw new BaseException(APPROVAL_REQUEST_NOT_FOUND);
        }

        if (!"PENDING".equals(request.getStatus())) {
            throw new BaseException(ALREADY_PROCESSED_REQUEST);
        }

        return request;
    }

    /**
     * 승인/거절 알림 생성
     */
    private void createApprovalNotification(Long advisorId, boolean isApproved, ApprovalActionRequestDto rejectionDto) {
        String type = isApproved ? "ADVISOR_APPROVAL" : "ADVISOR_REJECTION";
        String title = isApproved ? "전문가 인증 승인" : "전문가 인증 거절";
        String message = isApproved
                        ? "전문가 인증이 승인되었습니다. 이제 전문가 서비스를 이용하실 수 있습니다."
                        : String.format("전문가 인증이 거절되었습니다. 사유: %s",
                        rejectionDto != null ? rejectionDto.getRejectionReason().getDisplayName() : "");

        adminApprovalMapper.createNotification(advisorId, type, title, message, null);
    }

    /**
     * 액션 응답 DTO 생성
     */
    private ApprovalActionResponseDto createActionResponse(Long requestId, Long advisorId,
                    String status, String rejectionReason, String customReason) {
        ApprovalActionResponseDto response = new ApprovalActionResponseDto();
        response.setRequestId(requestId);
        response.setAdvisorId(advisorId);
        response.setStatus(status);
        response.setProcessedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'+09:00'")));
        response.setProcessedBy("관리자"); // TODO: 실제 관리자 이름 조회

        if ("REJECTED".equals(status)) {
            response.setRejectionReason(rejectionReason);
            response.setCustomReason(customReason);
        }

        return response;
    }
}
