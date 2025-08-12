package com.Stalk.project.global.notification.event;

import lombok.Getter;

@Getter
public class ReservationCanceledEvent extends NotificationEvent {
    private final String canceledByName;
    private final String dateTime;
    private final String reason;
    
    public ReservationCanceledEvent(Long targetUserId, String canceledByName, String dateTime, String reason) {
        super(targetUserId, String.format("%s님이 %s 상담 예약을 취소했습니다. (사유: %s)", canceledByName, dateTime, reason));
        this.canceledByName = canceledByName;
        this.dateTime = dateTime;
        this.reason = reason;
    }
}