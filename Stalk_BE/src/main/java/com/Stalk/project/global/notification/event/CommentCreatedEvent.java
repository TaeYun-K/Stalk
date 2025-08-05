package com.Stalk.project.global.notification.event;

import lombok.Getter;

@Getter
public class CommentCreatedEvent extends NotificationEvent {
    private final Long commentId;
    private final String commenterName;
    private final String postTitle;
    
    public CommentCreatedEvent(Long postAuthorId, Long commentId, String commenterName, String postTitle) {
        super(postAuthorId, String.format("%s님이 '%s' 글에 댓글을 남겼습니다.", commenterName, postTitle));
        this.commentId = commentId;
        this.commenterName = commenterName;
        this.postTitle = postTitle;
    }
}