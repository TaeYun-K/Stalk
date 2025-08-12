package com.Stalk.project.api.login.service;

import com.Stalk.project.api.login.dao.UserLoginMapper;
import com.Stalk.project.api.login.dto.in.LoginRequest;
import com.Stalk.project.api.login.dto.out.LoginResponse;
import com.Stalk.project.global.util.JwtUtil;
import com.Stalk.project.api.signup.entity.User;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final AuthenticationManager authenticationManager;
  private final JwtUtil jwtUtil;
  private final RedisTemplate<String, String> redisTemplate;
  private final UserLoginMapper userLoginMapper;

  /**
   * 로그인 처리
   */
  public LoginResponse login(LoginRequest loginRequest, HttpServletResponse response) {
    Authentication auth;
    try {
      auth = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(
              loginRequest.getUserId(),
              loginRequest.getPassword()));
    } catch (Exception ex) {
      throw new BadCredentialsException("Invalid user ID or password", ex);
    }

    MyUserDetails principal = (MyUserDetails) auth.getPrincipal();
    User user = principal.getUser();

    String accessToken = jwtUtil.createAccessToken(user.getUserId(), user.getRole());
    String refreshToken = jwtUtil.createRefreshToken(user.getUserId(), user.getRole());

    redisTemplate.opsForValue().set(
        "refresh_token:" + user.getUserId(),
        refreshToken,
        jwtUtil.getRefreshTokenValidity(),
        TimeUnit.MILLISECONDS);

    ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
        .httpOnly(true)
        .secure(true)
        .path("/")
        .maxAge(jwtUtil.getRefreshTokenValidity() / 1000)
        .sameSite("Strict")
        .build();
    response.setHeader("Set-Cookie", cookie.toString());

    LocalDateTime now = LocalDateTime.now();
    user.setLastLoginAt(now);
    userLoginMapper.update(user.getId(), now);

    LoginResponse loginResponse = new LoginResponse();
    loginResponse.setAccessToken(accessToken);
    return loginResponse;
  }

  /**
   * AccessToken 재발급 처리
   */
  public LoginResponse refreshAccessToken(HttpServletRequest request, HttpServletResponse response) {
    String refreshToken = extractRefreshTokenFromCookies(request)
        .orElseThrow(() -> new BadCredentialsException("Refresh token not found in cookies"));

    if (!jwtUtil.validateToken(refreshToken)) {
      throw new BadCredentialsException("Invalid or expired refresh token");
    }

    String userId = jwtUtil.getUserIdFromToken(refreshToken);
    String role = jwtUtil.getRoleFromToken(refreshToken);
    String redisKey = "refresh_token:" + userId;

    String storedRefreshToken = redisTemplate.opsForValue().get(redisKey);
    if (!refreshToken.equals(storedRefreshToken)) {
      throw new BadCredentialsException("Refresh token mismatch or not found in Redis");
    }

    String newAccessToken = jwtUtil.createAccessToken(userId, role);

    long remaining = jwtUtil.getRemainingValidity(refreshToken);
    long threeDaysMs = 3 * 24 * 60 * 60 * 1000L;

    if (remaining <= threeDaysMs) {
      String newRefreshToken = jwtUtil.createRefreshToken(userId, role);
      redisTemplate.opsForValue().set(
          redisKey,
          newRefreshToken,
          jwtUtil.getRefreshTokenValidity(),
          TimeUnit.MILLISECONDS);

      ResponseCookie newCookie = ResponseCookie.from("refreshToken", newRefreshToken)
          .httpOnly(true).secure(true).path("/")
          .maxAge(jwtUtil.getRefreshTokenValidity() / 1000)
          .sameSite("Strict").build();
      response.setHeader("Set-Cookie", newCookie.toString());
    }

    LoginResponse loginResponse = new LoginResponse();
    loginResponse.setAccessToken(newAccessToken);
    return loginResponse;
  }

  /**
   * 일반적인 로그아웃 처리. AccessToken과 RefreshToken을 모두 무효화합니다.
   */
  public void logout(HttpServletRequest request, HttpServletResponse response) {
    invalidateTokens(request, response);
  }

  /**
   * 회원 탈퇴 또는 로그아웃 시 AccessToken과 RefreshToken을 모두 무효화하는 통합 메소드.
   * @param request  현재 HTTP 요청
   * @param response 현재 HTTP 응답
   */
  public void invalidateTokens(HttpServletRequest request, HttpServletResponse response) {
    // 요청 헤더에서 AccessToken을 추출하여 블랙리스트에 등록
    invalidateAccessToken(request);
    // 요청 쿠키에서 RefreshToken을 추출하여 Redis에서 삭제하고, 클라이언트 쿠키를 만료시킴
    invalidateRefreshToken(request, response);
  }

  /**
   * 요청 헤더에서 AccessToken을 추출하여 Redis 블랙리스트에 등록합니다.
   * @param request 현재 HTTP 요청
   */
  private void invalidateAccessToken(HttpServletRequest request) {
    final String authHeader = request.getHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      String accessToken = authHeader.substring(7);

      String userId = jwtUtil.getUserIdFromToken(accessToken);

      long remainingMillis = jwtUtil.getRemainingValidity(accessToken);
      if (remainingMillis > 0) {
        String redisValue = String.format("{userId:%s, remainingMillis:%d}", userId, remainingMillis);

        redisTemplate.opsForValue().set(
            accessToken,
            redisValue,
            remainingMillis,
            TimeUnit.MILLISECONDS
        );
      }
    }
  }

  /**
   * 요청 쿠키에서 RefreshToken을 추출하여 Redis에서 삭제하고, 클라이언트 쿠키를 만료시킵니다.
   * @param request  현재 HTTP 요청
   * @param response 현재 HTTP 응답
   */
  private void invalidateRefreshToken(HttpServletRequest request, HttpServletResponse response) {
    extractRefreshTokenFromCookies(request).ifPresent(refreshToken -> {
      if (jwtUtil.validateToken(refreshToken)) {
        String userId = jwtUtil.getUserIdFromToken(refreshToken);
        redisTemplate.delete("refresh_token:" + userId);
      }
    });

    ResponseCookie expiredCookie = ResponseCookie.from("refreshToken", "")
        .httpOnly(true)
        .secure(true)
        .path("/")
        .maxAge(0) // 즉시 만료
        .sameSite("Strict")
        .build();
    response.setHeader("Set-Cookie", expiredCookie.toString());
  }

  /**
   * HttpServletRequest의 쿠키 배열에서 'refreshToken'을 찾아 반환합니다.
   * @param request 현재 HTTP 요청
   * @return refreshToken 값 (Optional)
   */
  private Optional<String> extractRefreshTokenFromCookies(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return Optional.empty();
    }
    return Arrays.stream(cookies)
        .filter(cookie -> "refreshToken".equals(cookie.getName()))
        .map(Cookie::getValue)
        .findFirst();
  }
}
