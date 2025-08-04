package com.Stalk.project.api.reservation.dao;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 예약 취소 가능 여부 확인용 DTO MyBatis에서 findReservationForCancel 쿼리 결과를 매핑하는 용도
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ReservationCancelCheckDto {

  private Long id;                // 예약 ID
  private Long userId;            // 예약한 일반 사용자 ID
  private Long advisorId;         // 전문가 ID (advisor 테이블의 advisor_id)
  private LocalDate date;         // 상담 날짜
  private LocalTime startTime;    // 상담 시작 시간
  private String status;          // 예약 상태 (PENDING, APPROVED, CANCELED)
  private String advisorName;     // 전문가 이름
  private String clientName;      // 고객 이름
}