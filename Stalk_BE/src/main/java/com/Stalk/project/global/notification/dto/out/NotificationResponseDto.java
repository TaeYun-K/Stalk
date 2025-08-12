package com.Stalk.project.global.notification.dto.out;

import com.Stalk.project.global.notification.dto.in.NotificationType;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 알람 목록 조회 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "알람 정보 응답 DTO")
public class NotificationResponseDto {
    
    @Schema(description = "알람 ID", example = "1")
    private Long notificationId;
    
    @Schema(description = "알람 타입", example = "RESERVATION_CREATED")
    private NotificationType type;
    
    @Schema(description = "알람 제목", example = "새로운 상담 예약")
    private String title;
    
    @Schema(description = "알람 내용", example = "홍길동님이 2025-07-30 15:00 상담을 예약했습니다.")
    private String message;
    
    @Schema(description = "관련 데이터 ID (예약ID, 댓글ID 등)", example = "101")
    private Long relatedId;
    
    @Schema(description = "읽음 여부", example = "false")
    private Boolean isRead;
    
    @Schema(description = "생성일시", example = "2025-07-29T10:30:00")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}