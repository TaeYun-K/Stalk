package com.Stalk.project.favorite.controller;

import com.Stalk.project.favorite.dto.out.FavoriteActionResponseDto;
import com.Stalk.project.favorite.dto.out.FavoriteAdvisorResponseDto;
import com.Stalk.project.favorite.service.FavoriteService;
import com.Stalk.project.login.util.SecurityUtil;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.response.BaseResponseStatus;
import com.Stalk.project.util.CursorPage;
import com.Stalk.project.util.PageRequestDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favorites")
@Tag(name = "⭐ Favorite API", description = "찜 관련 API")
@RequiredArgsConstructor
@Slf4j
public class FavoriteController {

    private final FavoriteService favoriteService;

    @Operation(summary = "찜한 전문가 조회", description = "현재 로그인한 일반 사용자가 찜한 전문가 목록을 조회합니다.")
    @GetMapping("/advisors")
    public BaseResponse<CursorPage<FavoriteAdvisorResponseDto>> getFavoriteAdvisors(
                    PageRequestDto pageRequest
    ) {
        try {
            log.info("찜한 전문가 조회 요청 - 페이지: {}, 사이즈: {}", pageRequest.getPageNo(), pageRequest.getPageSize());

            // USER 권한 검증
            if (!SecurityUtil.isCurrentUserRegularUser()) {
                log.warn("찜한 전문가 조회 권한 없음 - 역할: {}", SecurityUtil.getCurrentUserRole());
                return new BaseResponse<>(BaseResponseStatus.UNAUTHORIZED_ROLE);
            }

            // 현재 사용자 ID 추출
            Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();

            // 찜한 전문가 목록 조회
            CursorPage<FavoriteAdvisorResponseDto> favoriteAdvisors =
                            favoriteService.getFavoriteAdvisorsByUser(currentUserId, pageRequest);

            log.info("찜한 전문가 조회 성공 - 사용자: {}, 조회된 수: {}",
                            currentUserId, favoriteAdvisors.getContent().size());

            return new BaseResponse<>(favoriteAdvisors);

        } catch (RuntimeException e) {
            log.error("찜한 전문가 조회 중 인증 오류: {}", e.getMessage());
            return new BaseResponse<>(BaseResponseStatus.INVALID_USER_JWT);
        } catch (Exception e) {
            log.error("찜한 전문가 조회 중 예외 발생", e);
            return new BaseResponse<>(BaseResponseStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "전문가 찜 추가", description = "특정 전문가를 찜 목록에 추가합니다.")
    @PostMapping("/advisors/{advisorId}")
    public BaseResponse<FavoriteActionResponseDto> addFavoriteAdvisor(
                    @PathVariable @Parameter(description = "찜할 전문가 ID") Long advisorId
    ) {
        try {
            log.info("전문가 찜 추가 요청 - 전문가 ID: {}", advisorId);

            // USER 권한 검증
            if (!SecurityUtil.isCurrentUserRegularUser()) {
                log.warn("찜 추가 권한 없음 - 역할: {}", SecurityUtil.getCurrentUserRole());
                return new BaseResponse<>(BaseResponseStatus.UNAUTHORIZED_ROLE);
            }

            // 현재 사용자 ID 추출
            Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();

            // 찜 추가 처리 (Service에서 BaseResponse 직접 반환)
            return favoriteService.addFavoriteAdvisor(currentUserId, advisorId);

        } catch (RuntimeException e) {
            log.error("찜 추가 중 인증 오류: {}", e.getMessage());
            return new BaseResponse<>(BaseResponseStatus.INVALID_USER_JWT);
        } catch (Exception e) {
            log.error("찜 추가 중 예외 발생", e);
            return new BaseResponse<>(BaseResponseStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "전문가 찜 삭제", description = "특정 전문가를 찜 목록에서 제거합니다.")
    @DeleteMapping("/advisors/{advisorId}")
    public BaseResponse<FavoriteActionResponseDto> removeFavoriteAdvisor(
                    @PathVariable @Parameter(description = "찜 삭제할 전문가 ID") Long advisorId
    ) {
        try {
            log.info("전문가 찜 삭제 요청 - 전문가 ID: {}", advisorId);

            // USER 권한 검증
            if (!SecurityUtil.isCurrentUserRegularUser()) {
                log.warn("찜 삭제 권한 없음 - 역할: {}", SecurityUtil.getCurrentUserRole());
                return new BaseResponse<>(BaseResponseStatus.UNAUTHORIZED_ROLE);
            }

            // 현재 사용자 ID 추출
            Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();

            // 찜 삭제 처리 (Service에서 BaseResponse 직접 반환)
            return favoriteService.removeFavoriteAdvisor(currentUserId, advisorId);

        } catch (RuntimeException e) {
            log.error("찜 삭제 중 인증 오류: {}", e.getMessage());
            return new BaseResponse<>(BaseResponseStatus.INVALID_USER_JWT);
        } catch (Exception e) {
            log.error("찜 삭제 중 예외 발생", e);
            return new BaseResponse<>(BaseResponseStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
