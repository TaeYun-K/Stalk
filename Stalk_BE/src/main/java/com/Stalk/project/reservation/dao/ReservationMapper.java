package com.Stalk.project.reservation.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.time.LocalDate;
import java.time.LocalTime;

@Mapper
public interface ReservationMapper {

  /**
   * 전문가 존재 및 승인 여부 확인
   */
  Boolean isAdvisorExistsAndApproved(@Param("advisorUserId") Long advisorUserId);

  /**
   * 전문가 차단 시간 확인
   */
  Boolean isTimeSlotBlocked(@Param("advisorUserId") Long advisorUserId,
      @Param("date") LocalDate date,
      @Param("startTime") LocalTime startTime,
      @Param("endTime") LocalTime endTime);

  /**
   * 기존 예약 존재 여부 확인
   */
  Boolean isTimeSlotReserved(@Param("advisorUserId") Long advisorUserId,
      @Param("date") LocalDate date,
      @Param("startTime") LocalTime startTime,
      @Param("endTime") LocalTime endTime);

  /**
   * 상담 예약 생성
   */
  int createConsultationReservation(@Param("userId") Long userId,
      @Param("advisorUserId") Long advisorUserId,
      @Param("date") LocalDate date,
      @Param("startTime") LocalTime startTime,
      @Param("endTime") LocalTime endTime,
      @Param("requestMessage") String requestMessage);

  /**
   * 마지막 생성된 예약 ID 조회
   */
  Long getLastInsertId();
}