package com.Stalk.project.user.controller;

import com.Stalk.project.user.dto.MockUserProfile;
import com.Stalk.project.user.dto.out.UserProfileResponseDto;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.response.BaseResponseStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@Tag(name = "👤 Mock User API", description = "사용자 관련 Mock API - 프론트엔드 개발용")
@Slf4j
public class MockUserController {

    // Mock 사용자 프로필 데이터 (기존과 동일)
    private final Map<Long, MockUserProfile> mockUserProfiles = Map.of(
                    1001L, new MockUserProfile(1001L, "김철수", "010-1234-5678", "kimcs@example.com", "/images/profiles/user1001.png", "USER"),
                    1002L, new MockUserProfile(1002L, "이영희", "010-2345-6789", "leeyh@example.com", "/images/profiles/user1002.png", "USER"),
                    2001L, new MockUserProfile(2001L, "한승우", "010-3456-7890", "hansw@advisor.com", "/images/profiles/advisor2001.png", "ADVISOR"),
                    2002L, new MockUserProfile(2002L, "이수진", "010-4567-8901", "leesj@advisor.com", "/images/profiles/advisor2002.png", "ADVISOR"),
                    2003L, new MockUserProfile(2003L, "박미승", "010-5678-9012", "parkms@advisor.com", "/images/profiles/advisor2003.png", "ADVISOR"),
                    3001L, new MockUserProfile(3001L, "관리자", "010-9999-0000", "admin@company.com", "/images/profiles/admin3001.png", "ADMIN")
    );

    @Operation(
                    summary = "내 정보 조회",
                    description = """
            **현재 로그인한 사용자의 기본 정보 조회 API**
            
            ### 📋 기능 설명
            - JWT 토큰을 기반으로 로그인된 사용자의 기본 정보를 반환합니다
            - 모든 역할(USER/ADVISOR/ADMIN)의 사용자가 사용 가능합니다
            - 화면에 표시될 사용자 기본 정보를 제공합니다
            
            ### 🔗 사용 흐름
            1. **로그인 API**에서 accessToken 획득
            2. **Authorization 헤더**에 `Bearer {토큰}` 형식으로 전송
            3. 토큰에서 추출한 사용자 정보를 반환
            
            ### 📊 반환 정보
            - **userId**: 사용자 고유 ID
            - **name**: 사용자 이름
            - **contact**: 연락처 (휴대폰 번호)
            - **email**: 이메일 주소
            - **profileImage**: 프로필 이미지 URL
            - **role**: 사용자 역할 (USER/ADVISOR/ADMIN)
            
            ### 🧪 테스트 방법
            1. 로그인 API로 토큰 획득
            2. 아래 예시와 같이 Authorization 헤더에 토큰 포함
            3. API 호출하여 내 정보 확인
            
            ### 💡 Mock 토큰 형식
            `MOCK_TOKEN_{UUID}_{TYPE}_{USER_ID}_{ROLE}`
            예: `MOCK_TOKEN_a1b2c3d4_ACCESS_1001_USER`
            """,
                    parameters = {
                                    @Parameter(
                                                    name = "Authorization",
                                                    description = "Bearer 토큰 (필수)",
                                                    required = true,
                                                    example = "Bearer MOCK_TOKEN_a1b2c3d4_ACCESS_1001_USER"
                                    )
                    }
    )
    @ApiResponses({
                    @ApiResponse(
                                    responseCode = "200",
                                    description = "내 정보 조회 성공",
                                    content = @Content(
                                                    mediaType = "application/json",
                                                    examples = {
                                                                    @ExampleObject(
                                                                                    name = "일반 사용자 응답",
                                                                                    summary = "USER 역할 사용자",
                                                                                    value = """
                            {
                              "httpStatus": "OK",
                              "isSuccess": true,
                              "message": "요청에 성공하였습니다.",
                              "code": 200,
                              "result": {
                                "userId": 1001,
                                "name": "김철수",
                                "contact": "010-1234-5678",
                                "email": "kimcs@example.com",
                                "profileImage": "/images/profiles/user1001.png",
                                "role": "USER"
                              }
                            }
                            """
                                                                    ),
                                                                    @ExampleObject(
                                                                                    name = "전문가 응답",
                                                                                    summary = "ADVISOR 역할 사용자",
                                                                                    value = """
                            {
                              "httpStatus": "OK",
                              "isSuccess": true,
                              "message": "요청에 성공하였습니다.",
                              "code": 200,
                              "result": {
                                "userId": 2001,
                                "name": "한승우",
                                "contact": "010-3456-7890",
                                "email": "hansw@advisor.com",
                                "profileImage": "/images/profiles/advisor2001.png",
                                "role": "ADVISOR"
                              }
                            }
                            """
                                                                    ),
                                                                    @ExampleObject(
                                                                                    name = "관리자 응답",
                                                                                    summary = "ADMIN 역할 사용자",
                                                                                    value = """
                            {
                              "httpStatus": "OK",
                              "isSuccess": true,
                              "message": "요청에 성공하였습니다.",
                              "code": 200,
                              "result": {
                                "userId": 3001,
                                "name": "관리자",
                                "contact": "010-9999-0000",
                                "email": "admin@company.com",
                                "profileImage": "/images/profiles/admin3001.png",
                                "role": "ADMIN"
                              }
                            }
                            """
                                                                    )
                                                    }
                                    )
                    ),
                    @ApiResponse(
                                    responseCode = "401",
                                    description = "유효하지 않은 토큰",
                                    content = @Content(
                                                    examples = @ExampleObject(
                                                                    value = """
                        {
                          "httpStatus": "UNAUTHORIZED",
                          "isSuccess": false,
                          "message": "유효하지 않은 토큰입니다.",
                          "code": 2008,
                          "result": "유효하지 않은 토큰입니다."
                        }
                        """
                                                    )
                                    )
                    ),
                    @ApiResponse(
                                    responseCode = "404",
                                    description = "존재하지 않는 사용자",
                                    content = @Content(
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
                    )
    })
    @GetMapping("/me")
    public BaseResponse<UserProfileResponseDto> getMyProfile(
                    @RequestHeader(value = "Authorization", required = false) String token
    ) {
        log.info("내 정보 조회 요청");

        Long userId = extractUserIdFromToken(token);

        if (userId == null) {
            return new BaseResponse<>(BaseResponseStatus.INVALID_TOKEN);
        }

        MockUserProfile mockProfile = mockUserProfiles.get(userId);

        if (mockProfile == null) {
            return new BaseResponse<>(BaseResponseStatus.USER_NOT_FOUND);
        }

        UserProfileResponseDto response = UserProfileResponseDto.builder()
                        .userId(mockProfile.getUserId())
                        .name(mockProfile.getName())
                        .contact(mockProfile.getContact())
                        .email(mockProfile.getEmail())
                        .profileImage(mockProfile.getProfileImage())
                        .role(mockProfile.getRole())
                        .build();

        log.info("사용자 정보 조회 성공: {} ({})", mockProfile.getName(), mockProfile.getRole());

        return new BaseResponse<>(response);
    }

    // 토큰 파싱 메서드 (기존과 동일)
    private Long extractUserIdFromToken(String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return null;
            }

            String mockToken = token.substring(7);

            if (!mockToken.startsWith("MOCK_TOKEN_")) {
                return null;
            }

            String[] parts = mockToken.split("_");
            if (parts.length >= 5) {
                return Long.parseLong(parts[4]);
            }

            return null;
        } catch (Exception e) {
            log.warn("Mock token parsing error: {}", e.getMessage());
            return null;
        }
    }
}
