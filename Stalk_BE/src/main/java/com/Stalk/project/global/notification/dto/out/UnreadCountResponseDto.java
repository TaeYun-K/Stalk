package com.Stalk.project.global.notification.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 읽지않은 알람 개수 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "읽지않은 알람 개수 응답 DTO")
public class UnreadCountResponseDto {
    
    @Schema(description = "읽지않은 알람 개수", example = "5")
    private Integer unreadCount;
    
    @Schema(description = "마지막 확인 시간 (타임스탬프)", example = "1690685400000")
    private Long lastCheckTime;
}