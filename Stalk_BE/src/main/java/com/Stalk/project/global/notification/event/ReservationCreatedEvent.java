package com.Stalk.project.global.notification.event;

import lombok.Getter;

@Getter
public class ReservationCreatedEvent extends NotificationEvent {
    private final Long advisorUserId;
    private final String clientName;
    private final String dateTime;
    
    public ReservationCreatedEvent(Long advisorUserId, String clientName, String dateTime) {
        super(advisorUserId, String.format("%s님이 %s 상담을 예약했습니다.", clientName, dateTime));
        this.advisorUserId = advisorUserId;
        this.clientName = clientName;
        this.dateTime = dateTime;
    }
}