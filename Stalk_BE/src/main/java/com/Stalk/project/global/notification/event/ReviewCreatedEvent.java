package com.Stalk.project.global.notification.event;

import lombok.Getter;

/**
 * 리뷰 작성 시 발행되는 이벤트
 */
@Getter
public class ReviewCreatedEvent extends NotificationEvent {

    private final Long reviewId;              // 리뷰 ID
    private final Long consultationId;        // 상담 ID  
    private final Long reviewAuthorId;        // 리뷰 작성자 ID
    private final String reviewAuthorName;    // 리뷰 작성자 이름
    private final Integer rating;             // 평점
    private final String reviewContent;       // 리뷰 내용
    private final Long advisorId;             // 전문가 ID (알림 수신자)
    private final String advisorName;         // 전문가 이름

    public ReviewCreatedEvent(Long reviewId, Long consultationId, Long reviewAuthorId,
        String reviewAuthorName, Integer rating, String reviewContent,
        Long advisorId, String advisorName) {
        // 부모 클래스 생성자 호출 (targetUserId, message)
        super(advisorId, String.format("%s님이 회원님의 상담에 %d점 리뷰를 남겼습니다.",
            reviewAuthorName, rating));

        this.reviewId = reviewId;
        this.consultationId = consultationId;
        this.reviewAuthorId = reviewAuthorId;
        this.reviewAuthorName = reviewAuthorName;
        this.rating = rating;
        this.reviewContent = reviewContent;
        this.advisorId = advisorId;
        this.advisorName = advisorName;
    }
}