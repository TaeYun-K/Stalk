// ===== 1. MockAuthController.java - Swagger 문서화 개선 =====
package com.Stalk.project.auth.controller;

import com.Stalk.project.auth.dto.MockUser;
import com.Stalk.project.auth.dto.in.LoginRequestDto;
import com.Stalk.project.auth.dto.out.LoginResponseDto;
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

    // Mock 사용자 데이터는 기존과 동일...
    private final Map<String, MockUser> mockUsers = Map.of(
                    "user001", new MockUser(1001L, "user001", "password123", "김철수", "USER", true, false),
                    "user002", new MockUser(1002L, "user002", "password123", "이영희", "USER", true, false),
                    "advisor001", new MockUser(2001L, "advisor001", "password123", "한승우", "ADVISOR", true, true),
                    "advisor002", new MockUser(2002L, "advisor002", "password123", "이수진", "ADVISOR", true, true),
                    "advisor003", new MockUser(2003L, "advisor003", "password123", "박미승", "ADVISOR", true, false),
                    "admin001", new MockUser(3001L, "admin001", "password123", "관리자", "ADMIN", true, true)
    );

    @Operation(
                    summary = "일반 사용자 로그인",
                    description = """
            **일반 사용자 로그인 API**
            
            ### 📋 기능 설명
            - 일반 사용자(USER 역할)의 로그인을 처리합니다
            - 성공 시 JWT 형식의 Mock 토큰을 반환합니다
            - 반환된 토큰은 다른 API 호출 시 Authorization 헤더에 사용됩니다
            
            ### 🧪 테스트 계정
            | 아이디 | 비밀번호 | 이름 | 설명 |
            |--------|----------|------|------|
            | user001 | password123 | 김철수 | 일반 사용자 |
            | user002 | password123 | 이영희 | 일반 사용자 |
            
            ### ⚠️ 주의사항
            - 전문가나 관리자 계정으로는 로그인할 수 없습니다
            - 잘못된 계정 정보 시 적절한 에러 메시지를 반환합니다
            """,
                    requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                                    description = "로그인 요청 정보",
                                    required = true,
                                    content = @Content(
                                                    mediaType = "application/json",
                                                    schema = @Schema(implementation = LoginRequestDto.class),
                                                    examples = {
                                                                    @ExampleObject(
                                                                                    name = "일반 사용자 1",
                                                                                    summary = "김철수 계정",
                                                                                    value = """
                            {
                              "userId": "user001",
                              "password": "password123"
                            }
                            """
                                                                    ),
                                                                    @ExampleObject(
                                                                                    name = "일반 사용자 2",
                                                                                    summary = "이영희 계정",
                                                                                    value = """
                            {
                              "userId": "user002",
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
                                                    examples = @ExampleObject(
                                                                    name = "성공 응답",
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
                            "message": "로그인 성공"
                          }
                        }
                        """
                                                    )
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
                    )
    })
    @PostMapping("/login")
    public BaseResponse<LoginResponseDto> userLogin(@Valid @RequestBody LoginRequestDto request) {
        // 기존 로직과 동일...
        log.info("일반 사용자 로그인 시도: {}", request.getUserId());

        MockUser user = mockUsers.get(request.getUserId());

        if (user == null) {
            return new BaseResponse<>(BaseResponseStatus.USER_NOT_FOUND);
        }

        if (!user.getPassword().equals(request.getPassword())) {
            return new BaseResponse<>(BaseResponseStatus.INVALID_PASSWORD);
        }

        if (!"USER".equals(user.getRole())) {
            return new BaseResponse<>(BaseResponseStatus.UNAUTHORIZED_ROLE);
        }

        if (!user.isActive()) {
            return new BaseResponse<>(BaseResponseStatus.ACCOUNT_INACTIVE);
        }

        String accessToken = generateSimpleMockToken(user, "access");
        String refreshToken = generateSimpleMockToken(user, "refresh");

        LoginResponseDto response = LoginResponseDto.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .userId(user.getId())
                        .userName(user.getName())
                        .role(user.getRole())
                        .message("로그인 성공")
                        .build();

        return new BaseResponse<>(response);
    }

    @Operation(
                    summary = "전문가 로그인",
                    description = """
            **전문가 로그인 API**
            
            ### 📋 기능 설명
            - 승인된 전문가(ADVISOR 역할)의 로그인을 처리합니다
            - 전문가는 관리자의 승인을 받은 후에만 로그인 가능합니다
            
            ### 🧪 테스트 계정
            | 아이디 | 비밀번호 | 이름 | 승인상태 | 설명 |
            |--------|----------|------|----------|------|
            | advisor001 | password123 | 한승우 | ✅ 승인됨 | 로그인 성공 |
            | advisor002 | password123 | 이수진 | ✅ 승인됨 | 로그인 성공 |
            | advisor003 | password123 | 박미승 | ❌ 승인안됨 | 로그인 실패 |
            
            ### ⚠️ 주의사항
            - 승인되지 않은 전문가는 로그인할 수 없습니다
            - 일반 사용자나 관리자 계정으로는 로그인할 수 없습니다
            """,
                    requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                                    description = "전문가 로그인 요청 정보",
                                    content = @Content(
                                                    examples = {
                                                                    @ExampleObject(
                                                                                    name = "승인된 전문가 1",
                                                                                    summary = "한승우 (승인됨)",
                                                                                    value = """
                            {
                              "userId": "advisor001",
                              "password": "password123"
                            }
                            """
                                                                    ),
                                                                    @ExampleObject(
                                                                                    name = "승인된 전문가 2",
                                                                                    summary = "이수진 (승인됨)",
                                                                                    value = """
                            {
                              "userId": "advisor002",
                              "password": "password123"
                            }
                            """
                                                                    ),
                                                                    @ExampleObject(
                                                                                    name = "승인 안된 전문가",
                                                                                    summary = "박미승 (승인안됨 - 에러 테스트용)",
                                                                                    value = """
                            {
                              "userId": "advisor003",
                              "password": "password123"
                            }
                            """
                                                                    )
                                                    }
                                    )
                    )
    )
    @PostMapping("/login/advisor")
    public BaseResponse<LoginResponseDto> advisorLogin(@Valid @RequestBody LoginRequestDto request) {
        // 기존 로직과 동일...
        log.info("전문가 로그인 시도: {}", request.getUserId());

        MockUser user = mockUsers.get(request.getUserId());

        if (user == null) {
            return new BaseResponse<>(BaseResponseStatus.USER_NOT_FOUND);
        }

        if (!user.getPassword().equals(request.getPassword())) {
            return new BaseResponse<>(BaseResponseStatus.INVALID_PASSWORD);
        }

        if (!"ADVISOR".equals(user.getRole())) {
            return new BaseResponse<>(BaseResponseStatus.UNAUTHORIZED_ROLE);
        }

        if (!user.isActive()) {
            return new BaseResponse<>(BaseResponseStatus.ACCOUNT_INACTIVE);
        }

        if (!user.isApproved()) {
            return new BaseResponse<>(BaseResponseStatus.ADVISOR_NOT_APPROVED);
        }

        String accessToken = generateSimpleMockToken(user, "access");
        String refreshToken = generateSimpleMockToken(user, "refresh");

        LoginResponseDto response = LoginResponseDto.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .userId(user.getId())
                        .userName(user.getName())
                        .role(user.getRole())
                        .message("전문가 로그인 성공")
                        .build();

        return new BaseResponse<>(response);
    }

    @Operation(
                    summary = "관리자 로그인",
                    description = """
            **관리자 로그인 API**
            
            ### 📋 기능 설명
            - 관리자(ADMIN 역할)의 로그인을 처리합니다
            
            ### 🧪 테스트 계정
            | 아이디 | 비밀번호 | 이름 | 설명 |
            |--------|----------|------|------|
            | admin001 | password123 | 관리자 | 시스템 관리자 |
            """,
                    requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                                    content = @Content(
                                                    examples = @ExampleObject(
                                                                    name = "관리자 계정",
                                                                    value = """
                        {
                          "userId": "admin001",
                          "password": "password123"
                        }
                        """
                                                    )
                                    )
                    )
    )
    @PostMapping("/login/admin")
    public BaseResponse<LoginResponseDto> adminLogin(@Valid @RequestBody LoginRequestDto request) {
        // 기존 로직과 동일...
        log.info("관리자 로그인 시도: {}", request.getUserId());

        MockUser user = mockUsers.get(request.getUserId());

        if (user == null) {
            return new BaseResponse<>(BaseResponseStatus.USER_NOT_FOUND);
        }

        if (!user.getPassword().equals(request.getPassword())) {
            return new BaseResponse<>(BaseResponseStatus.INVALID_PASSWORD);
        }

        if (!"ADMIN".equals(user.getRole())) {
            return new BaseResponse<>(BaseResponseStatus.UNAUTHORIZED_ROLE);
        }

        if (!user.isActive()) {
            return new BaseResponse<>(BaseResponseStatus.ACCOUNT_INACTIVE);
        }

        String accessToken = generateSimpleMockToken(user, "access");
        String refreshToken = generateSimpleMockToken(user, "refresh");

        LoginResponseDto response = LoginResponseDto.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .userId(user.getId())
                        .userName(user.getName())
                        .role(user.getRole())
                        .message("관리자 로그인 성공")
                        .build();

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
    @PostMapping("/logout")
    public BaseResponse<Void> logout(@RequestHeader(value = "Authorization", required = false) String token) {
        log.info("로그아웃 요청");
        return new BaseResponse<>();
    }

    // 토큰 생성 메서드는 기존과 동일...
    private String generateSimpleMockToken(MockUser user, String type) {
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return String.format("MOCK_TOKEN_%s_%s_%d_%s",
                        uuid, type.toUpperCase(), user.getId(), user.getRole());
    }
}
