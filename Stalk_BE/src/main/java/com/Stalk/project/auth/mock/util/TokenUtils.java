package com.Stalk.project.auth.mock.util;

import com.Stalk.project.exception.BaseException;
import com.Stalk.project.response.BaseResponseStatus;
import lombok.extern.slf4j.Slf4j;

/**
 * Mock 토큰 파싱 유틸리티 (디버깅 버전)
 * <p>
 * 토큰 형식: MOCK_TOKEN_{uuid}_{type}_{userId}_{role} 예시: "MOCK_TOKEN_a1b2c3d4_ACCESS_1001_USER"
 */
@Slf4j
public class TokenUtils {

  private static final String TOKEN_PREFIX = "Bearer ";
  private static final String MOCK_TOKEN_PREFIX = "MOCK_TOKEN_";

  /**
   * Authorization 헤더에서 사용자 ID 추출
   */
  public static Long extractUserId(String authorizationHeader) {
    log.info("토큰 추출 시작: {}", authorizationHeader);
    String token = extractToken(authorizationHeader);
    log.info("추출된 토큰: {}", token);
    return parseUserId(token);
  }

  /**
   * Authorization 헤더에서 사용자 역할 추출
   */
  public static String extractRole(String authorizationHeader) {
    String token = extractToken(authorizationHeader);
    return parseRole(token);
  }

  /**
   * Authorization 헤더에서 토큰 추출
   */
  private static String extractToken(String authorizationHeader) {
    if (authorizationHeader == null || authorizationHeader.trim().isEmpty()) {
      log.warn("Authorization 헤더가 없습니다.");
      throw new BaseException(BaseResponseStatus.MISSING_TOKEN);
    }

    if (!authorizationHeader.startsWith(TOKEN_PREFIX)) {
      log.warn("잘못된 토큰 형식: {}", authorizationHeader);
      throw new BaseException(BaseResponseStatus.INVALID_TOKEN_FORMAT);
    }

    return authorizationHeader.substring(TOKEN_PREFIX.length()).trim();
  }

  /**
   * Mock 토큰에서 사용자 ID 파싱 (수정된 버전)
   */
  private static Long parseUserId(String token) {
    try {
      log.info("토큰 파싱 시작: {}", token);

      if (!token.startsWith(MOCK_TOKEN_PREFIX)) {
        log.error("Mock 토큰 접두사가 없습니다: {}", token);
        throw new BaseException(BaseResponseStatus.INVALID_TOKEN_FORMAT);
      }

      // MOCK_TOKEN_{uuid}_{type}_{userId}_{role} 형식 파싱
      String[] parts = token.split("_");
      log.info("토큰 분할 결과: {}", String.join(" | ", parts));
      log.info("분할된 파트 수: {}", parts.length);

      // 최소 5개 파트 필요: ["MOCK", "TOKEN", "uuid", "type", "userId", "role"]
      if (parts.length < 6) {
        log.error("토큰 파트 수 부족. 기대값: 6, 실제값: {}", parts.length);
        throw new BaseException(BaseResponseStatus.INVALID_TOKEN_FORMAT);
      }

      // parts[4]가 userId (0: MOCK, 1: TOKEN, 2: uuid, 3: type, 4: userId, 5: role)
      String userIdStr = parts[4];
      log.info("추출된 사용자 ID 문자열: {}", userIdStr);

      Long userId = Long.parseLong(userIdStr);
      log.info("파싱된 사용자 ID: {}", userId);
      return userId;

    } catch (NumberFormatException e) {
      log.error("사용자 ID 숫자 변환 실패: {}", token, e);
      throw new BaseException(BaseResponseStatus.INVALID_TOKEN_FORMAT);
    } catch (BaseException e) {
      throw e;
    } catch (Exception e) {
      log.error("토큰 파싱 중 예상치 못한 오류: {}", token, e);
      throw new BaseException(BaseResponseStatus.INVALID_TOKEN_FORMAT);
    }
  }

  /**
   * Mock 토큰에서 사용자 역할 파싱 (수정된 버전)
   */
  private static String parseRole(String token) {
    try {
      if (!token.startsWith(MOCK_TOKEN_PREFIX)) {
        throw new BaseException(BaseResponseStatus.INVALID_TOKEN_FORMAT);
      }

      String[] parts = token.split("_");
      if (parts.length < 6) {
        throw new BaseException(BaseResponseStatus.INVALID_TOKEN_FORMAT);
      }

      // parts[5]가 role
      String role = parts[5];
      log.debug("토큰에서 사용자 역할 추출: {}", role);
      return role;

    } catch (BaseException e) {
      throw e;
    } catch (Exception e) {
      log.error("토큰에서 역할 파싱 중 오류: {}", token, e);
      throw new BaseException(BaseResponseStatus.INVALID_TOKEN_FORMAT);
    }
  }

  /**
   * 토큰 유효성 검사
   */
  public static boolean isValidToken(String authorizationHeader) {
    try {
      extractUserId(authorizationHeader);
      return true;
    } catch (BaseException e) {
      return false;
    }
  }
}