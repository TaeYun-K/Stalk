package com.Stalk.project.global.notification.dto.in;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 알람 생성용 내부 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationCreateDto {
    
    private Long userId;           // 알람을 받을 사용자 ID
    private NotificationType type; // 알람 타입
    private String title;          // 알람 제목
    private String message;        // 알람 내용
    private Long relatedId;        // 관련 데이터 ID (선택사항)
}