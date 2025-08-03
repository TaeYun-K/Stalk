package com.Stalk.project.exception;

import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.response.BaseResponseStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@Slf4j
//@RestControllerAdvice
public class GlobalExceptionHandler {

  /**
   * BaseException 처리
   */
  @ExceptionHandler(BaseException.class)
  public ResponseEntity<BaseResponse<Object>> handleBaseException(BaseException e) {
    log.warn("BaseException occurred: {}", e.getMessage());
    BaseResponse<Object> response = new BaseResponse<>(e.getStatus());
    return ResponseEntity.status(e.getStatus().getHttpStatus()).body(response);
  }

  /**
   * Validation 에러 처리 (@Valid 실패)
   */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<BaseResponse<Object>> handleValidationException(
      MethodArgumentNotValidException e) {
    log.warn("Validation error: {}",
        e.getBindingResult().getAllErrors().get(0).getDefaultMessage());
    BaseResponse<Object> response = new BaseResponse<>(BaseResponseStatus.INVALID_INPUT_VALUE);
    return ResponseEntity.badRequest().body(response);
  }

  /**
   * 잘못된 타입 변환 에러 처리 (PathVariable, RequestParam 타입 변환 실패)
   */
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<BaseResponse<Object>> handleTypeMismatchException(
      MethodArgumentTypeMismatchException e) {
    log.warn("Type mismatch error: {}", e.getMessage());
    BaseResponse<Object> response = new BaseResponse<>(BaseResponseStatus.INVALID_INPUT_VALUE);
    return ResponseEntity.badRequest().body(response);
  }

  /**
   * IllegalArgumentException 처리
   */
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<BaseResponse<Object>> handleIllegalArgumentException(
      IllegalArgumentException e) {
    log.warn("IllegalArgumentException occurred: {}", e.getMessage());
    BaseResponse<Object> response = new BaseResponse<>(BaseResponseStatus.ILLEGAL_ARGUMENT);
    return ResponseEntity.badRequest().body(response);
  }

  /**
   * 기타 예상하지 못한 에러 처리
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<BaseResponse<Object>> handleException(Exception e) {
    log.error("Unexpected error occurred", e);
    BaseResponse<Object> response = new BaseResponse<>(BaseResponseStatus.INTERNAL_SERVER_ERROR);
    return ResponseEntity.internalServerError().body(response);
  }
}
