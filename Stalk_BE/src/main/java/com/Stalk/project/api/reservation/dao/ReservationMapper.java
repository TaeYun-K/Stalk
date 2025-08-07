package com.Stalk.project.api.reservation.dao;

import com.Stalk.project.api.reservation.dto.ReservationCancelCheckDto;
import com.Stalk.project.api.reservation.dto.ReservationCancelWithPaymentCheckDto;
import com.Stalk.project.api.reservation.dto.in.CancelReason;
import com.Stalk.project.api.payment.dto.PaymentReservationDto;
import com.Stalk.project.api.payment.dto.UserInfoDto;
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
   * 결제 대기 상태로 예약 생성
   */
  Long createPendingReservation(PaymentReservationDto reservationDto);

  /**
   * 결제 성공 시 예약 정보 업데이트
   */
  int updateReservationPaymentSuccess(
      @Param("orderId") String orderId,
      @Param("paymentKey") String paymentKey,
      @Param("paymentMethod") String paymentMethod,
      @Param("cardCompany") String cardCompany,
      @Param("receiptUrl") String receiptUrl,
      @Param("approvedAt") String approvedAt
  );

  /**
   * 결제 실패 시 예약 정보 업데이트
   */
  int updateReservationPaymentFailure(
      @Param("orderId") String orderId,
      @Param("failureCode") String failureCode,
      @Param("failureReason") String failureReason
  );

  /**
   * 주문번호로 예약 정보 조회
   */
  PaymentReservationDto findReservationByOrderId(@Param("orderId") String orderId);

  /**
   * 어드바이저 존재 및 승인 여부 확인
   */
  boolean isValidAdvisor(@Param("advisorId") Long advisorId);

  /**
   * 어드바이저 이름 조회
   */
  String getAdvisorNameById(@Param("advisorId") Long advisorId);

  /**
   * 사용자 정보 조회 (이름, 이메일)
   */
  UserInfoDto getUserInfoById(@Param("userId") Long userId);

  /**
   * 예약 시간 중복 체크
   */
  int checkReservationConflict(
      @Param("advisorId") Long advisorId,
      @Param("date") String date,
      @Param("startTime") String startTime
  );

  /**
   * 결제 취소 시 예약 정보 업데이트
   */
  int updateReservationPaymentCancellation(
      @Param("orderId") String orderId,
      @Param("cancelReason") String cancelReason,
      @Param("canceledAt") String canceledAt
  );

  /**
   * 예약 상세 조회 (취소용, 결제 정보 포함)
   */
  ReservationCancelWithPaymentCheckDto findReservationForCancelWithPayment(@Param("reservationId") Long reservationId);

  /**
   * 예약 취소 + 결제 정보 업데이트
   */
  int cancelReservationWithPayment(
      @Param("reservationId") Long reservationId,
      @Param("canceledBy") Long canceledBy,
      @Param("cancelReason") String cancelReason,
      @Param("cancelMemo") String cancelMemo,
      @Param("canceledAt") LocalDateTime canceledAt
  );

  /**
   * 예약 삭제
   */
  int deleteReservation(@Param("reservationId") Long reservationId);

  Long getReservationIdByOrderId(String orderId);
}