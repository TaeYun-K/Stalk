package com.Stalk.project.api.reservation.service;

import static com.Stalk.project.global.response.BaseResponseStatus.CANCEL_REQUEST_FAILED;
import static com.Stalk.project.global.response.BaseResponseStatus.PAYMENT_CANCEL_FAILED;
import static com.Stalk.project.global.util.SecurityUtil.getCurrentUserPrimaryId;

import com.Stalk.project.api.advisor.dao.AdvisorMapper;
import com.Stalk.project.api.payment.dto.PaymentReservationDto;
import com.Stalk.project.api.payment.dto.in.PaymentCancelRequestDto;
import com.Stalk.project.api.payment.dto.in.PaymentPrepareRequestDto;
import com.Stalk.project.api.payment.dto.out.PaymentPrepareResponseDto;
import com.Stalk.project.api.payment.service.PaymentService;
import com.Stalk.project.api.reservation.dao.ReservationMapper;
import com.Stalk.project.api.reservation.dto.ReservationCancelWithPaymentCheckDto;
import com.Stalk.project.api.reservation.dto.in.CancelReason;
import com.Stalk.project.api.reservation.dto.in.PaymentReservationRequestDto;
import com.Stalk.project.api.reservation.dto.in.ReservationCancelRequestDto;
import com.Stalk.project.api.reservation.dto.out.PaymentReservationResponseDto;
import com.Stalk.project.api.reservation.dto.out.ReservationCancelResponseDto;
import com.Stalk.project.api.reservation.dto.out.ReservationDetailResponseDto;
import com.Stalk.project.api.user.dao.UserProfileMapper;
import com.Stalk.project.api.user.dto.out.UserProfileResponseDto;
import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.notification.event.ReservationCanceledEvent;
import com.Stalk.project.global.response.BaseResponseStatus;
import com.Stalk.project.global.util.CursorPage;
import com.Stalk.project.global.util.PageRequestDto;
import com.Stalk.project.global.util.SecurityUtil;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ReservationService {

  private final ReservationMapper reservationMapper;
  private final AdvisorMapper advisorMapper;
  private final PaymentService paymentService;
  private final UserProfileMapper userProfileMapper; // ✅ 이벤트 발행용 추가
  private final ApplicationEventPublisher eventPublisher; // ✅ 이벤트 발행용 추가

  /**
   * 결제를 포함한 상담 예약 생성
   */
  public PaymentReservationResponseDto createReservationWithPayment(
      PaymentReservationRequestDto requestDto) {

    Long currentUserId = getCurrentUserPrimaryId();
    log.info("결제 포함 예약 생성 시작: userId={}, advisorUserId={}",
        currentUserId, requestDto.getAdvisorUserId());

    LocalDate requestDate = LocalDate.parse(requestDto.getDate());
    LocalTime requestTime = LocalTime.parse(requestDto.getTime());

    // 1. 기본 검증 (기존 로직 재사용)
    validateBasicReservationRequest(currentUserId, requestDto.getAdvisorUserId(),
        requestDate, requestTime);

    // 2. 상담료 조회
    Integer consultationFee = advisorMapper.getConsultationFee(requestDto.getAdvisorUserId());
    if (consultationFee == null || consultationFee <= 0) {
      throw new BaseException(BaseResponseStatus.CONSULTATION_FEE_NOT_FOUND);
    }

    // 3. PaymentService의 새로운 메서드 활용
    PaymentPrepareRequestDto paymentRequest = PaymentPrepareRequestDto.builder()
        .advisorId(requestDto.getAdvisorUserId())
        .consultationDate(requestDto.getDate())
        .consultationTime(requestDto.getTime())
        .requestMessage(requestDto.getRequestMessage())
        .build();

    PaymentPrepareResponseDto paymentResponse = paymentService.preparePaymentWithAdvisorFee(
        paymentRequest, currentUserId, consultationFee);

    // 4. 응답 생성
    ZonedDateTime scheduledTime = ZonedDateTime.of(requestDate, requestTime,
        ZoneId.of("Asia/Seoul"));

    log.info("결제 포함 예약 생성 완료: userId={}, reservationId={}, orderId={}, amount={}",
        currentUserId, paymentResponse.getReservationId(), paymentResponse.getOrderId(), paymentResponse.getAmount());

    return PaymentReservationResponseDto.builder()
        .reservationId(paymentResponse.getReservationId())
        .scheduledTime(scheduledTime.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
        .orderId(paymentResponse.getOrderId())
        .amount(paymentResponse.getAmount())
        .paymentData(paymentResponse) // 토스페이먼츠 SDK에 필요한 모든 정보
        .build();
  }

  /**
   * 예약 요청 검증 (SecurityUtil 활용)
   */
  private void validateBasicReservationRequest(Long currentUserId, Long advisorUserId,
      LocalDate requestDate, LocalTime requestTime) {
    LocalDate today = LocalDate.now();

    // 0. 사용자 권한 확인 - 일반 사용자만 예약 가능
    if (!SecurityUtil.isCurrentUserRegularUser()) {
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

    // 6. 본인 예약 방지 (USER가 ADVISOR 예약하는 경우는 없지만 안전장치)
    if (currentUserId.equals(advisorUserId)) {
      throw new BaseException(BaseResponseStatus.SELF_RESERVATION_NOT_ALLOWED);
    }

    // 7. 차단 시간 확인 (실시간 체크 필요)
    if (reservationMapper.isTimeBlocked(advisorUserId, requestDate, requestTime)) {
      throw new BaseException(BaseResponseStatus.TIME_SLOT_BLOCKED);
    }
  }

  /**
   * 주문 ID 생성
   */
  private String generateOrderId(Long userId, Long advisorId) {
    String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    return String.format("CONSULT_%s_%d_%d", timestamp, userId, advisorId);
  }

  /**
   * 임시 예약 생성 (결제 대기 상태)
   */
  private Long createPendingReservation(Long currentUserId, PaymentReservationRequestDto requestDto,
      LocalDate requestDate, LocalTime requestTime, String orderId, Integer amount) {

    try {
      LocalTime endTime = requestTime.plusHours(1);

      PaymentReservationDto reservationDto = PaymentReservationDto.builder()
          .userId(currentUserId)
          .advisorId(requestDto.getAdvisorUserId())
          .date(requestDate.toString())
          .startTime(requestTime.toString())
          .endTime(endTime.toString())
          .requestMessage(requestDto.getRequestMessage())
          .orderId(orderId)
          .amount(amount)
          .build();

      Long insertResult = reservationMapper.createPendingReservation(reservationDto);

      if (insertResult <= 0) {
        throw new BaseException(BaseResponseStatus.RESERVATION_CREATION_FAILED);
      }

      if (reservationDto.getId() == null) {
        throw new BaseException(BaseResponseStatus.RESERVATION_CREATION_FAILED);
      }

      return reservationDto.getId();

    } catch (DataIntegrityViolationException e) {
      log.warn("중복 예약 시도 감지: advisorId={}, date={}, time={}",
          requestDto.getAdvisorUserId(), requestDate, requestTime, e);
      throw new BaseException(BaseResponseStatus.TIME_SLOT_ALREADY_RESERVED);
    } catch (BaseException e) {
      throw e;
    } catch (Exception e) {
      log.error("결제 포함 예약 생성 중 예상치 못한 오류", e);
      throw new BaseException(BaseResponseStatus.RESERVATION_CREATION_FAILED);
    }
  }
  /**
   * 예약 취소 처리 (SecurityUtil 기반 + 결제 연동)
   */
  @Transactional
  public ReservationCancelResponseDto cancelReservation(Long reservationId,
      ReservationCancelRequestDto requestDto) {
    Long currentUserId = getCurrentUserPrimaryId();

    log.info("예약 취소 시작: reservationId={}, userId={}", reservationId, currentUserId);

    try {
      // 1. 예약 조회 및 검증 (결제 정보 포함)
      ReservationCancelWithPaymentCheckDto reservation =
          reservationMapper.findReservationForCancelWithPayment(reservationId);

      if (reservation == null) {
        throw new BaseException(BaseResponseStatus.RESERVATION_NOT_FOUND);
      }

      // 2. 취소 권한 확인
      if (!currentUserId.equals(reservation.getUserId()) &&
          !currentUserId.equals(reservation.getAdvisorId())) {
        throw new BaseException(BaseResponseStatus.UNAUTHORIZED_CANCEL_REQUEST);
      }

      // 3. 취소 가능 상태 확인 (결제 상태 고려)
      validateCancelableStatusWithPayment(reservation);

      // 4. 당일 취소 방지
      LocalDate today = LocalDate.now();
      if (reservation.getDate().equals(today) || reservation.getDate().isBefore(today)) {
        throw new BaseException(BaseResponseStatus.SAME_DAY_CANCEL_NOT_ALLOWED);
      }

      // 5. 결제 상태별 취소 처리
      LocalDateTime canceledAt = LocalDateTime.now();
      String cancelMessage = processCancellationByPaymentStatus(
          reservation, currentUserId, requestDto, canceledAt);

      // 6. ✅ 이벤트 발행 (알림을 위함)
      publishCancelEvent(reservation, currentUserId, requestDto);

      log.info("예약 취소 완료: reservationId={}, userId={}", reservationId, currentUserId);

      return ReservationCancelResponseDto.builder()
          .reservationId(reservationId)
          .canceledAt(canceledAt.atZone(ZoneId.of("Asia/Seoul"))
              .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
          .message(cancelMessage)
          .build();

    } catch (BaseException e) {
      throw e;
    } catch (Exception e) {
      log.error("예약 취소 처리 중 오류 발생: reservationId={}", reservationId, e);
      throw new BaseException(CANCEL_REQUEST_FAILED);
    }
  }

  /**
   * 예약만 취소 (결제 처리 없음)
   */
  private void cancelReservationOnly(Long reservationId, Long currentUserId,
      ReservationCancelRequestDto requestDto) {
    int result = reservationMapper.cancelReservation(
        reservationId, currentUserId, CancelReason.valueOf(requestDto.getCancelReason().name()),
        requestDto.getCancelMemo(), LocalDateTime.now());

    if (result != 1) {
      throw new BaseException(CANCEL_REQUEST_FAILED);
    }
  }

  /**
   * 취소 가능 상태 확인 (결제 상태 고려)
   */
  private void validateCancelableStatusWithPayment(ReservationCancelWithPaymentCheckDto reservation) {
    String status = reservation.getStatus();
    String paymentStatus = reservation.getPaymentStatus();

    // 이미 취소된 예약
    if ("CANCELED".equals(status)) {
      throw new BaseException(BaseResponseStatus.ALREADY_CANCELED_RESERVATION);
    }

    // PENDING 상태는 결제 완료 여부와 관계없이 취소 가능
    if ("PENDING".equals(status)) {
      return;
    }

    // APPROVED 상태는 취소 불가 (기존 정책 유지)
    if ("APPROVED".equals(status)) {
      throw new BaseException(BaseResponseStatus.RESERVATION_NOT_CANCELABLE);
    }
  }

  /**
   * 결제 상태별 취소 처리
   */
  private String processCancellationByPaymentStatus(
      ReservationCancelWithPaymentCheckDto reservation,
      Long currentUserId,
      ReservationCancelRequestDto requestDto,
      LocalDateTime canceledAt) {

    String paymentStatus = reservation.getPaymentStatus();
    String cancelMessage;

    switch (paymentStatus) {
      case "PENDING":
        // 결제 미완료 예약: 예약만 취소
        cancelReservationOnly(reservation.getId(), currentUserId, requestDto, canceledAt);
        cancelMessage = "예약이 성공적으로 취소되었습니다.";
        break;

      case "PAID":
        // 결제 완료 예약: 결제 취소 + 예약 취소 (트랜잭션)
        cancelReservationWithPayment(reservation, currentUserId, requestDto, canceledAt);
        cancelMessage = "예약 및 결제가 성공적으로 취소되었습니다.";
        break;

      case "CANCELLED":
        // 이미 결제 취소된 예약: 예약만 취소 (결제는 이미 취소됨)
        cancelReservationOnly(reservation.getId(), currentUserId, requestDto, canceledAt);
        cancelMessage = "예약이 성공적으로 취소되었습니다. (결제는 이미 취소됨)";
        break;

      case "FAILED":
        // 결제 실패한 예약: 예약만 취소
        cancelReservationOnly(reservation.getId(), currentUserId, requestDto, canceledAt);
        cancelMessage = "예약이 성공적으로 취소되었습니다.";
        break;

      default:
        throw new BaseException(BaseResponseStatus.INVALID_PAYMENT_STATUS);
    }

    return cancelMessage;
  }

  /**
   * 예약만 취소 (결제 처리 없음)
   */
  private void cancelReservationOnly(Long reservationId, Long currentUserId,
      ReservationCancelRequestDto requestDto, LocalDateTime canceledAt) {
    int result = reservationMapper.cancelReservation(
        reservationId, currentUserId, CancelReason.valueOf(requestDto.getCancelReason().name()),
        requestDto.getCancelMemo(), canceledAt);

    if (result != 1) {
      throw new BaseException(CANCEL_REQUEST_FAILED);
    }
  }

  /**
   * 결제 취소 + 예약 취소 (트랜잭션)
   */
  private void cancelReservationWithPayment(
      ReservationCancelWithPaymentCheckDto reservation,
      Long currentUserId,
      ReservationCancelRequestDto requestDto,
      LocalDateTime canceledAt) {

    try {
      // 1. 토스페이먼츠 결제 취소 요청
      if (reservation.getPaymentKey() != null) {
        PaymentCancelRequestDto paymentCancelDto = PaymentCancelRequestDto.builder()
            .cancelReason("예약 취소: " + requestDto.getCancelReason().getDisplayName())
            .cancelAmount(reservation.getAmount())  // 예약 금액 그대로 전달
            .build();

        // ✅ 실제 메서드 시그니처에 맞춰 호출
        paymentService.cancelPayment(
            reservation.getOrderId(),
            paymentCancelDto,
            currentUserId
        );

        log.info("결제 취소 완료: paymentKey={}, orderId={}", reservation.getPaymentKey(), reservation.getOrderId());
      }

      // 2. 예약 상태 업데이트 (결제 취소 정보 포함)
      int result = reservationMapper.cancelReservationWithPayment(
          reservation.getId(),
          currentUserId,
          requestDto.getCancelReason().name(),
          requestDto.getCancelMemo(),
          canceledAt
      );

      if (result != 1) {
        throw new BaseException(CANCEL_REQUEST_FAILED);
      }

    } catch (Exception e) {
      log.error("결제 취소 실패로 인한 예약 취소 롤백: reservationId={}", reservation.getId(), e);
      throw new BaseException(PAYMENT_CANCEL_FAILED);
    }
  }

  /**
   * 예약 내역 조회 (SecurityUtil 기반)
   */
  @Transactional(readOnly = true)
  public CursorPage<ReservationDetailResponseDto> getReservationList(PageRequestDto pageRequest) {
    Long currentUserId = getCurrentUserPrimaryId();
    String currentUserRole = SecurityUtil.getCurrentUserRoleRequired();

    log.info("예약 내역 조회 시작: userId={}, role={}", currentUserId, currentUserRole);

    List<ReservationDetailResponseDto> reservations;

    // 역할별 예약 내역 조회
    if ("ADVISOR".equals(currentUserRole)) {
      // 전문가: advisor_id 조회 후 해당 전문가의 예약 내역
      Long advisorId = reservationMapper.getAdvisorIdByUserId(currentUserId);
      if (advisorId == null) {
        throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND);
      }
      reservations = reservationMapper.findAdvisorReservations(advisorId, pageRequest);
    } else {
      // 일반 사용자: user_id로 직접 예약 내역 조회
      reservations = reservationMapper.findUserReservations(currentUserId, pageRequest);
    }

    // CursorPage 처리
    boolean hasNext = reservations.size() > pageRequest.getPageSize();
    if (hasNext) {
      reservations.remove(reservations.size() - 1);
    }

    log.info("예약 내역 조회 완료: userId={}, count={}", currentUserId, reservations.size());

    return CursorPage.<ReservationDetailResponseDto>builder()
        .content(reservations)
        .nextCursor(null)
        .hasNext(hasNext)
        .pageSize(pageRequest.getPageSize())
        .pageNo(pageRequest.getPageNo())
        .build();
  }


  /**
   * ✅ 예약 취소 이벤트 발행 (알림을 위함)
   */
  private void publishCancelEvent(ReservationCancelWithPaymentCheckDto reservation,
      Long currentUserId,
      ReservationCancelRequestDto requestDto) {
    try {
      Long targetUserId;
      String canceledByName;

      if (currentUserId.equals(reservation.getUserId())) {
        targetUserId = reservation.getAdvisorId();
        UserProfileResponseDto userProfile = userProfileMapper.findUserProfileById(currentUserId);
        canceledByName = userProfile != null ? userProfile.getName() : "Unknown";
      } else {
        targetUserId = reservation.getUserId();
        UserProfileResponseDto advisorProfile = userProfileMapper.findUserProfileById(currentUserId);
        canceledByName = advisorProfile != null ? advisorProfile.getName() : "Unknown";
      }

      String dateTime = String.format("%s %s", reservation.getDate(), reservation.getStartTime());
      String reason = requestDto.getCancelReason().getDisplayName(); // ✅ 사용자에게 친화적인 표현 사용

      eventPublisher.publishEvent(new ReservationCanceledEvent(
          targetUserId,
          canceledByName,
          dateTime,
          reason
      ));

      log.debug("예약 취소 이벤트 발행 완료 - canceledByName: {}", canceledByName);
    } catch (Exception e) {
      log.warn("예약 취소 이벤트 발행 실패 (취소는 성공)", e);
    }
  }
}