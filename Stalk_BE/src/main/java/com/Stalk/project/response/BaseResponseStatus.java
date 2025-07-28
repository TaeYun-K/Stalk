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
    NO_COMMENT_MODIFY_AUTHORITY(HttpStatus.FORBIDDEN, false, 903, "댓글 수정 권한이 없습니다. 관리자에게 문의해주시기 바랍니다."),
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
     * 1300: Reservation 에러.
     */
    INVALID_DATE_PAST(HttpStatus.BAD_REQUEST, false, 1301, "과거 날짜는 조회할 수 없습니다."),
    SAME_DAY_RESERVATION_NOT_ALLOWED(HttpStatus.BAD_REQUEST, false, 1302, "당일 예약은 불가능합니다. 하루 전까지만 예약 가능합니다.");

    private final HttpStatus httpStatus;
    private final boolean isSuccess;
    private final int code;
    private final String message;

}