package com.Stalk.project.admin.dto.in;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RejectionReason {
    INVALID_CERTIFICATE("자격증 정보 오류"),
    EXPIRED_CERTIFICATE("자격증 만료"),
    INSUFFICIENT_DOCUMENTS("서류 미비"),
    VERIFICATION_FAILED("신원 확인 실패"),
    OTHER("기타");

    private final String displayName;
}
