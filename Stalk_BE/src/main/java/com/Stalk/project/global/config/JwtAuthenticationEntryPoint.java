package com.Stalk.project.global.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
// 인증이 필요한데 토큰이 없거나 유효하지 않을 때 → JwtAuthenticationEntryPoint.commence() 가 401 JSON 응답
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

  @Override
  public void commence(HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException)
      throws IOException {

    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");  // 🔥 인코딩 설정 추가
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

    // 🔥 BaseResponse 형식으로 변경
    String jsonResponse = """
        {
          "httpStatus": "UNAUTHORIZED",
          "isSuccess": false,
          "message": "인증이 필요합니다. Authorization 헤더에 Bearer 토큰을 포함해주세요.",
          "code": 401,
          "result": null
        }
        """;

    response.getWriter().write(jsonResponse);
  }
}