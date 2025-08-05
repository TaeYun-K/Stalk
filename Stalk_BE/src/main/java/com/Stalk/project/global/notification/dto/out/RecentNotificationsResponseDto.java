package com.Stalk.project.global.notification.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 최근 알람 확인 응답 DTO (폴링용)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "최근 알람 확인 응답 DTO")
public class RecentNotificationsResponseDto {
    
    @Schema(description = "새로운 알람 목록")
    private List<NotificationResponseDto> newNotifications;
    
    @Schema(description = "새로운 알람 개수", example = "3")
    private Integer newCount;
    
    @Schema(description = "현재 총 읽지않은 개수", example = "8")
    private Integer totalUnreadCount;
    
    @Schema(description = "새로운 알람 존재 여부", example = "true")
    private Boolean hasNewNotifications;
}
