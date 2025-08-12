package com.Stalk.project.api.advisor.dto.in;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PreferredTradeStyle {
    SHORT("단기"),
    MID_SHORT("중단기"),
    MID("중기"),
    MID_LONG("중장기"),
    LONG("장기");

    private final String displayName;

    PreferredTradeStyle(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    // JSON 역직렬화할 때 한글/영문 둘 다 처리
    @JsonCreator
    public static PreferredTradeStyle fromString(String value) {
        if (value == null) return null;

        // 한글 값으로 찾기
        for (PreferredTradeStyle style : values()) {
            if (style.displayName.equals(value)) {
                return style;
            }
        }

        // 영문 값으로 찾기 (기존 호환성)
        try {
            return PreferredTradeStyle.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid PreferredTradeStyle: " + value);
        }
    }
}
