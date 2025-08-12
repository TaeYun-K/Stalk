package com.Stalk.project.api.favorite.advisor.service;

import com.Stalk.project.api.favorite.advisor.dao.FavoriteMapper;
import com.Stalk.project.api.favorite.advisor.dto.out.FavoriteActionResponseDto;
import com.Stalk.project.api.favorite.advisor.dto.out.FavoriteAdvisorResponseDto;
import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.global.response.BaseResponseStatus;
import com.Stalk.project.global.util.CursorPage;
import com.Stalk.project.global.util.PageRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FavoriteService {

    private final FavoriteMapper favoriteMapper;

    /**
     * 사용자가 찜한 전문가 목록 조회
     *
     * @param userId 사용자 ID (users.id)
     * @param pageRequest 페이징 요청 정보
     * @return CursorPage<FavoriteAdvisorResponseDto> 찜한 전문가 목록
     */
    public CursorPage<FavoriteAdvisorResponseDto> getFavoriteAdvisorsByUser(Long userId, PageRequestDto pageRequest) {
        log.info("찜한 전문가 목록 조회 시작 - 사용자: {}, 페이지: {}, 크기: {}",
                        userId, pageRequest.getPageNo(), pageRequest.getPageSize());

        // limitPlusOne 방식으로 hasNext 판단을 위해 한 개 더 조회
        List<FavoriteAdvisorResponseDto> favoriteAdvisors =
                        favoriteMapper.findFavoriteAdvisorsByUserId(userId, pageRequest);

        // hasNext 판단
        boolean hasNext = favoriteAdvisors.size() > pageRequest.getPageSize();
        if (hasNext) {
            // 실제 반환할 데이터에서 마지막 하나 제거
            favoriteAdvisors = favoriteAdvisors.subList(0, pageRequest.getPageSize());
        }

        // nextCursor 계산 (다음 페이지 번호)
        Long nextCursor = hasNext ? (long) (pageRequest.getPageNo() + 1) : null;

        // CursorPage 생성
        CursorPage<FavoriteAdvisorResponseDto> result = CursorPage.<FavoriteAdvisorResponseDto>builder()
                        .content(favoriteAdvisors)
                        .nextCursor(nextCursor)
                        .hasNext(hasNext)
                        .pageSize(pageRequest.getPageSize())
                        .pageNo(pageRequest.getPageNo())
                        .build();

        log.info("찜한 전문가 목록 조회 완료 - 사용자: {}, 조회 결과: {}개, hasNext: {}",
                        userId, favoriteAdvisors.size(), hasNext);

        return result;
    }

    /**
     * 전문가 찜 추가
     *
     * @param userId 사용자 ID (users.id)
     * @param advisorId 전문가 ID (advisor.advisor_id)
     * @return BaseResponse<FavoriteActionResponseDto> 처리 결과
     */
    @Transactional
    public BaseResponse<FavoriteActionResponseDto> addFavoriteAdvisor(Long userId, Long advisorId) {
        log.info("전문가 찜 추가 시작 - 사용자: {}, 전문가: {}", userId, advisorId);

        // 1. 전문가 존재 및 승인 여부 확인
        if (!favoriteMapper.isAdvisorExistsAndApproved(advisorId)) {
            log.warn("존재하지 않거나 승인되지 않은 전문가 - ID: {}", advisorId);
            throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND);
        }

        // 2. 이미 찜했는지 확인
        boolean alreadyFavorited = favoriteMapper.isFavoriteExists(userId, advisorId);

        FavoriteActionResponseDto responseDto = FavoriteActionResponseDto.builder()
                        .advisorId(advisorId)
                        .build();

        if (alreadyFavorited) {
            log.info("이미 찜한 전문가 - 사용자: {}, 전문가: {}", userId, advisorId);
            return new BaseResponse<>(
                            HttpStatus.OK, true, "이미 찜한 전문가입니다.", 200, responseDto
            );
        }

        // 3. 새로운 찜 추가
        int insertResult = favoriteMapper.insertFavorite(userId, advisorId);
        if (insertResult == 0) {
            log.error("찜 추가 실패 - 사용자: {}, 전문가: {}", userId, advisorId);
            throw new BaseException(BaseResponseStatus.INTERNAL_SERVER_ERROR);
        }

        log.info("전문가 찜 추가 완료 - 사용자: {}, 전문가: {}", userId, advisorId);

        return new BaseResponse<>(
                        HttpStatus.OK, true, "전문가를 찜 목록에 추가했습니다.", 200, responseDto
        );
    }

    /**
     * 전문가 찜 삭제
     *
     * @param userId 사용자 ID (users.id)
     * @param advisorId 전문가 ID (advisor.advisor_id)
     * @return BaseResponse<FavoriteActionResponseDto> 처리 결과
     */
    @Transactional
    public BaseResponse<FavoriteActionResponseDto> removeFavoriteAdvisor(Long userId, Long advisorId) {
        log.info("전문가 찜 삭제 시작 - 사용자: {}, 전문가: {}", userId, advisorId);

        // 1. 전문가 존재 및 승인 여부 확인
        if (!favoriteMapper.isAdvisorExistsAndApproved(advisorId)) {
            log.warn("존재하지 않거나 승인되지 않은 전문가 - ID: {}", advisorId);
            throw new BaseException(BaseResponseStatus.ADVISOR_NOT_FOUND);
        }

        // 2. 찜 삭제 시도
        int deleteResult = favoriteMapper.deleteFavorite(userId, advisorId);

        FavoriteActionResponseDto responseDto = FavoriteActionResponseDto.builder()
                        .advisorId(advisorId)
                        .build();

        if (deleteResult == 0) {
            log.info("찜하지 않은 전문가 삭제 시도 - 사용자: {}, 전문가: {}", userId, advisorId);
            return new BaseResponse<>(
                            HttpStatus.OK, true, "찜하지 않은 전문가입니다.", 200, responseDto
            );
        } else {
            log.info("전문가 찜 삭제 완료 - 사용자: {}, 전문가: {}", userId, advisorId);
            return new BaseResponse<>(
                            HttpStatus.OK, true, "찜 목록에서 삭제했습니다.", 200, responseDto
            );
        }
    }
}
