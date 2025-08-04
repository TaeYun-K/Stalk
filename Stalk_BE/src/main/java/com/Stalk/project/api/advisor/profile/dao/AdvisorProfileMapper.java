package com.Stalk.project.api.advisor.profile.dao;

import com.Stalk.project.api.advisor.profile.dto.in.AdvisorCertificateApprovalRequestDto;
import com.Stalk.project.api.advisor.profile.dto.in.AdvisorProfileCreateRequestDto;
import com.Stalk.project.api.advisor.profile.dto.in.AdvisorProfileUpdateRequestDto;
import com.Stalk.project.api.advisor.profile.dto.in.CareerEntryDto;
import com.Stalk.project.api.advisor.profile.dto.out.ApprovalHistoryResponseDto;
import com.Stalk.project.global.util.PageRequestDto;
import java.util.LinkedHashMap;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdvisorProfileMapper {

    // ===== 권한 및 상태 확인 =====
    
    /**
     * 전문가 승인 여부 확인
     */
    Boolean isApprovedAdvisor(@Param("advisorId") Long advisorId);
    
    /**
     * 전문가의 상세 정보 존재 여부 확인
     */
    Boolean hasAdvisorDetailInfo(@Param("advisorId") Long advisorId);

    // ===== 프로필 관리 =====
    
    /**
     * 전문가 상세 정보 등록
     */
    int insertAdvisorDetailInfo(@Param("advisorId") Long advisorId, 
                               @Param("request") AdvisorProfileCreateRequestDto request);
    
    /**
     * 전문가 상세 정보 수정
     */
    int updateAdvisorDetailInfo(@Param("advisorId") Long advisorId, 
                               @Param("request") AdvisorProfileUpdateRequestDto request);

    // ===== 경력 정보 관리 =====
    
    /**
     * 경력 정보 등록
     */
    int insertCareerEntry(@Param("advisorId") Long advisorId, 
                         @Param("career") CareerEntryDto career);
    
    /**
     * 경력 정보 수정
     */
    int updateCareerEntry(@Param("advisorId") Long advisorId, 
                         @Param("career") CareerEntryDto career);
    
    /**
     * 경력 정보 삭제
     */
    int deleteCareerEntry(@Param("advisorId") Long advisorId, 
                         @Param("careerId") Long careerId);
    
    /**
     * 특정 전문가의 경력 정보 개수 조회
     */
    int countCareerEntries(@Param("advisorId") Long advisorId);
    
    /**
     * 경력 정보 소유권 확인
     */
    Boolean isCareerEntryOwner(@Param("advisorId") Long advisorId, 
                              @Param("careerId") Long careerId);

    // ===== 자격증 승인 요청 =====
    
    /**
     * 자격증 승인 요청 등록
     */
    int insertApprovalRequest(@Param("advisorId") Long advisorId, 
                             @Param("request") AdvisorCertificateApprovalRequestDto request);
    
    /**
     * 생성된 승인 요청 ID 조회
     */
    Long getLastInsertedApprovalRequestId();
    
    /**
     * 이전 요청 존재 및 소유권 확인
     */
    Boolean isPreviousRequestValid(@Param("advisorId") Long advisorId, 
                                  @Param("previousRequestId") Long previousRequestId);

    // ===== 승인 이력 조회 =====

    /**
     * 전문가의 승인 요청 이력 조회 (페이지네이션)
     */
    List<LinkedHashMap<String, Object>> findApprovalHistory(@Param("advisorId") Long advisorId,
        @Param("pageRequest") PageRequestDto pageRequest);
}