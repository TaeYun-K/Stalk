package com.Stalk.project.api.reservation.dao;

import com.Stalk.project.api.reservation.dto.in.CancelReason;
import com.Stalk.project.api.reservation.dto.out.ReservationDetailResponseDto;
import com.Stalk.project.global.util.PageRequestDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Mapper
public interface ReservationMapper {

  /**
   * 전문가 존재 및 승인 여부 확인 ReservationService에서 isApprovedAdvisor() 로 호출
   */
  Boolean isApprovedAdvisor(@Param("advisorUserId") Long advisorUserId);

  /**
   * 전문가 차단 시간 확인 ReservationService에서 isTimeBlocked() 로 호출 (시간 범위 체크)
   */
  Boolean isTimeBlocked(@Param("advisorUserId") Long advisorUserId,
      @Param("date") LocalDate date,
      @Param("startTime") LocalTime startTime);

  /**
   * 기존 예약 존재 여부 확인 ReservationService에서 isTimeAlreadyReserved() 로 호출 (시간 범위 체크)
   */
  Boolean isTimeAlreadyReserved(@Param("advisorUserId") Long advisorUserId,
      @Param("date") LocalDate date,
      @Param("startTime") LocalTime startTime);

  /**
   * 상담 예약 생성 ReservationService에서 insertConsultationReservation() 로 호출
   */
  int insertConsultationReservation(@Param("userId") Long userId,
      @Param("advisorUserId") Long advisorUserId,
      @Param("date") LocalDate date,
      @Param("startTime") LocalTime startTime,
      @Param("endTime") LocalTime endTime,
      @Param("requestMessage") String requestMessage);

  /**
   * 마지막 생성된 예약 ID 조회
   */
  Long getLastInsertId();

  /**
   * 사용자 role 조회
   */
  String getUserRole(@Param("userId") Long userId);

  /**
   * 사용자 ID로 advisor_id 조회
   */
  Long getAdvisorIdByUserId(@Param("userId") Long userId);

  /**
   * 전문가의 예약 내역 조회 (전문가용)
   */
  List<ReservationDetailResponseDto> findAdvisorReservations(
      @Param("advisorId") Long advisorId,
      @Param("pageRequest") PageRequestDto pageRequest);

  /**
   * 일반 사용자의 예약 내역 조회 (일반 사용자용)
   */
  List<ReservationDetailResponseDto> findUserReservations(
      @Param("userId") Long userId,
      @Param("pageRequest") PageRequestDto pageRequest);

  /**
   * 예약 상세 조회 (취소 가능 여부 확인용)
   */
  ReservationCancelCheckDto findReservationForCancel(@Param("reservationId") Long reservationId);

  /**
   * 예약 취소 처리
   */
  int cancelReservation(@Param("reservationId") Long reservationId,
      @Param("canceledBy") Long canceledBy,
      @Param("cancelReason") CancelReason cancelReason,
      @Param("cancelMemo") String cancelMemo,
      @Param("canceledAt") LocalDateTime canceledAt);

  /**
   * 알림 생성
   */
  int createNotification(@Param("userId") Long userId,
      @Param("type") String type,
      @Param("title") String title,
      @Param("message") String message,
      @Param("relatedId") Long relatedId);
}