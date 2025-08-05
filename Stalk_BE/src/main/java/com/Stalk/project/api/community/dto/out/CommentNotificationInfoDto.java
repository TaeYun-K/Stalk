package com.Stalk.project.api.community.dto.out;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 댓글 알람 발송을 위한 정보 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentNotificationInfoDto {
    
    private Long postAuthorId;      // 글 작성자 ID (알람 수신자)
    private String postTitle;       // 글 제목
    private String commentAuthorName; // 댓글 작성자 닉네임
}