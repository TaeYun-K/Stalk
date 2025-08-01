package com.Stalk.project.reservation.dto.out;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReservationDetailResponseDto {
    
    // 공통 필드
    private Long reservationId;
    private String consultationDate;      // "2025-07-15"
    private String consultationTime;      // "15:00"
    private String requestMessage;        // 상담 요청 사항
    private String status;                // PENDING, APPROVED, CANCELED
    private String createdAt;             // ISO 8601 형식
    
    // 전문가용 필드 (일반 사용자에게는 null)
    private String clientName;            // 상담 요청자 이름
    private Long clientUserId;            // 상담 요청자 user_id
    
    // 일반 사용자용 필드 (전문가에게는 null)
    private String advisorName;           // 전문 상담가 이름
    private Long advisorUserId;           // 전문가 user_id
    private String profileImageUrl;       // 전문가 프로필 이미지
}
