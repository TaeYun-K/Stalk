package com.Stalk.project.reservation.dto.in;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 예약 취소 사유
 */
public enum CancelReason {
    PERSONAL_REASON("개인사정"),
    SCHEDULE_CHANGE("일정변경"),
    HEALTH_ISSUE("건강상 이유"),
    NO_LONGER_NEEDED("상담 불필요"),
    OTHER("기타");

    private final String description;

    CancelReason(String description) {
        this.description = description;
    }

    @JsonValue
    public String getDescription() {
        return description;
    }

    @JsonCreator
    public static CancelReason fromString(String value) {
        for (CancelReason reason : CancelReason.values()) {
            if (reason.name().equals(value) || reason.description.equals(value)) {
                return reason;
            }
        }
        throw new IllegalArgumentException("Invalid CancelReason: " + value);
    }
}
