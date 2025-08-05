package com.Stalk.project.global.notification.dto.in;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationType {
    
    // 예약 관련 알람
    RESERVATION_CREATED("RESERVATION_CREATED", "새로운 상담 예약이 있습니다"),
    RESERVATION_CANCELED("RESERVATION_CANCELED", "상담 예약이 취소되었습니다"),
    RESERVATION_APPROVED("RESERVATION_APPROVED", "상담 예약이 승인되었습니다"),
    
    // 커뮤니티 관련 알람
    COMMENT_CREATED("COMMENT_CREATED", "새로운 댓글이 등록되었습니다"),
    
    // 시스템 알람 (확장성 고려)
    SYSTEM_NOTICE("SYSTEM_NOTICE", "시스템 공지사항"),
    SYSTEM_MAINTENANCE("SYSTEM_MAINTENANCE", "시스템 점검 안내");
    
    private final String code;
    private final String defaultMessage;
    
    /**
     * 코드로 NotificationType 찾기
     */
    public static NotificationType fromCode(String code) {
        for (NotificationType type : values()) {
            if (type.getCode().equals(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown notification type code: " + code);
    }
    
    /**
     * 예약 관련 알람인지 확인
     */
    public boolean isReservationRelated() {
        return this == RESERVATION_CREATED || 
               this == RESERVATION_CANCELED || 
               this == RESERVATION_APPROVED;
    }
    
    /**
     * 커뮤니티 관련 알람인지 확인
     */
    public boolean isCommunityRelated() {
        return this == COMMENT_CREATED;
    }
    
    /**
     * 시스템 관련 알람인지 확인
     */
    public boolean isSystemRelated() {
        return this == SYSTEM_NOTICE || this == SYSTEM_MAINTENANCE;
    }
}