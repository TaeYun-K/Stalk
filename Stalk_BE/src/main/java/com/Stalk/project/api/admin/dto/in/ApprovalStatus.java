package com.Stalk.project.api.admin.dto.in;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ApprovalStatus {
    ALL("전체"),
    PENDING("대기중"),
    APPROVED("승인"),
    REJECTED("거절");

    private final String displayName;
}
