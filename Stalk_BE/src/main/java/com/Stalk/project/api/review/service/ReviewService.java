package com.Stalk.project.api.review.service;

import com.Stalk.project.global.notification.event.ReviewCreatedEvent;
import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.response.BaseResponseStatus;
import com.Stalk.project.api.review.dao.ReviewMapper;
import com.Stalk.project.api.review.dto.in.ReviewCreateRequestDto;
import com.Stalk.project.api.review.dto.in.ReviewUpdateRequestDto;
import com.Stalk.project.api.review.dto.out.AdvisorReviewResponseDto;
import com.Stalk.project.api.review.dto.out.ReviewCreateResponseDto;
import com.Stalk.project.api.review.dto.out.ReviewResponseDto;
import com.Stalk.project.global.util.CursorPage;
import com.Stalk.project.global.util.PageRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private final ReviewMapper reviewMapper;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 리뷰 작성
     */
    @Transactional
    public ReviewCreateResponseDto createReview(Long userId, ReviewCreateRequestDto requestDto) {

        // 1. 상담 정보 조회 및 검증
        ReviewMapper.ConsultationForReviewDto consultation =
            reviewMapper.findConsultationForReview(requestDto.getConsultationId());

        if (consultation == null) {
            throw new BaseException(BaseResponseStatus.CONSULTATION_NOT_FOUND);
        }

        // 2. 권한 확인 (본인의 상담인지)
        if (!consultation.userId.equals(userId)) {
            throw new BaseException(BaseResponseStatus.UNAUTHORIZED_REVIEW_REQUEST);
        }

        // 3. 상담 상태 확인 (APPROVED 상태인지)
        if (!"APPROVED".equals(consultation.status)) {
            throw new BaseException(BaseResponseStatus.CONSULTATION_NOT_APPROVED);
        }

        // 4. 중복 리뷰 확인
        if (reviewMapper.existsReviewByConsultationId(requestDto.getConsultationId())) {
            throw new BaseException(BaseResponseStatus.REVIEW_ALREADY_EXISTS);
        }

        // 5. 리뷰 저장
        reviewMapper.insertReview(
            userId,
            requestDto.getConsultationId(),
            consultation.advisorId,
            requestDto.getRating(),
            requestDto.getContent()
        );

        Long reviewId = reviewMapper.getLastInsertId();

        // 6. 이벤트 발행 (전문가에게 알림)
        ReviewCreatedEvent event = new ReviewCreatedEvent(
            reviewId,
            requestDto.getConsultationId(),
            userId,
            consultation.userName,
            requestDto.getRating(),
            requestDto.getContent(),
            consultation.advisorId,
            consultation.advisorName
        );
        eventPublisher.publishEvent(event);

        log.info("리뷰 작성 완료: reviewId={}, consultationId={}, userId={}",
            reviewId, requestDto.getConsultationId(), userId);

        return new ReviewCreateResponseDto(reviewId, "리뷰가 성공적으로 작성되었습니다.");
    }
    
    /**
     * 리뷰 수정
     */
    @Transactional
    public void updateReview(Long userId, Long reviewId, ReviewUpdateRequestDto requestDto) {
        
        // 1. 리뷰 조회 및 권한 확인
        ReviewMapper.ReviewDetailForUpdateDto review = reviewMapper.findReviewForUpdate(reviewId);
        
        if (review == null) {
            throw new BaseException(BaseResponseStatus.REVIEW_NOT_FOUND);
        }
        
        if (!review.userId.equals(userId)) {
            throw new BaseException(BaseResponseStatus.UNAUTHORIZED_REVIEW_UPDATE);
        }
        
        // 2. 리뷰 수정
        reviewMapper.updateReview(reviewId, requestDto.getRating(), requestDto.getContent());
        
        log.info("리뷰 수정 완료: reviewId={}, userId={}", reviewId, userId);
    }
    
    /**
     * 리뷰 삭제
     */
    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        
        // 1. 리뷰 조회 및 권한 확인
        ReviewMapper.ReviewDetailForUpdateDto review = reviewMapper.findReviewForUpdate(reviewId);
        
        if (review == null) {
            throw new BaseException(BaseResponseStatus.ADVISOR_REVIEW_NOT_FOUND);
        }
        
        if (!review.userId.equals(userId)) {
            throw new BaseException(BaseResponseStatus.UNAUTHORIZED_REVIEW_DELETE);
        }
        
        // 2. 리뷰 삭제 (소프트 삭제)
        reviewMapper.deleteReview(reviewId);
        
        log.info("리뷰 삭제 완료: reviewId={}, userId={}", reviewId, userId);
    }
    
    /**
     * 내가 작성한 리뷰 목록 조회
     */
    public CursorPage<ReviewResponseDto> getMyReviews(Long userId, PageRequestDto pageRequest) {
        
        List<ReviewResponseDto> reviews = reviewMapper.findMyReviews(userId, pageRequest);
        
        // hasNext 판단을 위한 limitPlusOne 처리
        boolean hasNext = reviews.size() > pageRequest.getPageSize();
        if (hasNext) {
            reviews.remove(reviews.size() - 1);
        }
        
        return CursorPage.<ReviewResponseDto>builder()
                .content(reviews)
                .nextCursor(null)
                .hasNext(hasNext)
                .pageSize(pageRequest.getPageSize())
                .pageNo(pageRequest.getPageNo())
                .build();
    }
    
    /**
     * 특정 전문가의 리뷰 목록 조회
     */
    public CursorPage<AdvisorReviewResponseDto> getAdvisorReviews(Long advisorId, PageRequestDto pageRequest) {
        
        List<AdvisorReviewResponseDto> reviews = reviewMapper.findAdvisorReviews(advisorId, pageRequest);
        
        // hasNext 판단을 위한 limitPlusOne 처리
        boolean hasNext = reviews.size() > pageRequest.getPageSize();
        if (hasNext) {
            reviews.remove(reviews.size() - 1);
        }
        
        return CursorPage.<AdvisorReviewResponseDto>builder()
                .content(reviews)
                .nextCursor(null)
                .hasNext(hasNext)
                .pageSize(pageRequest.getPageSize())
                .pageNo(pageRequest.getPageNo())
                .build();
    }
}