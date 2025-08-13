package com.Stalk.project.api.review.controller;

import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.api.review.dto.in.ReviewCreateRequestDto;
import com.Stalk.project.api.review.dto.in.ReviewUpdateRequestDto;
import com.Stalk.project.api.review.dto.out.AdvisorReviewResponseDto;
import com.Stalk.project.api.review.dto.out.ReviewCreateResponseDto;
import com.Stalk.project.api.review.dto.out.ReviewResponseDto;
import com.Stalk.project.api.review.service.ReviewService;
import com.Stalk.project.global.util.CursorPage;
import com.Stalk.project.global.util.PageRequestDto;
import com.Stalk.project.global.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Review", description = "리뷰 관련 API")
public class ReviewController {
    
    private final ReviewService reviewService;
    
    /**
     * 리뷰 작성
     */
    @PostMapping
    @Operation(summary = "리뷰 작성", description = "상담 완료 후 리뷰를 작성합니다.")
    public BaseResponse<ReviewCreateResponseDto> createReview(
            @Valid @RequestBody ReviewCreateRequestDto requestDto) {
        
        Long userId = SecurityUtil.getCurrentUserPrimaryId();
        ReviewCreateResponseDto response = reviewService.createReview(userId, requestDto);
        
        return new BaseResponse<>(response);
    }
    
    /**
     * 리뷰 수정
     */
    @PutMapping("/{reviewId}")
    @Operation(summary = "리뷰 수정", description = "작성한 리뷰를 수정합니다.")
    public BaseResponse<Void> updateReview(
            @Parameter(description = "리뷰 ID") @PathVariable Long reviewId,
            @Valid @RequestBody ReviewUpdateRequestDto requestDto) {
        
        Long userId = SecurityUtil.getCurrentUserPrimaryId();
        reviewService.updateReview(userId, reviewId, requestDto);
        
        return new BaseResponse<>();
    }
    
    /**
     * 리뷰 삭제
     */
    @DeleteMapping("/{reviewId}")
    @Operation(summary = "리뷰 삭제", description = "작성한 리뷰를 삭제합니다.")
    public BaseResponse<Void> deleteReview(
            @Parameter(description = "리뷰 ID") @PathVariable Long reviewId) {
        
        Long userId = SecurityUtil.getCurrentUserPrimaryId();
        reviewService.deleteReview(userId, reviewId);
        
        return new BaseResponse<>();
    }
    
    /**
     * 내가 작성한 리뷰 목록 조회
     */
    @GetMapping
    @Operation(summary = "내 리뷰 목록 조회", description = "현재 로그인한 사용자가 작성한 리뷰 목록을 조회합니다.")
    public BaseResponse<CursorPage<ReviewResponseDto>> getMyReviews(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "1") int pageNo,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "10") int pageSize) {
        
        Long userId = SecurityUtil.getCurrentUserPrimaryId();
        PageRequestDto pageRequest = new PageRequestDto(pageNo, pageSize);
        CursorPage<ReviewResponseDto> response = reviewService.getMyReviews(userId, pageRequest);
        
        return new BaseResponse<>(response);
    }
    
    /**
     * 특정 전문가의 리뷰 목록 조회
     */
    @GetMapping("/advisors/{advisorId}")
    @Operation(summary = "전문가 리뷰 목록 조회", description = "특정 전문가의 모든 리뷰를 조회합니다.")
    public BaseResponse<CursorPage<AdvisorReviewResponseDto>> getAdvisorReviews(
            @Parameter(description = "전문가 ID") @PathVariable Long advisorId,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "1") int pageNo,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "10") int pageSize) {
        
        PageRequestDto pageRequest = new PageRequestDto(pageNo, pageSize);
        CursorPage<AdvisorReviewResponseDto> response = reviewService.getAdvisorReviews(advisorId, pageRequest);
        
        return new BaseResponse<>(response);
    }
}