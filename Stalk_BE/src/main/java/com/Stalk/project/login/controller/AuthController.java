package com.Stalk.project.login.controller;

import com.Stalk.project.login.dto.in.LoginRequest;
import com.Stalk.project.login.dto.in.RefreshRequest;
import com.Stalk.project.login.dto.out.LoginResponse;
import com.Stalk.project.login.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
    LoginResponse response = authService.login(loginRequest);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/refresh")
  public ResponseEntity<String> refresh(@RequestBody(required = false) RefreshRequest body) {
    // body에 토큰이 반드시 있어야 함
    if (body == null || body.getRefreshToken() == null || body.getRefreshToken().isBlank()) {
      throw new BadCredentialsException("Refresh token is required in request body");
    }

    // 서비스 호출
    String newAccessToken = authService.refreshAccessToken(body.getRefreshToken());
    return ResponseEntity.ok(newAccessToken);
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(@RequestBody RefreshRequest body) {
    // 요청 바디에 토큰이 반드시 있어야 함
    if (body == null || body.getRefreshToken() == null || body.getRefreshToken().isBlank()) {
      throw new BadCredentialsException("Refresh token is required in request body");
    }
    // 서비스에 무효화 요청
    authService.logout(body.getRefreshToken());
    // 200 OK, 빈 바디
    return ResponseEntity.ok().build();
  }
}