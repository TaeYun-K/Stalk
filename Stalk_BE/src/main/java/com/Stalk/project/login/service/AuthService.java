package com.Stalk.project.login.service;

import com.Stalk.project.login.dao.UserLoginMapper;
import com.Stalk.project.login.dto.in.LoginRequest;
import com.Stalk.project.login.dto.out.LoginResponse;
import com.Stalk.project.login.util.JwtUtil;
import com.Stalk.project.signup.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
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

  /**
   * 로그인 처리
   * - AuthenticationManager를 통해 인증 시도 (UserDetailsService + PasswordEncoder 내부 사용)
   * - 반환된 Authentication 객체에서 User 엔티티를 꺼내 한 번만 DB 조회
   * - JWT 토큰 생성 및 Redis 저장, 마지막 로그인 시간 업데이트
   */
  public LoginResponse login(LoginRequest loginRequest) {
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
    String accessToken  = jwtUtil.createAccessToken(user.getUserId(), user.getRole());
    String refreshToken = jwtUtil.createRefreshToken(user.getUserId(), user.getRole());

    // Refresh Token을 Redis에 저장 (키: refresh_token:{userId})
    redisTemplate.opsForValue().set(
        "refresh_token:" + user.getUserId(),
        refreshToken,
        jwtUtil.getRefreshTokenValidity(),
        TimeUnit.MILLISECONDS
    );

    // 마지막 로그인 시간 업데이트
    user.setLastLoginAt(LocalDateTime.now());
    userLoginMapper.update(user);

    // 응답 DTO 생성 및 반환
    LoginResponse response = new LoginResponse();
    response.setAccessToken(accessToken);
    response.setRefreshToken(refreshToken);
    return response;
  }

  /**
   * 로그아웃 처리
   * - 클라이언트가 보낸 Refresh Token의 유효성 검증
   * - Redis에서 해당 토큰 삭제
   */
  public void logout(String refreshToken) {
    if (!jwtUtil.validateToken(refreshToken)) {
      throw new BadCredentialsException("Invalid or expired refresh token");
    }

    String userId = jwtUtil.getUserIdFromToken(refreshToken);
    redisTemplate.delete("refresh_token:" + userId);
  }

  /**
   * 엑세스 토큰 재발급
   * - Refresh Token 검증 및 Redis 저장 토큰과 일치 여부 확인
   * - 새로운 Access Token 발급
   */
  public String refreshAccessToken(String refreshToken) {
    // 1) validateToken(refreshToken) 에서 만료 시 예외 발생
    jwtUtil.validateToken(refreshToken);

    // 2) Redis 에서 저장된 값과 비교
    String stored = redisTemplate.opsForValue()
        .get("refresh_token:" + jwtUtil.getUserIdFromToken(refreshToken));
    if (!refreshToken.equals(stored)) {
      throw new BadCredentialsException("올바르지 않은 리프레시 토큰");
    }

    // 3) 새 Access Token 생성
    return jwtUtil.createAccessToken(
        jwtUtil.getUserIdFromToken(refreshToken),
        jwtUtil.getRoleFromToken(refreshToken));
  }
}
