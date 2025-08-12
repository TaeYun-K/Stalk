package com.Stalk.project.api.login.controller;

import com.Stalk.project.api.login.dto.in.LoginRequest;
import com.Stalk.project.api.login.dto.out.LoginResponse;
import com.Stalk.project.api.login.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest,
      HttpServletResponse response) {
    LoginResponse loginResponse = authService.login(loginRequest, response);
    return ResponseEntity.ok(loginResponse);
  }

  @PostMapping("/refresh")
  public ResponseEntity<LoginResponse> refreshToken(HttpServletRequest request,
      HttpServletResponse response) {
    LoginResponse newAccessToken = authService.refreshAccessToken(request, response);
    return ResponseEntity.ok(newAccessToken);
  }


  @PostMapping("/logout")
  public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
    authService.logout(request, response);
    return ResponseEntity.ok().build();
  }
}