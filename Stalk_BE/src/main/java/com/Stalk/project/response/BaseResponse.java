package com.Stalk.project.response;

import com.Stalk.project.util.TypeCaster;
import org.springframework.http.HttpStatus;

import static com.Stalk.project.response.BaseResponseStatus.SUCCESS;

public record BaseResponse<T>(HttpStatus httpStatus, Boolean isSuccess, String message, int code,
                T result) {

    // 필요값 : Http 상태코드, 성공여부, 메시지, 에러코드, 결과값

    /**
     * 1. Return 객체가 필요한 경우 -> 성공
     *
     * @param result 반환해야 하는 결과 객체
     */
    public BaseResponse(T result) {
        this(HttpStatus.OK, true, SUCCESS.getMessage(), SUCCESS.getCode(), result);
    }

    /**
     * 2. Return 객체가 필요 없는 경우 -> 성공
     */

    public BaseResponse() {
        this(HttpStatus.OK, true, SUCCESS.getMessage(), SUCCESS.getCode(), null);
    }

    /**
     * 3. 요청에 실패한 경우
     *
     * @param status 응답 상태
     */
    public BaseResponse(BaseResponseStatus status) {
        this(status.getHttpStatus(), false, status.getMessage(), status.getCode(),
                        TypeCaster.castMessage(status.getMessage()));
    }

    /**
     * 4. 요청에 실패한 경우
     *
     * @param status 응답 상태
     * @param message 에러 메시지
     */
    public BaseResponse(BaseResponseStatus status, String message) {
        this(status.getHttpStatus(), false, message, status.getCode(),
                        TypeCaster.castMessage(status.getMessage()));
    }

}
