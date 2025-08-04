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
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final AuthenticationManager authenticationManager;
  private final JwtUtil jwtUtil;
  private final RedisTemplate<String, String> redisTemplate;
  private final UserLoginMapper userLoginMapper;

  /*
   * 로그인 처리 - AuthenticationManager를 통해 인증 시도 (UserDetailsService + PasswordEncoder 내부 사용)
   * - 반환된 Authentication 객체에서 User 엔티티를 꺼내 한 번만 DB 조회
   * - JWT 토큰 생성 및 Redis 저장, 마지막 로그인 시간 업데이트
   */
  public LoginResponse login(LoginRequest loginRequest, HttpServletResponse response) {
    Authentication auth;
    try {
      auth = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(
              loginRequest.getUserId(),
              loginRequest.getPassword()
          )
      );
    } catch (Exception ex) {
      throw new BadCredentialsException("Invalid user ID or password", ex);
    }

    // 인증된 UserDetails에서 User 엔티티 꺼내기
    MyUserDetails principal = (MyUserDetails) auth.getPrincipal();
    User user = principal.getUser();

    // Access / Refresh Token 생성
    String accessToken = jwtUtil.createAccessToken(user.getUserId(), user.getRole());
    String refreshToken = jwtUtil.createRefreshToken(user.getUserId(), user.getRole());

    // Refresh Token을 Redis에 저장 (키: refresh_token:{userId})
    redisTemplate.opsForValue().set(
        "refresh_token:" + user.getUserId(),
        refreshToken,
        jwtUtil.getRefreshTokenValidity(),
        TimeUnit.MILLISECONDS
    );

    // HTTP-only 쿠키로 refreshToken 설정
    ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
        .httpOnly(true)
        .secure(true) // HTTPS가 아니라면 false 로 설정 가능
        .path("/")
        .maxAge(jwtUtil.getRefreshTokenValidity() / 1000) // 초 단위
        .sameSite("Strict") // 또는 Lax
        .build();
    response.setHeader("Set-Cookie", cookie.toString());

    // 마지막 로그인 시간 업데이트
    user.setLastLoginAt(LocalDateTime.now());
    userLoginMapper.update(user);

    // 응답 DTO 생성 및 반환
    LoginResponse loginResponse = new LoginResponse();
    loginResponse.setAccessToken(accessToken);
    return loginResponse;
  }

  /*
   * 로그아웃 처리 - 클라이언트가 보낸 Refresh Token의 유효성 검증 - Redis에서 해당 토큰 삭제
   */
  private String extractRefreshTokenFromCookies(HttpServletRequest request) {
    if (request.getCookies() == null) {
      return null;
    }

    for (Cookie cookie : request.getCookies()) {
      if ("refreshToken".equals(cookie.getName())) {
        return cookie.getValue();
      }
    }
    return null;
  }

  /*
   * 엑세스 토큰 재발급 - Refresh Token 검증 및 Redis 저장 토큰과 일치 여부 확인
   * 새로운 Access Token 재발급 시, 기존 refreshToken의 남은 유효 시간이 얼마 남지 않았을 경우
   * 새로운 refreshToken도 함께 재발급 Redis에 refresh token 재발급, HTTP-only 쿠키로 갱신
   */
  public LoginResponse refreshAccessToken(HttpServletRequest request,
      HttpServletResponse response) {
    String refreshToken = extractRefreshTokenFromCookies(request);
    if (refreshToken == null || !jwtUtil.validateToken(refreshToken)) {
      throw new BadCredentialsException("Invalid or expired refresh token");
    }

    // 사용자 정보 추출
    String userId = jwtUtil.getUserIdFromToken(refreshToken);
    String role = jwtUtil.getRoleFromToken(refreshToken);
    String redisKey = "refresh_token:" + userId;

    // Redis에 저장된 refreshToken과 비교
    String storedRefreshToken = redisTemplate.opsForValue().get(redisKey);
    if (!storedRefreshToken.equals(refreshToken)) {
      throw new BadCredentialsException("Refresh token mismatch or not found");
    }

    // Access Token 재발급
    String newAccessToken = jwtUtil.createAccessToken(userId, role);

    // refreshToken 재발급 조건 확인 (만료까지 3일 이하 남았으면 갱신)
    long remaining = jwtUtil.getRemainingValidity(refreshToken);
    long threeDaysMs = 3 * 24 * 60 * 60 * 1000L;

    if (remaining <= threeDaysMs) {
      String newRefreshToken = jwtUtil.createRefreshToken(userId, role);

      // Redis 갱신
      redisTemplate.opsForValue().set(
          redisKey,
          newRefreshToken,
          jwtUtil.getRefreshTokenValidity(),
          TimeUnit.MILLISECONDS
      );

      // 쿠키 갱신
      ResponseCookie cookie = ResponseCookie.from("refreshToken", newRefreshToken)
          .httpOnly(true)
          .secure(true)
          .path("/")
          .maxAge(jwtUtil.getRefreshTokenValidity() / 1000)
          .sameSite("Strict")
          .build();
      response.setHeader("Set-Cookie", cookie.toString());
    }

    // 응답
    LoginResponse loginResponse = new LoginResponse();
    loginResponse.setAccessToken(newAccessToken);
    return loginResponse;
  }


  public void logout(HttpServletRequest request, HttpServletResponse response) {
    // 쿠키에서 refreshToken 추출
    String refreshToken = extractRefreshTokenFromCookies(request);
    if (refreshToken == null || !jwtUtil.validateToken(refreshToken)) {
      throw new BadCredentialsException("Invalid or expired refresh token");
    }

    // 토큰에서 userId 추출 후 Redis 삭제
    String userId = jwtUtil.getUserIdFromToken(refreshToken);
    redisTemplate.delete("refresh_token:" + userId);

    // 클라이언트 측 쿠키 제거 (Max-Age=0)
    ResponseCookie expiredCookie = ResponseCookie.from("refreshToken", "")
        .httpOnly(true)
        .secure(true) // 개발환경에서는 false
        .path("/")
        .maxAge(0)
        .sameSite("Strict")
        .build();
    response.setHeader("Set-Cookie", expiredCookie.toString());
  }

}
