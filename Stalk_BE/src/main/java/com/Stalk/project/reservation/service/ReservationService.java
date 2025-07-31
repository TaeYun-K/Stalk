package com.Stalk.project.reservation.service;

import com.Stalk.project.reservation.dao.ReservationCancelCheckDto;
import com.Stalk.project.reservation.dao.ReservationMapper;
import com.Stalk.project.reservation.dto.in.CancelReason;
import com.Stalk.project.reservation.dto.in.ConsultationReservationRequestDto;
import com.Stalk.project.reservation.dto.in.ReservationCancelRequestDto;
import com.Stalk.project.reservation.dto.out.ConsultationReservationResponseDto;
import com.Stalk.project.reservation.dto.out.ReservationCancelResponseDto;
import com.Stalk.project.reservation.dto.out.ReservationDetailResponseDto;
import com.Stalk.project.exception.BaseException;
import com.Stalk.project.response.BaseResponseStatus;
import com.Stalk.project.util.CursorPage;
import com.Stalk.project.util.PageRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReservationService {

  private final ReservationMapper reservationMapper;

  /**
   * 상담 예약 생성 (토큰 기반 인증 적용), 동시성 이슈 해결
   *
   * @param currentUserId 현재 로그인한 사용자 ID (토큰에서 추출)
   * @param requestDto    예약 요청 정보
   * @return 예약 생성 결과
   */
  /**
   * 상담 예약 생성 - 동시성 이슈 완전 해결 버전
   */
  public ConsultationReservationResponseDto createConsultationReservation(
      Long currentUserId, String currentUserRole, ConsultationReservationRequestDto requestDto) {

    log.info("상담 예약 생성 시작: userId={}, role={}, advisorUserId={}",
        currentUserId, currentUserRole, requestDto.getAdvisorUserId());

    LocalDate requestDate = LocalDate.parse(requestDto.getDate());
    LocalTime requestTime = LocalTime.parse(requestDto.getTime());

    // 1. 기본 검증 (권한 포함)
    validateBasicReservationRequest(currentUserId, currentUserRole, requestDto.getAdvisorUserId(),
        requestDate, requestTime);

    // 2. 예약 생성 (DB 제약조건이 동시성 보호)
    Long reservationId = createReservationSafely(currentUserId, requestDto,
        requestDate, requestTime);

    // 3. 응답 생성
    ZonedDateTime scheduledTime = ZonedDateTime.of(requestDate, requestTime,
        ZoneId.of("Asia/Seoul"));

    log.info("상담 예약 생성 완료: userId={}, reservationId={}", currentUserId, reservationId);

    return ConsultationReservationResponseDto.builder()
        .reservationId(reservationId)
        .scheduledTime(scheduledTime.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
        .build();
  }

  /**
   * 예약 요청 검증
   */
  private void validateBasicReservationRequest(Long currentUserId, String currentUserRole,
      Long advisorUserId, LocalDate requestDate, LocalTime requestTime) {
    LocalDate today = LocalDate.now();

    // 0. 사용자 권한 확인 - 일반 사용자만 예약 가능
    if (!"USER".equals(currentUserRole)) {
      throw new BaseException(BaseResponseStatus.RESERVATION_USER_ONLY);
    }

    // 1. 과거 날짜 검증
    if (requestDate.isBefore(today)) {
      throw new BaseException(BaseResponseStatus.PAST_DATE_NOT_ALLOWED);
    }

    // 2. 당일 예약 방지
    if (requestDate.equals(today)) {
      throw new BaseException(BaseResponseStatus.SAME_DAY_RESERVATION_NOT_ALLOWED_NEW);
    }

    // 3. 주말 검증
    DayOfWeek dayOfWeek = requestDate.getDayOfWeek();
    if (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY) {
      throw new BaseException(BaseResponseStatus.WEEKEND_RESERVATION_NOT_ALLOWED);
    }

    // 4. 운영시간 검증 (09:00~20:00)
    if (requestTime.isBefore(LocalTime.of(9, 0)) || requestTime.isAfter(LocalTime.of(19, 0))) {
      throw new BaseException(BaseResponseStatus.OUTSIDE_BUSINESS_HOURS);
    }

    // 5. 전문가 존재 및 승인 여부 확인
    if (!reservationMapper.isApprovedAdvisor(advisorUserId)) {
      throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND);
    }

    // 6. 본인 예약 방지 (이제 USER만 예약하므로 실제로는 발생하지 않음)
    if (currentUserId.equals(advisorUserId)) {
      throw new BaseException(BaseResponseStatus.SELF_RESERVATION_NOT_ALLOWED);
    }

    // 7. 차단 시간 확인 (실시간 체크 필요)
    if (reservationMapper.isTimeBlocked(advisorUserId, requestDate, requestTime)) {
      throw new BaseException(BaseResponseStatus.TIME_SLOT_BLOCKED);
    }
  }

  /**
   * 안전한 예약 생성 (DB 제약조건 예외 처리 포함)
   */
  private Long createReservationSafely(Long currentUserId,
      ConsultationReservationRequestDto requestDto,
      LocalDate requestDate, LocalTime requestTime) {

    try {
      LocalTime endTime = requestTime.plusHours(1);

      int insertResult = reservationMapper.insertConsultationReservation(
          currentUserId,
          requestDto.getAdvisorUserId(),
          requestDate,
          requestTime,
          endTime,
          requestDto.getRequestMessage()
      );

      if (insertResult <= 0) {
        throw new BaseException(BaseResponseStatus.RESERVATION_CREATION_FAILED);
      }

      Long reservationId = reservationMapper.getLastInsertId();
      if (reservationId == null) {
        throw new BaseException(BaseResponseStatus.RESERVATION_CREATION_FAILED);
      }

      return reservationId;

    } catch (DataIntegrityViolationException e) {
      // DB 유니크 제약조건 위반 = 중복 예약 시도
      log.warn("중복 예약 시도 감지: advisorId={}, date={}, time={}",
          requestDto.getAdvisorUserId(), requestDate, requestTime, e);
      throw new BaseException(BaseResponseStatus.TIME_SLOT_ALREADY_RESERVED);

    } catch (BaseException e) {
      throw e;
    } catch (Exception e) {
      log.error("예약 생성 중 예상치 못한 오류", e);
      throw new BaseException(BaseResponseStatus.RESERVATION_CREATION_FAILED);
    }
  }

  /**
   * 예약 내역 조회 (사용자 타입별 동적 처리)
   */
  @Transactional(readOnly = true)
  public CursorPage<ReservationDetailResponseDto> getReservationList(Long userId,
      PageRequestDto pageRequest) {
    log.info("예약 내역 조회 시작: userId={}", userId);

    // 1. 사용자 role 조회
    String userRole = reservationMapper.getUserRole(userId);
    if (userRole == null) {
      throw new BaseException(BaseResponseStatus.USER_NOT_FOUND);
    }

    List<ReservationDetailResponseDto> reservations;

    // 2. 역할별 예약 내역 조회
    if ("ADVISOR".equals(userRole)) {
      // 전문가: advisor_id 조회 후 해당 전문가의 예약 내역
      Long advisorId = reservationMapper.getAdvisorIdByUserId(userId);
      if (advisorId == null) {
        throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND);
      }
      reservations = reservationMapper.findAdvisorReservations(advisorId, pageRequest);
    } else {
      // 일반 사용자: user_id로 직접 예약 내역 조회
      reservations = reservationMapper.findUserReservations(userId, pageRequest);
    }

    // 3. CursorPage 처리
    boolean hasNext = reservations.size() > pageRequest.getPageSize();
    if (hasNext) {
      reservations.remove(reservations.size() - 1);
    }

    log.info("예약 내역 조회 완료: userId={}, count={}", userId, reservations.size());

    return CursorPage.<ReservationDetailResponseDto>builder()
        .content(reservations)
        .nextCursor(null)
        .hasNext(hasNext)
        .pageSize(pageRequest.getPageSize())
        .pageNo(pageRequest.getPageNo())
        .build();
  }

  /**
   * 예약 취소 처리
   */
  public ReservationCancelResponseDto cancelReservation(Long reservationId, Long currentUserId,
      ReservationCancelRequestDto requestDto) {
    log.info("예약 취소 시작: reservationId={}, userId={}", reservationId, currentUserId);

    // 1. 예약 조회 및 검증
    ReservationCancelCheckDto reservation = reservationMapper.findReservationForCancel(
        reservationId);
    if (reservation == null) {
      throw new BaseException(BaseResponseStatus.RESERVATION_NOT_FOUND);
    }

    // 2. 취소 권한 확인
    if (!currentUserId.equals(reservation.getUserId()) && !currentUserId.equals(
        reservation.getAdvisorId())) {
      throw new BaseException(BaseResponseStatus.UNAUTHORIZED_CANCEL_REQUEST);
    }

    // 3. 취소 가능 상태 확인
    if (!"PENDING".equals(reservation.getStatus())) {
      if ("CANCELED".equals(reservation.getStatus())) {
        throw new BaseException(BaseResponseStatus.ALREADY_CANCELED_RESERVATION);
      } else {
        throw new BaseException(BaseResponseStatus.RESERVATION_NOT_CANCELABLE);
      }
    }

    // 4. 당일 취소 방지
    LocalDate today = LocalDate.now();
    if (reservation.getDate().equals(today) || reservation.getDate().isBefore(today)) {
      throw new BaseException(BaseResponseStatus.SAME_DAY_CANCEL_NOT_ALLOWED);
    }

    // 5. 예약 취소 처리
    LocalDateTime canceledAt = LocalDateTime.now();
    int updateResult = reservationMapper.cancelReservation(
        reservationId, currentUserId, requestDto.getCancelReason(),
        requestDto.getCancelMemo(), canceledAt);

    if (updateResult <= 0) {
      throw new BaseException(BaseResponseStatus.CANCEL_REQUEST_FAILED);
    }

    // 6. 상대방 알림 생성
    createCancelNotification(reservation, currentUserId);

    log.info("예약 취소 완료: reservationId={}, userId={}", reservationId, currentUserId);

    return ReservationCancelResponseDto.builder()
        .reservationId(reservationId)
        .canceledAt(canceledAt.atZone(ZoneId.of("Asia/Seoul"))
            .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
        .message("예약이 성공적으로 취소되었습니다.")
        .build();
  }

  /**
   * 취소 알림 생성
   */
  private void createCancelNotification(ReservationCancelCheckDto reservation, Long canceledBy) {
    try {
      // 알림 대상 결정 (취소한 사람이 아닌 상대방)
      Long notificationTargetUserId;
      String canceledByName;

      if (canceledBy.equals(reservation.getUserId())) {
        // 일반 사용자가 취소 → 전문가에게 알림
        notificationTargetUserId = reservation.getAdvisorId();
        canceledByName = reservation.getClientName();
      } else {
        // 전문가가 취소 → 일반 사용자에게 알림
        notificationTargetUserId = reservation.getUserId();
        canceledByName = reservation.getAdvisorName();
      }

      // 알림 메시지 생성
      String notificationMessage = String.format(
          "%s님이 %s %s 상담 예약을 취소하였습니다.",
          canceledByName,
          reservation.getDate(),
          reservation.getStartTime()
      );

      // 알림 저장
      reservationMapper.createNotification(
          notificationTargetUserId,
          "RESERVATION_CANCELED",
          "예약 취소 알림",
          notificationMessage,
          reservation.getId()
      );

      log.info("취소 알림 생성 완료: targetUserId={}, message={}",
          notificationTargetUserId, notificationMessage);

    } catch (Exception e) {
      log.error("알림 생성 중 오류 (예약 취소는 성공): reservationId={}",
          reservation.getId(), e);
      // 알림 생성 실패해도 예약 취소 자체는 성공으로 처리
    }
  }
}