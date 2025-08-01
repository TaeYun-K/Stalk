package com.Stalk.project.auth.mock.controller;

import com.Stalk.project.auth.mock.dto.MockUser;
import com.Stalk.project.auth.mock.dto.in.LoginRequestDto;
import com.Stalk.project.auth.mock.dto.out.LoginResponseDto;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.response.BaseResponseStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "🔐 Mock Auth API", description = "인증 관련 Mock API - 프론트엔드 개발용")
@Slf4j
public class MockAuthController {

  // Mock 사용자 데이터
  private final Map<String, MockUser> mockUsers = Map.of(
      "user001", new MockUser(1001L, "user001", "password123", "김철수", "USER", true, false),
      "user002", new MockUser(1002L, "test", "test", "이영희", "USER", true, false),
      "advisor001", new MockUser(2001L, "advisor001", "password123", "한승우", "ADVISOR", true, true),
      "advisor002", new MockUser(2002L, "advisor002", "password123", "이수진", "ADVISOR", true, true),
      "advisor003", new MockUser(2003L, "advisor003", "password123", "박미승", "ADVISOR", true, false),
      "admin001", new MockUser(3001L, "admin001", "password123", "관리자", "ADMIN", true, true)
  );

  @Operation(
      summary = "통합 로그인",
      description = """
          **통합 로그인 API** ***************
                    
          ### 📋 기능 설명
          - 모든 역할(일반사용자/전문가/관리자)의 로그인을 하나의 API로 처리합니다
          - 입력된 사용자 ID로 자동으로 역할을 판별하고 적절한 검증을 수행합니다
          - 성공 시 JWT 형식의 Mock 토큰을 반환합니다
                    
          ### 🧪 테스트 계정
                    
          #### 👤 일반 사용자 (USER)
          | 아이디 | 비밀번호 | 이름 | 상태 |
          |--------|----------|------|------|
          | user001 | password123 | 김철수 | ✅ 활성 |
          | test | test | 이영희 | ✅ 활성 |
                    
          #### 👨‍💼 전문가 (ADVISOR)
          | 아이디 | 비밀번호 | 이름 | 승인상태 |
          |--------|----------|------|----------|
          | advisor001 | password123 | 한승우 | ✅ 승인됨 |
          | advisor002 | password123 | 이수진 | ✅ 승인됨 |
          | advisor003 | password123 | 박미승 | ❌ 승인안됨 |
                    
          #### 🛡️ 관리자 (ADMIN)
          | 아이디 | 비밀번호 | 이름 | 상태 |
          |--------|----------|------|------|
          | admin001 | password123 | 관리자 | ✅ 활성 |
                    
          ### ⚠️ 주의사항
          - 승인되지 않은 전문가(advisor003)는 로그인할 수 없습니다
          - 시스템이 자동으로 역할을 판별하므로 사용자는 ID/PW만 입력하면 됩니다
          """,
      requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
          description = "로그인 요청 정보",
          required = true,
          content = @Content(
              mediaType = "application/json",
              schema = @Schema(implementation = LoginRequestDto.class),
              examples = {
                  @ExampleObject(
                      name = "일반 사용자",
                      summary = "김철수 (USER)",
                      value = """
                          {
                            "userId": "user001",
                            "password": "password123"
                          }
                          """
                  ),
                  @ExampleObject(
                      name = "승인된 전문가",
                      summary = "한승우 (ADVISOR - 승인됨)",
                      value = """
                          {
                            "userId": "advisor001",
                            "password": "password123"
                          }
                          """
                  ),
                  @ExampleObject(
                      name = "승인안된 전문가",
                      summary = "박미승 (ADVISOR - 승인안됨, 에러 테스트용)",
                      value = """
                          {
                            "userId": "advisor003",
                            "password": "password123"
                          }
                          """
                  ),
                  @ExampleObject(
                      name = "관리자",
                      summary = "관리자 (ADMIN)",
                      value = """
                          {
                            "userId": "admin001",
                            "password": "password123"
                          }
                          """
                  )
              }
          )
      )
  )
  @ApiResponses({
      @ApiResponse(
          responseCode = "200",
          description = "로그인 성공",
          content = @Content(
              mediaType = "application/json",
              examples = {
                  @ExampleObject(
                      name = "일반 사용자 로그인 성공",
                      summary = "USER 역할 로그인",
                      value = """
                          {
                            "httpStatus": "OK",
                            "isSuccess": true,
                            "message": "요청에 성공하였습니다.",
                            "code": 200,
                            "result": {
                              "accessToken": "MOCK_TOKEN_a1b2c3d4_ACCESS_1001_USER",
                              "refreshToken": "MOCK_TOKEN_e5f6g7h8_REFRESH_1001_USER",
                              "userId": 1001,
                              "userName": "김철수",
                              "role": "USER",
                              "message": "일반 사용자 로그인 성공"
                            }
                          }
                          """
                  ),
                  @ExampleObject(
                      name = "전문가 로그인 성공",
                      summary = "ADVISOR 역할 로그인",
                      value = """
                          {
                            "httpStatus": "OK",
                            "isSuccess": true,
                            "message": "요청에 성공하였습니다.",
                            "code": 200,
                            "result": {
                              "accessToken": "MOCK_TOKEN_a1b2c3d4_ACCESS_2001_ADVISOR",
                              "refreshToken": "MOCK_TOKEN_e5f6g7h8_REFRESH_2001_ADVISOR",
                              "userId": 2001,
                              "userName": "한승우",
                              "role": "ADVISOR",
                              "message": "전문가 로그인 성공"
                            }
                          }
                          """
                  ),
                  @ExampleObject(
                      name = "관리자 로그인 성공",
                      summary = "ADMIN 역할 로그인",
                      value = """
                          {
                            "httpStatus": "OK",
                            "isSuccess": true,
                            "message": "요청에 성공하였습니다.",
                            "code": 200,
                            "result": {
                              "accessToken": "MOCK_TOKEN_a1b2c3d4_ACCESS_3001_ADMIN",
                              "refreshToken": "MOCK_TOKEN_e5f6g7h8_REFRESH_3001_ADMIN",
                              "userId": 3001,
                              "userName": "관리자",
                              "role": "ADMIN",
                              "message": "관리자 로그인 성공"
                            }
                          }
                          """
                  )
              }
          )
      ),
      @ApiResponse(
          responseCode = "404",
          description = "존재하지 않는 사용자",
          content = @Content(
              mediaType = "application/json",
              examples = @ExampleObject(
                  value = """
                      {
                        "httpStatus": "NOT_FOUND",
                        "isSuccess": false,
                        "message": "존재하지 않는 사용자입니다.",
                        "code": 2004,
                        "result": "존재하지 않는 사용자입니다."
                      }
                      """
              )
          )
      ),
      @ApiResponse(
          responseCode = "401",
          description = "잘못된 비밀번호",
          content = @Content(
              mediaType = "application/json",
              examples = @ExampleObject(
                  value = """
                      {
                        "httpStatus": "UNAUTHORIZED",
                        "isSuccess": false,
                        "message": "비밀번호가 올바르지 않습니다.",
                        "code": 2003,
                        "result": "비밀번호가 올바르지 않습니다."
                      }
                      """
              )
          )
      ),
      @ApiResponse(
          responseCode = "403",
          description = "승인되지 않은 전문가",
          content = @Content(
              mediaType = "application/json",
              examples = @ExampleObject(
                  value = """
                      {
                        "httpStatus": "FORBIDDEN",
                        "isSuccess": false,
                        "message": "승인되지 않은 전문가입니다.",
                        "code": 2005,
                        "result": "승인되지 않은 전문가입니다."
                      }
                      """
              )
          )
      ),
      @ApiResponse(
          responseCode = "400",
          description = "비활성화된 계정",
          content = @Content(
              mediaType = "application/json",
              examples = @ExampleObject(
                  value = """
                      {
                        "httpStatus": "BAD_REQUEST",
                        "isSuccess": false,
                        "message": "비활성화된 계정입니다.",
                        "code": 2006,
                        "result": "비활성화된 계정입니다."
                      }
                      """
              )
          )
      )
  })
  @PostMapping("/login-test")
  public BaseResponse<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
    log.info("통합 로그인 시도: {}", request.getUserId());

    // 1. 사용자 존재 여부 확인
    MockUser user = mockUsers.get(request.getUserId());
    if (user == null) {
      log.warn("존재하지 않는 사용자: {}", request.getUserId());
      return new BaseResponse<>(BaseResponseStatus.USER_NOT_FOUND);
    }

    // 2. 비밀번호 확인
    if (!user.getPassword().equals(request.getPassword())) {
      log.warn("잘못된 비밀번호 시도: {}", request.getUserId());
      return new BaseResponse<>(BaseResponseStatus.INVALID_PASSWORD);
    }

    // 3. 계정 활성화 상태 확인
    if (!user.isActive()) {
      log.warn("비활성화된 계정: {}", request.getUserId());
      return new BaseResponse<>(BaseResponseStatus.ACCOUNT_INACTIVE);
    }

    // 4. 역할별 추가 검증
    String role = user.getRole();
    if ("ADVISOR".equals(role) && !user.isApproved()) {
      log.warn("승인되지 않은 전문가: {}", request.getUserId());
      return new BaseResponse<>(BaseResponseStatus.ADVISOR_NOT_APPROVED);
    }

    // 5. 토큰 생성
    String accessToken = generateSimpleMockToken(user, "access");
    String refreshToken = generateSimpleMockToken(user, "refresh");

    // 6. 역할별 로그인 성공 메시지
    String loginMessage = switch (role) {
      case "USER" -> "일반 사용자 로그인 성공";
      case "ADVISOR" -> "전문가 로그인 성공";
      case "ADMIN" -> "관리자 로그인 성공";
      default -> "로그인 성공";
    };

    LoginResponseDto response = LoginResponseDto.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .userId(user.getId())
        .userName(user.getName())
        .role(user.getRole())
        .message(loginMessage)
        .build();

    log.info("로그인 성공: {} ({})", user.getName(), role);
    return new BaseResponse<>(response);
  }

  @Operation(
      summary = "로그아웃",
      description = """
          **로그아웃 API**
                    
          ### 📋 기능 설명
          - 사용자의 로그아웃을 처리합니다
          - Mock API에서는 단순히 성공 응답만 반환합니다
          - 실제 구현에서는 토큰 무효화, 세션 종료 등의 처리가 필요합니다
                    
          ### 💡 사용법
          1. 로그인 API에서 받은 accessToken을 사용
          2. Authorization 헤더에 `Bearer {토큰}` 형식으로 전송
          3. 토큰이 없어도 성공 응답을 반환합니다 (Mock 특성)
          """,
      parameters = {
          @Parameter(
              name = "Authorization",
              description = "Bearer 토큰 (선택사항)",
              example = "Bearer MOCK_TOKEN_a1b2c3d4_ACCESS_1001_USER"
          )
      }
  )
  @ApiResponses({
      @ApiResponse(
          responseCode = "200",
          description = "로그아웃 성공",
          content = @Content(
              examples = @ExampleObject(
                  value = """
                      {
                        "httpStatus": "OK",
                        "isSuccess": true,
                        "message": "요청에 성공하였습니다.",
                        "code": 200,
                        "result": null
                      }
                      """
              )
          )
      )
  })
  @PostMapping("/logout-test")
  public BaseResponse<Void> logout(
      @RequestHeader(value = "Authorization", required = false) String token) {
    log.info("로그아웃 요청");
    return new BaseResponse<>();
  }

  // ===== 개발/테스트용 유틸리티 API =====

  @Operation(
      summary = "Mock 사용자 목록 조회",
      description = """
          **개발/테스트용 API - Mock 사용자 목록 조회**
                    
          ### 📋 기능 설명
          - 현재 등록된 모든 Mock 사용자의 정보를 조회합니다
          - 프론트엔드 개발자가 테스트 계정을 확인할 때 사용합니다
          - **실제 운영 환경에서는 제거되어야 하는 API입니다**
                    
          ### ⚠️ 보안 주의사항
          - 이 API는 개발/테스트 목적으로만 사용되어야 합니다
          - 실제 운영 환경에서는 보안상 위험하므로 반드시 제거해야 합니다
          """
  )
  @GetMapping("/mock-users")
  public BaseResponse<Map<String, Object>> getMockUsers() {
    log.info("Mock 사용자 목록 조회 요청");

    Map<String, Object> result = Map.of(
        "totalUsers", mockUsers.size(),
        "users", mockUsers.values().stream()
            .map(user -> Map.of(
                "userId", user.getUserId(),
                "name", user.getName(),
                "role", user.getRole(),
                "isActive", user.isActive(),
                "isApproved", user.isApproved()
            ))
            .toList(),
        "notice", "⚠️ 이 API는 개발/테스트용입니다. 운영 환경에서는 제거하세요."
    );

    return new BaseResponse<>(result);
  }

  /**
   * Mock 토큰 생성 메서드 실제 JWT 구현 시에는 적절한 JWT 라이브러리 사용 필요
   */
  private String generateSimpleMockToken(MockUser user, String type) {
    String uuid = UUID.randomUUID().toString().substring(0, 8);
    return String.format("MOCK_TOKEN_%s_%s_%d_%s",
        uuid, type.toUpperCase(), user.getId(), user.getRole());
  }
}