package com.Stalk.project.api.advisor.dao;

import com.Stalk.project.api.advisor.dto.in.AdvisorListRequestDto;
import com.Stalk.project.api.advisor.dto.out.AdvisorDetailResponseDto;
import com.Stalk.project.api.advisor.dto.out.AdvisorResponseDto;
import com.Stalk.project.api.advisor.dto.out.BlockedTimeDto;
import com.Stalk.project.api.advisor.dto.out.ReservedTimeDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface AdvisorMapper {

  /**
   * 어드바이저 목록 조회
   */
  List<AdvisorResponseDto> findAllAdvisorsSummary(AdvisorListRequestDto requestDto);

  /**
   * 어드바이저 상세 정보 조회 (리뷰 제외)
   */
  AdvisorDetailResponseDto findAdvisorDetailById(@Param("advisorId") Long advisorId);

  /**
   * 어드바이저의 최신 리뷰 조회 (최대 10개)
   */
  List<AdvisorDetailResponseDto.ReviewDto> findLatestReviewsByAdvisorId(
      @Param("advisorId") Long advisorId, @Param("limit") int limit);

  /**
   * 어드바이저의 전체 리뷰 수 조회 (삭제되지 않은 것만)
   */
  int countReviewsByAdvisorId(@Param("advisorId") Long advisorId);

  /**
   * 특정 날짜의 전문가 차단 시간 조회 (LocalDate 버전)
   */
  List<BlockedTimeDto> getBlockedTimes(@Param("advisorId") Long advisorId,
      @Param("date") LocalDate date);

  /**
   * 특정 날짜의 전문가 예약 시간 조회 (LocalDate 버전)
   */
  List<ReservedTimeDto> getReservedTimes(@Param("advisorId") Long advisorId,
      @Param("date") LocalDate date);

  /**
   * 전문가 존재 및 승인 여부 확인 (ReservationService에서 사용)
   * ReservationMapper의 isApprovedAdvisor와 동일한 기능
   */
  boolean isApprovedAdvisor(@Param("advisorId") Long advisorId);

  // ========== 전문가 일정 관리 관련 메서드들 (String date 버전) ==========

  /**
   * 전문가의 특정 날짜 차단 시간 조회 (일정 관리용)
   */
  List<String> getAdvisorBlockedTimes(@Param("advisorId") Long advisorId,
      @Param("date") String date);

  /**
   * 전문가의 특정 날짜 차단 시간 삭제 (일정 관리용)
   */
  void deleteBlockedTimesByDate(@Param("advisorId") Long advisorId, @Param("date") String date);

  /**
   * 전문가의 차단 시간 일괄 추가 (일정 관리용)
   */
  void insertBlockedTimes(@Param("advisorId") Long advisorId, @Param("date") String date,
      @Param("blockedTimes") List<String> blockedTimes);

  /**
   * 특정 날짜/시간에 예약이 있는지 확인 (일정 관리용)
   */
  List<String> getReservedTimesForDate(@Param("advisorId") Long advisorId,
      @Param("date") String date);

  // ========== 전문가 상세 정보 관련 추가 메서드들 ==========

  /**
   * 전문가 경력 정보 조회
   */
  List<AdvisorDetailResponseDto.CareerDto> findAdvisorCareers(@Param("advisorId") Long advisorId);

  /**
   * 전문가 자격증 정보 조회
   */
  List<AdvisorDetailResponseDto.CertificationDto> findAdvisorCertificates(@Param("advisorId") Long advisorId);

  /**
   * 전문가 리뷰 정보 조회 (프로필 포함)
   */
  List<AdvisorDetailResponseDto.ReviewDto> findAdvisorReviewsWithProfile(@Param("advisorId") Long advisorId);

  /**
   * 여러 전문가의 자격증 정보 조회 (목록 조회용)
   */
  List<AdvisorResponseDto.CertificateDto> findCertificatesByAdvisorIds(@Param("advisorIds") List<Long> advisorIds);

  /**
   * 단일 전문가의 자격증 정보 조회 (목록 조회용)
   */
  List<AdvisorResponseDto.CertificateDto> findCertificatesByAdvisorId(@Param("advisorId") Long advisorId);
}
