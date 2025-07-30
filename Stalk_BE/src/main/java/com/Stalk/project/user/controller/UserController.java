package com.Stalk.project.user.controller;

import com.Stalk.project.user.dto.out.UserProfileResponseDto;
import com.Stalk.project.user.service.UserService;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.response.BaseResponseStatus;
import com.Stalk.project.exception.BaseException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@Tag(name = "👤 User API", description = "사용자 관련 API")
@RequiredArgsConstructor
@Slf4j
public class UserController {

  private final UserService userService;

  @Operation(
      summary = "내 정보 조회",
      description = """
            **현재 로그인한 사용자의 기본 정보 조회 API**
            
            ### 📋 기능 설명
            - JWT 토큰을 기반으로 로그인된 사용자의 기본 정보를 반환합니다
            - USER/ADVISOR 역할의 사용자가 사용 가능합니다
            - 화면에 표시될 사용자 기본 정보를 제공합니다
            
            ### 🔗 사용 흐름
            1. **로그인 API**에서 accessToken 획득
            2. **Authorization 헤더**에 `Bearer {토큰}` 형식으로 전송
            3. 토큰에서 추출한 사용자 정보를 실제 DB에서 조회하여 반환
            
            ### 📊 반환 정보
            - **userId**: 사용자 고유 ID (user_id 컬럼 값)
            - **name**: 사용자 이름
            - **contact**: 연락처 (휴대폰 번호)
            - **email**: 이메일 주소
            - **profileImage**: 프로필 이미지 URL
            - **role**: 사용자 역할 (USER/ADVISOR)
            
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
                                "userId": "hong01",
                                "name": "홍길동",
                                "contact": "010-0000-1001",
                                "email": "hong01@example.com",
                                "profileImage": null,
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
                                "userId": "kimjh123",
                                "name": "김지훈",
                                "contact": "010-1234-5678",
                                "email": "kimjh@example.com",
                                "profileImage": "/images/advisor1.jpg",
                                "role": "ADVISOR"
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

    try {
      Long userId = extractUserIdFromToken(token);

      if (userId == null) {
        return new BaseResponse<>(BaseResponseStatus.INVALID_TOKEN);
      }

      UserProfileResponseDto userProfile = userService.getUserProfile(userId);

      return new BaseResponse<>(userProfile);

    } catch (BaseException e) {
      return new BaseResponse<>(e.getStatus());
    } catch (Exception e) {
      log.error("내 정보 조회 중 오류 발생", e);
      return new BaseResponse<>(BaseResponseStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Mock 토큰에서 사용자 ID 추출
   * 토큰 형식: MOCK_TOKEN_{UUID}_{TYPE}_{USER_ID}_{ROLE}
   */
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