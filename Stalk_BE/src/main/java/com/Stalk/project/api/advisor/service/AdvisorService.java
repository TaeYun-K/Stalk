package com.Stalk.project.api.advisor.service;

import com.Stalk.project.api.advisor.dao.AdvisorMapper;
import com.Stalk.project.api.advisor.dto.in.AdvisorBlockedTimesRequestDto;
import com.Stalk.project.api.advisor.dto.in.AdvisorListRequestDto;
import com.Stalk.project.api.advisor.dto.in.AvailableTimeSlotsRequestDto;
import com.Stalk.project.api.advisor.dto.out.AdvisorBlockedTimesResponseDto;
import com.Stalk.project.api.advisor.dto.out.AdvisorBlockedTimesUpdateResponseDto;
import com.Stalk.project.api.advisor.dto.out.AdvisorDetailResponseDto;
import com.Stalk.project.api.advisor.dto.out.AdvisorResponseDto;
import com.Stalk.project.api.advisor.dto.out.AvailableTimeSlotsResponseDto;
import com.Stalk.project.api.advisor.dto.out.BlockedTimeDto;
import com.Stalk.project.api.advisor.dto.out.ReservedTimeDto;
import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.response.BaseResponseStatus;
import com.Stalk.project.global.util.CursorPage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdvisorService {

  private final AdvisorMapper advisorMapper;

  /**
   * 어드바이저 목록 조회 (자격증 정보 포함 - 최적화됨)
   */
  public CursorPage<AdvisorResponseDto> getAdvisorList(AdvisorListRequestDto requestDto) {
    // cursor가 null인 경우 첫 페이지 조회
    if (requestDto.getCursor() == null) {
      requestDto.setCursor(0L);
    }

    // limit + 1로 조회하여 다음 페이지 존재 여부 확인
    List<AdvisorResponseDto> advisors = advisorMapper.findAllAdvisorsSummary(requestDto);

    boolean hasNext = advisors.size() > requestDto.getPageSize();
    Long nextCursor = null;

    // 다음 페이지가 있으면 마지막 요소 제거하고 nextCursor 설정
    if (hasNext) {
      AdvisorResponseDto lastAdvisor = advisors.remove(advisors.size() - 1);
      nextCursor = lastAdvisor.getId();
    }

    // 전문가 ID 목록 추출
    List<Long> advisorIds = advisors.stream()
                    .map(AdvisorResponseDto::getId)
                    .collect(Collectors.toList());

    // 모든 전문가의 자격증을 한 번에 조회 (1번의 쿼리로 최적화)
    List<AdvisorResponseDto.CertificateDto> allCertificates =
                    advisorMapper.findCertificatesByAdvisorIds(advisorIds);

    // 전문가별로 자격증 그룹핑
    Map<Long, List<AdvisorResponseDto.CertificateDto>> certificateMap = allCertificates.stream()
                    .collect(Collectors.groupingBy(AdvisorResponseDto.CertificateDto::getAdvisorId));

    // 각 전문가에 자격증 설정
    advisors.forEach(advisor -> {
      List<AdvisorResponseDto.CertificateDto> certificates =
                      certificateMap.getOrDefault(advisor.getId(), Collections.emptyList());
      advisor.setCertificates(certificates);
    });

    log.info("어드바이저 목록 조회 완료: count={}, hasNext={}, totalCertificates={}",
                    advisors.size(), hasNext, allCertificates.size());

    return CursorPage.<AdvisorResponseDto>builder()
                    .content(advisors)
                    .nextCursor(nextCursor)
                    .hasNext(hasNext)
                    .pageSize(requestDto.getPageSize())
                    .pageNo(requestDto.getPageNo())
                    .build();
  }

  /**
   * 어드바이저 상세 정보 조회
   */
  public AdvisorDetailResponseDto getAdvisorDetail(Long advisorId) {
    // 1. 어드바이저 기본 정보 조회
    AdvisorDetailResponseDto advisorDetail = advisorMapper.findAdvisorDetailById(advisorId);

    if (advisorDetail == null) {
      throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND);
    }

    // 2. 경력사항 조회
    List<AdvisorDetailResponseDto.CareerDto> careers = advisorMapper.findAdvisorCareers(advisorId);
    advisorDetail.setCareers(careers);

    // 3. 자격증 조회
    List<AdvisorDetailResponseDto.CertificationDto> certificates = advisorMapper.findAdvisorCertificates(advisorId);
    advisorDetail.setCertificates(certificates);

    // 4. 리뷰 조회 (커뮤니티 프로필 이미지 포함)
    List<AdvisorDetailResponseDto.ReviewDto> reviews = advisorMapper.findAdvisorReviewsWithProfile(advisorId);
    advisorDetail.setReviews(reviews);

    // 5. 더 많은 리뷰가 있는지 확인
    boolean hasMoreReviews = reviews.size() == 10;
    advisorDetail.setHas_more_reviews(hasMoreReviews);

    // 6. preferredTradeStyle enum을 한글로 변환
    String preferredTradeStyleKorean = convertTradeStyleToKorean(
        advisorDetail.getPreferred_trade_style());
    advisorDetail.setPreferred_trade_style(preferredTradeStyleKorean);

    return advisorDetail;
  }

  /**
   * 예약 가능 시간 조회 - 일반 사용자만 허용
   */
  public AvailableTimeSlotsResponseDto getAvailableTimeSlots(Long advisorId,
      String currentUserRole, AvailableTimeSlotsRequestDto requestDto) {

    log.info("예약 가능 시간 조회 시작: advisorId={}, userRole={}, date={}",
        advisorId, currentUserRole, requestDto.getDate());

    // 1. 사용자 권한 확인 - 일반 사용자만 조회 가능
    if (!"USER".equals(currentUserRole)) {
      throw new BaseException(BaseResponseStatus.AVAILABLE_TIME_USER_ONLY);
    }

    LocalDate requestDate = requestDto.getDate();
    LocalDate today = LocalDate.now();

    // 2. 날짜 검증
    if (requestDate.isBefore(today)) {
      throw new BaseException(BaseResponseStatus.PAST_DATE_NOT_ALLOWED);
    }

    if (requestDate.equals(today)) {
      throw new BaseException(BaseResponseStatus.SAME_DAY_RESERVATION_NOT_ALLOWED_NEW);
    }

    // 3. 주말 체크
    DayOfWeek dayOfWeek = requestDate.getDayOfWeek();
    if (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY) {
      // 주말은 빈 배열 반환
      return AvailableTimeSlotsResponseDto.builder()
          .date(requestDate)
          .timeSlots(Collections.emptyList())
          .build();
    }

    // 4. 어드바이저 존재 및 승인 여부 확인
    if (!advisorMapper.isApprovedAdvisor(advisorId)) {
      throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND);
    }

    // 5. 차단된 시간과 예약된 시간 조회
    List<BlockedTimeDto> blockedTimes = advisorMapper.getBlockedTimes(advisorId, requestDate);
    List<ReservedTimeDto> reservedTimes = advisorMapper.getReservedTimes(advisorId, requestDate);

    // 6. 시간 슬롯 생성 및 상태 설정
    List<AvailableTimeSlotsResponseDto.TimeSlot> timeSlots = generateTimeSlots(blockedTimes, reservedTimes);

    log.info("예약 가능 시간 조회 완료: advisorId={}, availableSlots={}",
        advisorId, timeSlots.size());

    return AvailableTimeSlotsResponseDto.builder()
        .date(requestDate)
        .timeSlots(timeSlots)
        .build();
  }

  /**
   * 전문가의 특정 날짜 차단 시간 조회
   */
  public AdvisorBlockedTimesResponseDto getAdvisorBlockedTimes(Long advisorId, String date) {
    // 1. 날짜 형식 검증
    validateDateFormat(date);

    // 2. 전문가 존재 및 승인 여부 확인
    if (!advisorMapper.isApprovedAdvisor(advisorId)) {
      throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND);
    }

    // 3. 차단 시간 조회
    List<String> blockedTimes = advisorMapper.getAdvisorBlockedTimes(advisorId, date);

    return new AdvisorBlockedTimesResponseDto(date, blockedTimes);
  }

  /**
   * 전문가의 특정 날짜 차단 시간 업데이트
   */
  @Transactional
  public AdvisorBlockedTimesUpdateResponseDto updateAdvisorBlockedTimes(
      Long advisorId, String date, AdvisorBlockedTimesRequestDto requestDto) {

    // 1. 날짜 형식 검증
    validateDateFormat(date);

    // 2. 과거 날짜 차단 방지
    if (isDateInPast(date)) {
      throw new BaseException(BaseResponseStatus.PAST_DATE_BLOCK_NOT_ALLOWED);
    }

    // 3. 전문가 존재 및 승인 여부 확인
    if (!advisorMapper.isApprovedAdvisor(advisorId)) {
      throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND);
    }

    // 4. 시간 형식 검증
    List<String> blockedTimes = requestDto.getBlockedTimes();
    validateTimeSlots(blockedTimes);

    // 5. 예약된 시간과 충돌 확인
    List<String> reservedTimes = advisorMapper.getReservedTimesForDate(advisorId, date);
    List<String> conflictTimes = blockedTimes.stream()
        .filter(reservedTimes::contains)
        .toList();

    if (!conflictTimes.isEmpty()) {
      throw new BaseException(BaseResponseStatus.RESERVED_TIME_CANNOT_BE_BLOCKED);
    }

    // 6. 기존 차단 시간 삭제
    advisorMapper.deleteBlockedTimesByDate(advisorId, date);

    // 7. 새로운 차단 시간 추가
    if (!blockedTimes.isEmpty()) {
      advisorMapper.insertBlockedTimes(advisorId, date, blockedTimes);
    }

    return new AdvisorBlockedTimesUpdateResponseDto(date, blockedTimes);
  }

  // ============ Private Helper Methods ============

  /**
   * 투자 성향 enum을 한글로 변환
   */
  private String convertTradeStyleToKorean(String tradeStyle) {
    if (tradeStyle == null) return null;

    return switch (tradeStyle.toUpperCase()) {
      case "SHORT" -> "단기";
      case "MID_SHORT" -> "단중기";
      case "MID" -> "중기";
      case "MID_LONG" -> "중장기";
      case "LONG" -> "장기";
      default -> tradeStyle;
    };
  }

  /**
   * 시간 슬롯 생성 (09:00~20:00, 12개 슬롯)
   */
  private List<AvailableTimeSlotsResponseDto.TimeSlot> generateTimeSlots(
      List<BlockedTimeDto> blockedTimes, List<ReservedTimeDto> reservedTimes) {

    // 1. 기본 시간 슬롯 생성 (09:00~20:00)
    List<LocalTime> baseTimeSlots = new ArrayList<>();
    for (int hour = 9; hour <= 20; hour++) {
      baseTimeSlots.add(LocalTime.of(hour, 0));
    }

    // 2. 차단된 시간들을 Set으로 변환
    Set<LocalTime> blockedTimeSet = convertBlockedTimesToSet(blockedTimes);

    // 3. 예약된 시간들을 Set으로 변환
    Set<LocalTime> reservedTimeSet = convertReservedTimesToSet(reservedTimes);

    // 4. 각 시간 슬롯의 상태 설정
    List<AvailableTimeSlotsResponseDto.TimeSlot> timeSlots = new ArrayList<>();
    for (LocalTime time : baseTimeSlots) {
      AvailableTimeSlotsResponseDto.TimeSlot timeSlot = createTimeSlot(time, blockedTimeSet, reservedTimeSet);
      timeSlots.add(timeSlot);
    }

    return timeSlots;
  }

  /**
   * 차단된 시간을 LocalTime Set으로 변환
   */
  private Set<LocalTime> convertBlockedTimesToSet(List<BlockedTimeDto> blockedTimes) {
    return blockedTimes.stream()
        .flatMap(blocked -> {
          List<LocalTime> times = new ArrayList<>();
          LocalTime current = blocked.getStartTime();
          while (current.isBefore(blocked.getEndTime())) {
            times.add(current);
            current = current.plusHours(1);
          }
          return times.stream();
        })
        .collect(Collectors.toSet());
  }

  /**
   * 예약된 시간을 LocalTime Set으로 변환
   */
  private Set<LocalTime> convertReservedTimesToSet(List<ReservedTimeDto> reservedTimes) {
    return reservedTimes.stream()
        .flatMap(reserved -> {
          List<LocalTime> times = new ArrayList<>();
          LocalTime current = reserved.getStartTime();
          while (current.isBefore(reserved.getEndTime())) {
            times.add(current);
            current = current.plusHours(1);
          }
          return times.stream();
        })
        .collect(Collectors.toSet());
  }

  /**
   * 개별 시간 슬롯 생성
   */
  private AvailableTimeSlotsResponseDto.TimeSlot createTimeSlot(LocalTime time,
      Set<LocalTime> blockedTimes, Set<LocalTime> reservedTimes) {
    boolean isBlocked = blockedTimes.contains(time);
    boolean isReserved = reservedTimes.contains(time);
    boolean isAvailable = !isBlocked && !isReserved;

    return AvailableTimeSlotsResponseDto.TimeSlot.builder()
        .time(time.toString()) // "09:00" 형식으로 변환
        .isAvailable(isAvailable)
        .isReserved(isReserved)
        .isBlocked(isBlocked)
        .build();
  }

  /**
   * 날짜 형식 검증 (YYYY-MM-DD)
   */
  private void validateDateFormat(String date) {
    if (!date.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
      throw new BaseException(BaseResponseStatus.INVALID_DATE_FORMAT);
    }
  }

  /**
   * 과거 날짜 여부 확인
   */
  private boolean isDateInPast(String date) {
    try {
      LocalDate targetDate = LocalDate.parse(date);
      return targetDate.isBefore(LocalDate.now());
    } catch (Exception e) {
      throw new BaseException(BaseResponseStatus.INVALID_DATE_FORMAT);
    }
  }

  /**
   * 시간 슬롯 검증 (09:00~20:00, 정시만)
   */
  private void validateTimeSlots(List<String> timeSlots) {
    List<String> validTimeSlots = Arrays.asList(
        "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
        "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
    );

    for (String timeSlot : timeSlots) {
      if (!validTimeSlots.contains(timeSlot)) {
        throw new BaseException(BaseResponseStatus.INVALID_TIME_SLOT);
      }
    }
  }
}
