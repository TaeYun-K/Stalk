package com.Stalk.project.global.notification.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 알람 읽음 처리 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "알람 읽음 처리 응답 DTO")
public class NotificationReadResponseDto {
    
    @Schema(description = "처리된 알람 ID", example = "1")
    private Long notificationId;
    
    @Schema(description = "처리 결과 메시지", example = "알람을 읽음으로 처리했습니다.")
    private String message;
}