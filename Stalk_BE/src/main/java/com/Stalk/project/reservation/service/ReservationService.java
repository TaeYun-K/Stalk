package com.Stalk.project.reservation.service;

import com.Stalk.project.exception.BaseException;
import com.Stalk.project.reservation.dao.ReservationMapper;
import com.Stalk.project.reservation.dto.in.ConsultationReservationRequestDto;
import com.Stalk.project.reservation.dto.out.ConsultationReservationResponseDto;
import com.Stalk.project.response.BaseResponseStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

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
}