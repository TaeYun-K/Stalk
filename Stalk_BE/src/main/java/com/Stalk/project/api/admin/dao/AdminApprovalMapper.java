package com.Stalk.project.api.admin.dao;

import com.Stalk.project.api.admin.dto.in.ApprovalRequestListDto;
import com.Stalk.project.api.admin.dto.in.ApprovalStatus;
import com.Stalk.project.api.admin.dto.in.AdvisorApprovalRequestDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminApprovalMapper {
    
    /**
     * 전문가 인증 요청 목록 조회
     */
    List<AdvisorApprovalRequestDto> findApprovalRequests(
            @Param("status") ApprovalStatus status,
            @Param("pageRequest") ApprovalRequestListDto pageRequest
    );
    
    /**
     * 특정 인증 요청 조회
     */
    AdvisorApprovalRequestDto findApprovalRequestById(@Param("requestId") Long requestId);
    
    /**
     * 인증 요청 승인 처리
     */
    int approveRequest(
            @Param("requestId") Long requestId,
            @Param("adminId") Long adminId
    );
    
    /**
     * advisor 테이블의 is_approved 업데이트
     */
    int updateAdvisorApprovalStatus(@Param("advisorId") Long advisorId);
    
    /**
     * 인증 요청 거절 처리
     */
    int rejectRequest(
            @Param("requestId") Long requestId,
            @Param("adminId") Long adminId,
            @Param("rejectionReason") String rejectionReason,
            @Param("customReason") String customReason
    );
    
    /**
     * 알림 생성
     */
    int createNotification(
            @Param("userId") Long userId,
            @Param("type") String type,
            @Param("title") String title,
            @Param("message") String message,
            @Param("relatedId") Long relatedId
    );
}
