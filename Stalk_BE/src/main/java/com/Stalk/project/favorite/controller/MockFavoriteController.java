package com.Stalk.project.favorite.controller;

import com.Stalk.project.favorite.dto.MockFavoriteAdvisor;
import com.Stalk.project.favorite.dto.in.PreferredTradeStyle;
import com.Stalk.project.favorite.dto.out.FavoriteAdvisorResponseDto;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.response.BaseResponseStatus;
import com.Stalk.project.util.CursorPage;
import com.Stalk.project.util.PageRequestDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@Tag(name = "⭐ Mock Favorite API", description = "찜 관련 Mock API - 프론트엔드 개발용")
@Slf4j
public class MockFavoriteController {

    // Mock 찜 데이터 (기존과 동일)
    private final Map<Long, List<MockFavoriteAdvisor>> mockFavoriteData = Map.of(
                    1001L, List.of(
                                    new MockFavoriteAdvisor(2001L, "한승우", "/images/profiles/advisor2001.png", "단기 투자 전문가입니다", PreferredTradeStyle.SHORT),
                                    new MockFavoriteAdvisor(2002L, "이수진", "/images/profiles/advisor2002.png", "중장기 안정적 투자 전문가", PreferredTradeStyle.MID_LONG),
                                    new MockFavoriteAdvisor(2004L, "김동현", "/images/profiles/advisor2004.png", "AI 기반 투자 전략 전문가", PreferredTradeStyle.MID),
                                    new MockFavoriteAdvisor(2005L, "박소영", null, null, null),
                                    new MockFavoriteAdvisor(2006L, "최민수", "/images/profiles/advisor2006.png", "해외 주식 전문가", PreferredTradeStyle.LONG)
                    ),
                    1002L, List.of(
                                    new MockFavoriteAdvisor(2002L, "이수진", "/images/profiles/advisor2002.png", "중장기 안정적 투자 전문가", PreferredTradeStyle.MID_LONG),
                                    new MockFavoriteAdvisor(2003L, "박미승", "/images/profiles/advisor2003.png", "초보자 친화적 투자 가이드", PreferredTradeStyle.MID_SHORT)
                    )
    );

