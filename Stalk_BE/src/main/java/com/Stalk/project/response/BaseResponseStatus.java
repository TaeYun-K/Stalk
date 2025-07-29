package com.Stalk.project.response;

import org.springframework.http.HttpStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum BaseResponseStatus {

  /**
   * 200: 요청 성공.
   **/
  SUCCESS(HttpStatus.OK, true, 200, "요청에 성공하였습니다."),

  /**
   * 400: 사용자 요청 에러.
   */
  ILLEGAL_ARGUMENT(HttpStatus.BAD_REQUEST, false, 400, "잘못된 요청입니다."),
  INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, false, 401, "적절하지 않은 요청값입니다."),

  WRONG_JWT_TOKEN(HttpStatus.UNAUTHORIZED, false, 401, "인증 정보가 유효하지 않습니다. 다시 로그인해주시기 바랍니다."),
  FAILED_TO_LOGIN(HttpStatus.UNAUTHORIZED, false, 401, "아이디 또는 비밀번호가 올바르지 않습니다."),
  NO_SIGN_IN(HttpStatus.UNAUTHORIZED, false, 401, "로그인이 필요한 요청입니다. 다시 로그인해주세요."),

  PASSWORD_NOT_MATCHED(HttpStatus.BAD_REQUEST, false, 400, "기존 비밀번호가 일치하지 않습니다."),
  PASSWORD_SAME_AS_CURRENT(HttpStatus.BAD_REQUEST, false, 400, "기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다."),
  DISABLED_USER(HttpStatus.FORBIDDEN, false, 403, "비활성화된 계정입니다. 관리자에게 문의해주시기 바랍니다."),
  NO_ACCESS_AUTHORITY(HttpStatus.FORBIDDEN, false, 403, "접근 권한이 없습니다. 관리자에게 문의해주시기 바랍니다."),
  NO_EXIST_USER(HttpStatus.NOT_FOUND, false, 404, "존재하지 않는 사용자입니다."),

  DATABASE_CONSTRAINT_VIOLATION(HttpStatus.CONFLICT, false, 409, "데이터베이스 제약 조건을 위반했습니다. "
      + "(유니크 키 중복, 외래 키 위반, NOT NULL 위반 등에서 발생합니다.)"),

  /**
   * 500: 기타 에러.
   */
  INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, false, 500, "서버에서 예기치 않은 오류가 발생했습니다."),

  /**
   * 600: 타입 에러.
   */
  INVALID_ROLE(HttpStatus.BAD_REQUEST, false, 601, "지원하지 않는 RoleType입니다."),

  /**
   * 700: House 에러.
   */
  INVALID_BUILDING_TYPE(HttpStatus.BAD_REQUEST, false, 701, "지원하지 않는 BuildingType입니다."),

  /**
   * 800: Notice 에러.
   */
  NO_EXIST_NOTICE(HttpStatus.NOT_FOUND, false, 804, "존재하지 않는 공지사항입니다."),

  /**
   * 900: Comment 에러.
   */
  NO_COMMENT_MODIFY_AUTHORITY(HttpStatus.FORBIDDEN, false, 903,
      "댓글 수정 권한이 없습니다. 관리자에게 문의해주시기 바랍니다."),
  NO_EXIST_COMMENT(HttpStatus.NOT_FOUND, false, 904, "존재하지 않는 댓글입니다."),

  /**
   * 1000: Favorite 에러.
   */
  INVALID_FAVORITE_TYPE(HttpStatus.BAD_REQUEST, false, 1001, "지원하지 않는 FavoriteType입니다."),
  ALREADY_FAVORITED(HttpStatus.CONFLICT, false, 1009, "이미 찜한 항목입니다."),

  /**
   * 1100: Advisor 에러.
   */
  ADVISOR_NOT_FOUND(HttpStatus.NOT_FOUND, false, 1101, "존재하지 않거나 승인되지 않은 어드바이저입니다."),
  INVALID_PREFERRED_TRADE_STYLE(HttpStatus.BAD_REQUEST, false, 1102, "지원하지 않는 투자 성향입니다."),
  INVALID_SORT_BY(HttpStatus.BAD_REQUEST, false, 1103, "지원하지 않는 정렬 기준입니다."),

  /**
   * 1200: Review 에러.
   */
  REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, false, 1201, "존재하지 않는 리뷰입니다."),
  NO_REVIEW_MODIFY_AUTHORITY(HttpStatus.FORBIDDEN, false, 1202, "리뷰 수정 권한이 없습니다."),
  ALREADY_REVIEWED(HttpStatus.CONFLICT, false, 1203, "이미 해당 어드바이저에 대한 리뷰를 작성하셨습니다."),

  /**
   * 1300: Reservation 에러 (기존 1301, 1302에 이어서 추가)
   */
  INVALID_TIME_FORMAT(HttpStatus.BAD_REQUEST, false, 1303, "올바르지 않은 시간 형식입니다. 정시만 입력 가능합니다."),
  PAST_DATE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, false, 1304, "과거 날짜에는 예약할 수 없습니다."),
  SAME_DAY_RESERVATION_NOT_ALLOWED_NEW(HttpStatus.BAD_REQUEST, false, 1305, "당일 예약은 불가능합니다."),
  WEEKEND_RESERVATION_NOT_ALLOWED(HttpStatus.BAD_REQUEST, false, 1306, "주말에는 예약할 수 없습니다."),
  OUTSIDE_BUSINESS_HOURS(HttpStatus.BAD_REQUEST, false, 1307, "운영시간(09:00~20:00) 외에는 예약할 수 없습니다."),
  SELF_RESERVATION_NOT_ALLOWED(HttpStatus.BAD_REQUEST, false, 1308, "본인에게는 예약할 수 없습니다."),
  TIME_SLOT_BLOCKED(HttpStatus.CONFLICT, false, 1309, "해당 시간은 전문가가 차단한 시간입니다."),
  TIME_SLOT_ALREADY_RESERVED(HttpStatus.CONFLICT, false, 1310, "해당 시간대에 이미 예약이 존재합니다."),
  RESERVATION_CREATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, false, 1311, "예약 생성에 실패했습니다."),
  RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, false, 1312, "예약을 찾을 수 없습니다."),
  RESERVATION_NOT_CANCELABLE(HttpStatus.BAD_REQUEST, false, 1313, "취소할 수 없는 예약입니다."),
  SAME_DAY_CANCEL_NOT_ALLOWED(HttpStatus.BAD_REQUEST, false, 1314, "당일 취소는 불가능합니다."),
  ALREADY_CANCELED_RESERVATION(HttpStatus.BAD_REQUEST, false, 1315, "이미 취소된 예약입니다."),
  UNAUTHORIZED_CANCEL_REQUEST(HttpStatus.FORBIDDEN, false, 1316, "해당 예약을 취소할 권한이 없습니다."),
  CANCEL_REQUEST_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, false, 1317, "예약 취소 처리에 실패했습니다."),

  // ===== 인증 관련 에러 코드 (2000번대) =====

  // 로그인 실패
  INVALID_USER_JWT(HttpStatus.UNAUTHORIZED, false, 2001, "권한이 없는 유저의 접근입니다."),
  LOGIN_FAILED(HttpStatus.UNAUTHORIZED, false, 2002, "아이디 또는 비밀번호가 올바르지 않습니다."),
  INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, false, 2003, "비밀번호가 올바르지 않습니다."),
  USER_NOT_FOUND(HttpStatus.NOT_FOUND, false, 2004, "존재하지 않는 사용자입니다."),

  // 계정 상태 관련
  ACCOUNT_INACTIVE(HttpStatus.FORBIDDEN, false, 2005, "비활성화된 계정입니다."),
  ADVISOR_NOT_APPROVED(HttpStatus.FORBIDDEN, false, 2006, "승인되지 않은 전문가 계정입니다."),
  UNAUTHORIZED_ROLE(HttpStatus.FORBIDDEN, false, 2007, "해당 역할로 로그인할 권한이 없습니다."),

  // 토큰 관련
  INVALID_TOKEN(HttpStatus.UNAUTHORIZED, false, 2008, "유효하지 않은 토큰입니다."),
  EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, false, 2009, "만료된 토큰입니다."),
  TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, false, 2010, "토큰이 없습니다."),
  // ===== 토큰/인증 관련 에러 (2100번대) =====
  MISSING_TOKEN(HttpStatus.UNAUTHORIZED, false, 2101, "인증 토큰이 필요합니다."),
  INVALID_TOKEN_FORMAT(HttpStatus.UNAUTHORIZED, false, 2102, "토큰 형식이 올바르지 않습니다."),

  // 로그아웃
  LOGOUT_SUCCESS(HttpStatus.OK, true, 200, "로그아웃이 완료되었습니다.");

  private final HttpStatus httpStatus;
  private final boolean isSuccess;
  private final int code;
  private final String message;

}
