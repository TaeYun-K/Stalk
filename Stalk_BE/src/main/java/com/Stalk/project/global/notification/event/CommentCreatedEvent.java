package com.Stalk.project.global.notification.event;

import lombok.Getter;

/**
 * 커뮤니티 댓글 작성 시 발행되는 이벤트
 */
@Getter
public class CommentCreatedEvent extends NotificationEvent {

    private final Long postId;              // 글 ID
    private final Long commentId;           // 댓글 ID
    private final Long commentAuthorId;     // 댓글 작성자 ID
    private final String commentAuthorName; // 댓글 작성자 닉네임
    private final String commentContent;    // 댓글 내용
    private final Long postAuthorId;        // 글 작성자 ID (알람 수신자)
    private final String postTitle;         // 글 제목

    public CommentCreatedEvent(Long postId, Long commentId, Long commentAuthorId,
        String commentAuthorName, String commentContent,
        Long postAuthorId, String postTitle) {
        // 부모 클래스 생성자 호출 (targetUserId, message)
        super(postAuthorId, String.format("%s님이 '%s' 글에 댓글을 남겼습니다.",
            commentAuthorName, postTitle));

        this.postId = postId;
        this.commentId = commentId;
        this.commentAuthorId = commentAuthorId;
        this.commentAuthorName = commentAuthorName;
        this.commentContent = commentContent;
        this.postAuthorId = postAuthorId;
        this.postTitle = postTitle;
    }
}