package com.Stalk.project.signup.entity;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Advisor {
    private Long advisorId;               // users.id(FK)
    private String profileImageUrl;       // 프로필 이미지 URL
    private String certificateName;       // 자격증 명칭
    private String certificateFileSn;     // 합격증 번호
    private String birth;                 // 생년월일
    private String certificateFileNumber; // 발급번호
    private Integer consultationFee;      // 상담 비용 (기본 30000)
    private String publicContact;         // 공개 연락처
    private Boolean isApproved;           // 관리자 승인 여부
    private LocalDateTime approvedAt;     // 승인 일시
    private Boolean isProfileCompleted;   // 상세페이지 작성 여부
    private LocalDateTime createdAt;      // 생성 일시
    private LocalDateTime updatedAt;      // 수정 일시
}
