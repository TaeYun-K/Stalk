package com.Stalk.project.global.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
// 인증은 됐지만 권한이 부족할 때 → JwtAccessDeniedHandler.handle() 가 403 JSON 응답
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

  @Override
  public void handle(HttpServletRequest request,
      HttpServletResponse response,
      AccessDeniedException accessDeniedException)
      throws IOException {

    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");  // 🔥 인코딩 설정 추가
    response.setStatus(HttpServletResponse.SC_FORBIDDEN);

    // 🔥 BaseResponse 형식으로 변경
    String jsonResponse = """
        {
          "httpStatus": "FORBIDDEN",
          "isSuccess": false,
          "message": "접근 권한이 없습니다.",
          "code": 403,
          "result": null
        }
        """;

    response.getWriter().write(jsonResponse);
  }
}