package com.Stalk.project.global.notification.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

// 기본 알람 이벤트
@Getter
@AllArgsConstructor
public abstract class NotificationEvent {
    private final Long targetUserId;
    private final String message;
}