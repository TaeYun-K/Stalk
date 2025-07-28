package com.Stalk.project.advisor.dao;

import com.Stalk.project.advisor.dto.in.AdvisorListRequestDto;
import com.Stalk.project.advisor.dto.out.AdvisorDetailResponseDto;
import com.Stalk.project.advisor.dto.out.AdvisorResponseDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdvisorMapper {
    List<AdvisorResponseDto> findAllAdvisorsSummary(AdvisorListRequestDto requestDto);

    // AdvisorMapper.java에 추가할 메서드들

    /**
     * 어드바이저 상세 정보 조회 (리뷰 제외)
     */
    AdvisorDetailResponseDto findAdvisorDetailById(@Param("advisorId") Long advisorId);

    /**
     * 어드바이저의 최신 리뷰 조회 (최대 10개)
     */
    List<AdvisorDetailResponseDto.ReviewDto> findLatestReviewsByAdvisorId(@Param("advisorId") Long advisorId, @Param("limit") int limit);

    /**
     * 어드바이저의 전체 리뷰 수 조회 (삭제되지 않은 것만)
     */
    int countReviewsByAdvisorId(@Param("advisorId") Long advisorId);
}