    @Operation(
                    summary = "찜한 전문가 조회",
                    description = """
            **일반 사용자가 찜한 전문가 목록 조회 API**
            
            ### 📋 기능 설명
            - 현재 로그인한 일반 사용자(USER)가 찜한 전문가 목록을 반환합니다
            - **오직 USER 권한**만 접근 가능 (ADVISOR, ADMIN은 접근 불가)
            - 페이징 처리를 통해 대용량 데이터도 효율적으로 조회 가능
            - 무한스크롤 또는 더보기 버튼 구현에 적합한 CursorPage 형식 응답
            
            ### 🔒 권한 제한
            - **허용**: USER 역할 사용자만
            - **거부**: ADVISOR, ADMIN 역할 → 403 Forbidden 에러
            
            ### 📊 반환 정보
            - **advisorId**: 전문가 고유 ID (advisors.user_id)
            - **nickname**: 전문가 닉네임
            - **profileImage**: 프로필 이미지 URL (nullable)
            - **shortIntro**: 간단한 소개 문구 (nullable)
            - **preferredTradeStyle**: 선호 매매 스타일 (nullable)
              - SHORT: 단기, MID_SHORT: 중단기, MID: 중기, MID_LONG: 중장기, LONG: 장기
            
            ### 📄 페이징 파라미터
            - **pageNo**: 조회할 페이지 번호 (1부터 시작, 기본값: 1)
            - **pageSize**: 페이지당 항목 수 (기본값: 10)
            
            ### 📦 응답 구조 (CursorPage)
            - **content**: 찜한 전문가 목록 배열
            - **nextCursor**: 다음 페이지 시작점 (없으면 null)
            - **hasNext**: 다음 페이지 존재 여부 (true/false)
            - **pageSize**: 현재 페이지 크기
            - **pageNo**: 현재 페이지 번호
            
            ### 🧪 Mock 데이터 구성
            **사용자 1001L (김철수)**: 5명의 전문가 찜
            **사용자 1002L (이영희)**: 2명의 전문가 찜
            **기타 사용자**: 빈 목록 반환
            
            ### 🔗 사용 흐름
            1. 일반 사용자로 로그인하여 USER 권한 토큰 획득
            2. Authorization 헤더에 토큰 포함하여 API 호출
            3. 찜한 전문가 목록 조회 및 화면 표시
            4. 더보기 필요 시 pageNo 증가하여 추가 호출
            """,
                    parameters = {
                                    @Parameter(
                                                    name = "Authorization",
                                                    description = "Bearer 토큰 (USER 권한 필수)",
                                                    required = true,
                                                    example = "Bearer MOCK_TOKEN_a1b2c3d4_ACCESS_1001_USER"
                                    ),
                                    @Parameter(
                                                    name = "pageNo",
                                                    description = "조회할 페이지 번호 (1부터 시작)",
                                                    example = "1"
                                    ),
                                    @Parameter(
                                                    name = "pageSize",
                                                    description = "페이지당 항목 수",
                                                    example = "10"
                                    )
                    }
    )
    @ApiResponses({
                    @ApiResponse(
                                    responseCode = "200",
                                    description = "찜한 전문가 조회 성공",
                                    content = @Content(
                                                    mediaType = "application/json",
                                                    examples = {
                                                                    @ExampleObject(
                                                                                    name = "전체 조회 (pageSize=10)",
                                                                                    summary = "김철수(1001L) - 전체 찜 목록",
                                                                                    value = """
                            {
                              "httpStatus": "OK",
                              "isSuccess": true,
                              "message": "요청에 성공하였습니다.",
                              "code": 200,
                              "result": {
                                "content": [
                                  {
                                    "advisorId": 2001,
                                    "nickname": "한승우",
                                    "profileImage": "/images/profiles/advisor2001.png",
                                    "shortIntro": "단기 투자 전문가입니다",
                                    "preferredTradeStyle": "SHORT"
                                  },
                                  {
                                    "advisorId": 2002,
                                    "nickname": "이수진",
                                    "profileImage": "/images/profiles/advisor2002.png",
                                    "shortIntro": "중장기 안정적 투자 전문가",
                                    "preferredTradeStyle": "MID_LONG"
                                  },
                                  {
                                    "advisorId": 2005,
                                    "nickname": "박소영"
                                  }
                                ],
                                "nextCursor": null,
                                "hasNext": false,
                                "pageSize": 10,
                                "pageNo": 1
                              }
                            }
                            """
                                                                    ),
                                                                    @ExampleObject(
                                                                                    name = "페이징 조회 (pageSize=3)",
                                                                                    summary = "김철수(1001L) - 3개씩 조회",
                                                                                    value = """
                            {
                              "httpStatus": "OK",
                              "isSuccess": true,
                              "message": "요청에 성공하였습니다.",
                              "code": 200,
                              "result": {
                                "content": [
                                  {
                                    "advisorId": 2001,
                                    "nickname": "한승우",
                                    "profileImage": "/images/profiles/advisor2001.png",
                                    "shortIntro": "단기 투자 전문가입니다",
                                    "preferredTradeStyle": "SHORT"
                                  },
                                  {
                                    "advisorId": 2002,
                                    "nickname": "이수진",
                                    "profileImage": "/images/profiles/advisor2002.png",
                                    "shortIntro": "중장기 안정적 투자 전문가",
                                    "preferredTradeStyle": "MID_LONG"
                                  },
                                  {
                                    "advisorId": 2004,
                                    "nickname": "김동현",
                                    "profileImage": "/images/profiles/advisor2004.png",
                                    "shortIntro": "AI 기반 투자 전략 전문가",
                                    "preferredTradeStyle": "MID"
                                  }
                                ],
                                "nextCursor": 3,
                                "hasNext": true,
                                "pageSize": 3,
                                "pageNo": 1
                              }
                            }
                            """
                                                                    ),
                                                                    @ExampleObject(
                                                                                    name = "빈 목록",
                                                                                    summary = "찜한 전문가가 없는 경우",
                                                                                    value = """
                            {
                              "httpStatus": "OK",
                              "isSuccess": true,
                              "message": "요청에 성공하였습니다.",
                              "code": 200,
                              "result": {
                                "content": [],
                                "nextCursor": null,
                                "hasNext": false,
                                "pageSize": 10,
                                "pageNo": 1
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
                                    responseCode = "403",
                                    description = "권한 없음 (USER가 아닌 역할)",
                                    content = @Content(
                                                    examples = @ExampleObject(
                                                                    name = "전문가/관리자 접근 시도",
                                                                    value = """
                        {
                          "httpStatus": "FORBIDDEN",
                          "isSuccess": false,
                          "message": "해당 역할로 접근할 권한이 없습니다.",
                          "code": 2007,
                          "result": "해당 역할로 접근할 권한이 없습니다."
                        }
                        """
                                                    )
                                    )
                    )
    })
    @GetMapping("/advisors")
    public BaseResponse<CursorPage<FavoriteAdvisorResponseDto>> getFavoriteAdvisors(
                    @RequestHeader(value = "Authorization", required = false) String token,
                    PageRequestDto pageRequest
    ) {
        log.info("찜한 전문가 조회 요청 - 페이지: {}, 사이즈: {}", pageRequest.getPageNo(), pageRequest.getPageSize());

        // 토큰에서 사용자 정보 추출
        Long userId = extractUserIdFromToken(token);
        String userRole = extractRoleFromToken(token);

        if (userId == null || token == null) {
            return new BaseResponse<>(BaseResponseStatus.INVALID_TOKEN);
        }

        // 일반 사용자만 접근 가능
        if (!"USER".equals(userRole)) {
            return new BaseResponse<>(BaseResponseStatus.UNAUTHORIZED_ROLE);
        }

        // Mock 찜 데이터 조회
        List<MockFavoriteAdvisor> userFavorites = mockFavoriteData.getOrDefault(userId, new ArrayList<>());

        // 페이징 처리
        int startIndex = pageRequest.getOffset();
        int endIndex = Math.min(startIndex + pageRequest.getLimitPlusOne(), userFavorites.size());

        List<MockFavoriteAdvisor> pagedFavorites;
        if (startIndex >= userFavorites.size()) {
            pagedFavorites = new ArrayList<>();
        } else {
            pagedFavorites = userFavorites.subList(startIndex, endIndex);
        }

        // hasNext 판단을 위해 limitPlusOne 사용
        boolean hasNext = pagedFavorites.size() > pageRequest.getPageSize();
        if (hasNext) {
            pagedFavorites = pagedFavorites.subList(0, pageRequest.getPageSize());
        }

        // DTO 변환
        List<FavoriteAdvisorResponseDto> responseList = pagedFavorites.stream()
                        .map(this::convertToDto)
                        .toList();

        // CursorPage 생성
        Long nextCursor = hasNext ? (long) (startIndex + pageRequest.getPageSize()) : null;

        CursorPage<FavoriteAdvisorResponseDto> cursorPage = CursorPage.<FavoriteAdvisorResponseDto>builder()
                        .content(responseList)
                        .nextCursor(nextCursor)
                        .hasNext(hasNext)
                        .pageSize(pageRequest.getPageSize())
                        .pageNo(pageRequest.getPageNo())
                        .build();

        log.info("찜한 전문가 조회 성공 - 사용자: {}, 조회된 수: {}, hasNext: {}", userId, responseList.size(), hasNext);

        return new BaseResponse<>(cursorPage);
    }

    // 기존 메서드들 (변환, 토큰 파싱)
    private FavoriteAdvisorResponseDto convertToDto(MockFavoriteAdvisor mock) {
        return FavoriteAdvisorResponseDto.builder()
                        .advisorId(mock.getAdvisorId())
                        .nickname(mock.getNickname())
                        .profileImage(mock.getProfileImage())
                        .shortIntro(mock.getShortIntro())
                        .preferredTradeStyle(mock.getPreferredTradeStyle())
                        .build();
    }

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

    private String extractRoleFromToken(String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return null;
            }

            String mockToken = token.substring(7);

            if (!mockToken.startsWith("MOCK_TOKEN_")) {
                return null;
            }

            String[] parts = mockToken.split("_");
            if (parts.length >= 6) {
                return parts[5];
            }

            return null;
        } catch (Exception e) {
            log.warn("Mock token role parsing error: {}", e.getMessage());
            return null;
        }
    }
}
