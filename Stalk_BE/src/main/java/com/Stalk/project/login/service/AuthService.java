package com.Stalk.project.login.service;

import com.Stalk.project.login.dao.UserLoginMapper;
import com.Stalk.project.login.dto.in.LoginRequest;
import com.Stalk.project.login.dto.out.LoginResponse;
import com.Stalk.project.signup.entity.User;
import com.Stalk.project.login.util.JwtUtil;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
public class AuthService {

  private final UserLoginMapper userLoginMapper;
  private final JwtUtil jwtUtil;
  private final RedisTemplate<String, String> redisTemplate;
  private final PasswordEncoder passwordEncoder;

  public AuthService(UserLoginMapper userLoginMapper, JwtUtil jwtUtil,
      RedisTemplate<String, String> redisTemplate,
      PasswordEncoder passwordEncoder) {
    this.userLoginMapper = userLoginMapper;
    this.jwtUtil = jwtUtil;
    this.redisTemplate = redisTemplate;
    this.passwordEncoder = passwordEncoder;
  }

  public LoginResponse login(LoginRequest loginRequest) {
    User user = userLoginMapper.findByUserId(loginRequest.getUserId());
    if (user == null || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
      throw new RuntimeException("Invalid user ID or password");
    }
    
//    if (!user.getIsActive()) {
//      throw new RuntimeException("Account is not active");
//    }

    // Access Token 및 Refresh Token 생성
    String accessToken = jwtUtil.createAccessToken(user.getUserId(), user.getRole());
    String refreshToken = jwtUtil.createRefreshToken(user.getUserId(), user.getRole());

    // Refresh Token을 Redis에 저장
    redisTemplate.opsForValue().set(
        "refresh_token:" + user.getUserId(),
        refreshToken,
        jwtUtil.getRefreshTokenValidity(),
        TimeUnit.MILLISECONDS
    );

    // 마지막 로그인 시간 업데이트
    user.setLastLoginAt(LocalDateTime.now());
    userLoginMapper.update(user);

    LoginResponse response = new LoginResponse();
    response.setAccessToken(accessToken);
    response.setRefreshToken(refreshToken);
    return response;
  }

  /**
   * 로그아웃: 클라이언트가 보낸 refresh token을 무효화(서버에 저장된 키 삭제)
   */
  public void logout(String refreshToken) {
    // 1 토큰 유효성 검사
    if (!jwtUtil.validateToken(refreshToken)) {
      throw new BadCredentialsException("Invalid or expired refresh token");
    }

    // 2 토큰에서 userId 추출
    String userId = jwtUtil.getUserIdFromToken(refreshToken);

    // 3 Redis에 저장된 키 삭제
    String key = "refresh_token:" + userId;
    Boolean deleted = redisTemplate.delete(key);
    System.out.println(deleted);
  }

  /**
   * 클라이언트가 보낸 refreshToken을 검증하고, Redis에 저장된 토큰과 일치하면 새로운 accessToken을 생성해 반환.
   */
  public String refreshAccessToken(String refreshToken) {
    if (!jwtUtil.validateToken(refreshToken)) {
      throw new BadCredentialsException("Invalid refresh token");
    }

    String userId = jwtUtil.getUserIdFromToken(refreshToken);
    String storedRefreshToken = redisTemplate.opsForValue().get("refresh_token:" + userId);

    if (storedRefreshToken == null || !storedRefreshToken.equals(refreshToken)) {
      throw new RuntimeException("Refresh token not found or mismatched");
    }
    System.out.println(userId);
    User user = userLoginMapper.findByUserId(userId);
    if (user == null || !user.getIsActive()) {
      throw new RuntimeException("User not found or inactive");
    }

    return jwtUtil.createAccessToken(user.getUserId(), user.getRole());
  }
}