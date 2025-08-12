package com.Stalk.project.api.review.dao;

import com.Stalk.project.api.review.dto.out.AdvisorReviewResponseDto;
import com.Stalk.project.api.review.dto.out.ReviewResponseDto;
import com.Stalk.project.global.util.PageRequestDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ReviewMapper {
    
    // 상담 정보 조회 (리뷰 작성 가능 여부 확인용)
    ConsultationForReviewDto findConsultationForReview(@Param("consultationId") Long consultationId);
    
    // 기존 리뷰 존재 여부 확인
    boolean existsReviewByConsultationId(@Param("consultationId") Long consultationId);
    
    // 리뷰 작성
    void insertReview(@Param("userId") Long userId, 
                     @Param("consultationId") Long consultationId,
                     @Param("advisorId") Long advisorId,
                     @Param("rating") Integer rating, 
                     @Param("content") String content);
    
    // 마지막 삽입된 리뷰 ID 조회
    Long getLastInsertId();
    
    // 리뷰 상세 조회 (수정/삭제 권한 확인용)
    ReviewDetailForUpdateDto findReviewForUpdate(@Param("reviewId") Long reviewId);
    
    // 리뷰 수정
    void updateReview(@Param("reviewId") Long reviewId, 
                     @Param("rating") Integer rating, 
                     @Param("content") String content);
    
    // 리뷰 삭제 (소프트 삭제)
    void deleteReview(@Param("reviewId") Long reviewId);
    
    // 내가 작성한 리뷰 목록 조회
    List<ReviewResponseDto> findMyReviews(@Param("userId") Long userId, 
                                         @Param("pageRequest") PageRequestDto pageRequest);
    
    // 특정 전문가의 리뷰 목록 조회
    List<AdvisorReviewResponseDto> findAdvisorReviews(@Param("advisorId") Long advisorId, 
                                                     @Param("pageRequest") PageRequestDto pageRequest);
    
    // 내부 DTO 클래스들
    class ConsultationForReviewDto {
        public Long id;
        public Long userId;
        public Long advisorId;
        public String status;
        public LocalDateTime approvedAt;
        public String advisorName;
        public String userName;
    }
    
    class ReviewDetailForUpdateDto {
        public Long id;
        public Long userId;
        public Long advisorId;
        public Integer rating;
        public String content;
        public String createdAt;
    }
}