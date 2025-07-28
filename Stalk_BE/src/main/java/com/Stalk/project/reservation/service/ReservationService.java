package com.Stalk.project.reservation.service;

import com.Stalk.project.exception.BaseException;
import com.Stalk.project.reservation.dao.ReservationCancelCheckDto;
import com.Stalk.project.reservation.dao.ReservationMapper;
import com.Stalk.project.reservation.dto.in.ConsultationReservationRequestDto;
import com.Stalk.project.reservation.dto.in.ReservationCancelRequestDto;
import com.Stalk.project.reservation.dto.out.ConsultationReservationResponseDto;
import com.Stalk.project.reservation.dto.out.ReservationCancelResponseDto;
import com.Stalk.project.reservation.dto.out.ReservationDetailResponseDto;
import com.Stalk.project.response.BaseResponseStatus;
import com.Stalk.project.util.CursorPage;
import com.Stalk.project.util.PageRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationService {

  // 운영시간 상수
  private static final LocalTime BUSINESS_START_TIME = LocalTime.of(9, 0);
  private static final LocalTime BUSINESS_END_TIME = LocalTime.of(20, 0);
  private final ReservationMapper reservationMapper;

  @Transactional
  public ConsultationReservationResponseDto createConsultationReservation(
      ConsultationReservationRequestDto requestDto) {

    // TODO: JWT에서 사용자 ID 추출 (현재는 Mock)
    Long currentUserId = 1001L;

    // 1. 기본 데이터 파싱 및 검증
    LocalDate reservationDate = parseAndValidateDate(requestDto.getDate());
    LocalTime startTime = parseAndValidateTime(requestDto.getTime());
    LocalTime endTime = startTime.plusHours(1); // 1시간 단위

    // 2. 비즈니스 규칙 검증
    validateBusinessRules(currentUserId, requestDto.getAdvisorUserId(),
        reservationDate, startTime, endTime);

    // 3. 예약 생성
    int result = reservationMapper.createConsultationReservation(
        currentUserId,
        requestDto.getAdvisorUserId(),
        reservationDate,
        startTime,
        endTime,
        requestDto.getRequestMessage()
    );

    if (result == 0) {
      throw new BaseException(BaseResponseStatus.RESERVATION_CREATION_FAILED);
    }

    // 4. 생성된 예약 ID 조회
    Long reservationId = reservationMapper.getLastInsertId();

    // 5. ISO 8601 형식으로 일시 생성
    LocalDateTime scheduledDateTime = LocalDateTime.of(reservationDate, startTime);
    String scheduledTime =
        scheduledDateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "+09:00";

    return ConsultationReservationResponseDto.builder()
        .reservationId(reservationId)
        .scheduledTime(scheduledTime)
        .build();
  }

  private LocalDate parseAndValidateDate(String dateStr) {
    try {
      return LocalDate.parse(dateStr);
    } catch (DateTimeParseException e) {
      throw new BaseException(BaseResponseStatus.PAST_DATE_NOT_ALLOWED);
    }
  }

  private LocalTime parseAndValidateTime(String timeStr) {
    try {
      LocalTime time = LocalTime.parse(timeStr);

      // 정시 여부 확인
      if (time.getMinute() != 0 || time.getSecond() != 0) {
        throw new BaseException(BaseResponseStatus.INVALID_TIME_FORMAT);
      }

      return time;
    } catch (DateTimeParseException e) {
      throw new BaseException(BaseResponseStatus.INVALID_TIME_FORMAT);
    }
  }

  private void validateBusinessRules(Long userId, Long advisorUserId,
      LocalDate date, LocalTime startTime, LocalTime endTime) {

    LocalDate today = LocalDate.now();

    // 1. 과거 날짜 검증
    if (date.isBefore(today)) {
      throw new BaseException(BaseResponseStatus.PAST_DATE_NOT_ALLOWED);
    }

    // 2. 당일 예약 불가
    if (date.equals(today)) {
      throw new BaseException(BaseResponseStatus.SAME_DAY_RESERVATION_NOT_ALLOWED_NEW);
    }

    // 3. 주말 예약 불가
    DayOfWeek dayOfWeek = date.getDayOfWeek();
    if (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY) {
      throw new BaseException(BaseResponseStatus.WEEKEND_RESERVATION_NOT_ALLOWED);
    }

    // 4. 운영시간 검증
    if (startTime.isBefore(BUSINESS_START_TIME) || endTime.isAfter(BUSINESS_END_TIME)) {
      throw new BaseException(BaseResponseStatus.OUTSIDE_BUSINESS_HOURS);
    }

    // 5. 전문가 존재 및 승인 여부 확인
    Boolean advisorExists = reservationMapper.isAdvisorExistsAndApproved(advisorUserId);
    if (advisorExists == null || !advisorExists) {
      throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND);
    }

    // 6. 본인 예약 방지
    if (userId.equals(advisorUserId)) {
      throw new BaseException(BaseResponseStatus.SELF_RESERVATION_NOT_ALLOWED);
    }

    // 7. 차단 시간 확인
    Boolean isBlocked = reservationMapper.isTimeSlotBlocked(advisorUserId, date, startTime,
        endTime);
    if (isBlocked != null && isBlocked) {
      throw new BaseException(BaseResponseStatus.TIME_SLOT_BLOCKED);
    }

    // 8. 기존 예약 확인
    Boolean isReserved = reservationMapper.isTimeSlotReserved(advisorUserId, date, startTime,
        endTime);
    if (isReserved != null && isReserved) {
      throw new BaseException(BaseResponseStatus.TIME_SLOT_ALREADY_RESERVED);
    }
  }

  /**
   * 예약 취소
   */
  public ReservationCancelResponseDto cancelReservation(Long reservationId, Long currentUserId, ReservationCancelRequestDto requestDto) {

    // 1. 예약 존재 및 기본 정보 확인
    ReservationCancelCheckDto reservation = reservationMapper.findReservationForCancel(reservationId);
    if (reservation == null) {
      throw new BaseException(BaseResponseStatus.RESERVATION_NOT_FOUND);
    }

    // 2. 취소 권한 확인 (본인이 관련된 예약인지)
    if (!reservation.getUserId().equals(currentUserId) && !reservation.getAdvisorId().equals(currentUserId)) {
      throw new BaseException(BaseResponseStatus.UNAUTHORIZED_CANCEL_REQUEST);
    }

    // 3. 취소 가능한 상태인지 확인 (PENDING 상태만 취소 가능)
    if (!"PENDING".equals(reservation.getStatus())) {
      if ("CANCELED".equals(reservation.getStatus())) {
        throw new BaseException(BaseResponseStatus.ALREADY_CANCELED_RESERVATION);
      } else {
        throw new BaseException(BaseResponseStatus.RESERVATION_NOT_CANCELABLE);
      }
    }

    // 4. 당일 취소 방지 (전날까지만 취소 가능)
    LocalDate reservationDate = LocalDate.parse(reservation.getDate());
    LocalDate today = LocalDate.now();
    if (!reservationDate.isAfter(today)) {
      throw new BaseException(BaseResponseStatus.SAME_DAY_CANCEL_NOT_ALLOWED);
    }

    // 5. 예약 취소 처리
    LocalDateTime canceledAt = LocalDateTime.now();
    int updateResult = reservationMapper.cancelReservation(
                    reservationId,
                    currentUserId,
                    requestDto.getCancelReason(),
                    requestDto.getCancelMemo(),
                    canceledAt
    );

    if (updateResult == 0) {
      throw new BaseException(BaseResponseStatus.CANCEL_REQUEST_FAILED);
    }

    // 6. 상대방에게 알림 생성
    createCancelNotification(reservation, currentUserId);

    // 7. 응답 생성
    String canceledAtFormatted = canceledAt.atZone(ZoneId.of("Asia/Seoul"))
                    .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

    return new ReservationCancelResponseDto(
                    reservationId,
                    canceledAtFormatted,
                    "예약이 성공적으로 취소되었습니다."
    );
  }

  /**
   * 취소 알림 생성
   */
  private void createCancelNotification(ReservationCancelCheckDto reservation, Long canceledBy) {
    // 취소한 사람이 일반 사용자면 → 전문가에게 알림
    // 취소한 사람이 전문가면 → 일반 사용자에게 알림

    Long targetUserId;
    String canceledByName;
    String targetName;

    if (reservation.getUserId().equals(canceledBy)) {
      // 일반 사용자가 취소 → 전문가에게 알림
      targetUserId = reservation.getAdvisorId();
      canceledByName = reservation.getClientName();
      targetName = reservation.getAdvisorName();
    } else {
      // 전문가가 취소 → 일반 사용자에게 알림
      targetUserId = reservation.getUserId();
      canceledByName = reservation.getAdvisorName();
      targetName = reservation.getClientName();
    }

    String title = "상담 예약이 취소되었습니다";
    String message = String.format("%s님이 %s %s 상담 예약을 취소하였습니다.",
                    canceledByName,
                    reservation.getDate(),
                    reservation.getStartTime());

    reservationMapper.createNotification(
                    targetUserId,
                    "RESERVATION_CANCELED",
                    title,
                    message,
                    reservation.getId()
    );
  }

  public CursorPage<ReservationDetailResponseDto> getReservationList(Long userId, PageRequestDto pageRequest) {

    // 1. 사용자 존재 및 role 확인
    String userRole = reservationMapper.getUserRole(userId);
    if (userRole == null) {
      throw new BaseException(BaseResponseStatus.NO_EXIST_USER);
    }

    // 2. 사용자 타입에 따라 다른 쿼리 실행
    List<ReservationDetailResponseDto> reservations;

    if ("ADVISOR".equals(userRole)) {
      // 전문가인 경우: advisor_id 조회 후 해당 전문가의 예약 내역 조회
      Long advisorId = reservationMapper.getAdvisorIdByUserId(userId);
      if (advisorId == null) {
        throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND);
      }
      reservations = reservationMapper.findAdvisorReservations(advisorId, pageRequest);
    } else {
      // 일반 사용자인 경우: user_id로 예약 내역 조회
      reservations = reservationMapper.findUserReservations(userId, pageRequest);
    }

    // 3. CursorPage 생성
    boolean hasNext = reservations.size() > pageRequest.getPageSize();
    if (hasNext) {
      reservations.remove(reservations.size() - 1); // 마지막 요소 제거
    }

    Long nextCursor = null;
    if (hasNext && !reservations.isEmpty()) {
      nextCursor = reservations.get(reservations.size() - 1).getReservationId();
    }

    return CursorPage.<ReservationDetailResponseDto>builder()
                    .content(reservations)
                    .nextCursor(nextCursor)
                    .hasNext(hasNext)
                    .pageSize(pageRequest.getPageSize())
                    .pageNo(pageRequest.getPageNo())
                    .build();
  }
}
