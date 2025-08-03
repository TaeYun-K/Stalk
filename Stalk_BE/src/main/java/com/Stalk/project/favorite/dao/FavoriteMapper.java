package com.Stalk.project.favorite.dao;

import com.Stalk.project.favorite.dto.out.FavoriteAdvisorResponseDto;
import com.Stalk.project.util.PageRequestDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 찜 관련 데이터베이스 접근 매퍼
 */
@Mapper
public interface FavoriteMapper {

    /**
     * 사용자가 찜한 전문가 목록 조회
     * 
     * @param userId 사용자 ID (users.id)
     * @param pageRequest 페이징 요청 정보
     * @return List<FavoriteAdvisorResponseDto> 찜한 전문가 목록
     */
    List<FavoriteAdvisorResponseDto> findFavoriteAdvisorsByUserId(
            @Param("userId") Long userId, 
            @Param("pageRequest") PageRequestDto pageRequest
    );

    /**
     * 전문가 존재 및 승인 여부 확인
     * 
     * @param advisorId 전문가 ID (advisor.advisor_id)
     * @return boolean 존재하고 승인된 전문가인지 여부
     */
    boolean isAdvisorExistsAndApproved(@Param("advisorId") Long advisorId);

    /**
     * 찜 존재 여부 확인
     * 
     * @param userId 사용자 ID (users.id)
     * @param advisorId 전문가 ID (advisor.advisor_id)
     * @return boolean 이미 찜했는지 여부
     */
    boolean isFavoriteExists(@Param("userId") Long userId, @Param("advisorId") Long advisorId);

    /**
     * 찜 추가
     * 
     * @param userId 사용자 ID (users.id)
     * @param advisorId 전문가 ID (advisor.advisor_id)
     * @return int 삽입된 행 수
     */
    int insertFavorite(@Param("userId") Long userId, @Param("advisorId") Long advisorId);

    /**
     * 찜 삭제
     * 
     * @param userId 사용자 ID (users.id)
     * @param advisorId 전문가 ID (advisor.advisor_id)
     * @return int 삭제된 행 수
     */
    int deleteFavorite(@Param("userId") Long userId, @Param("advisorId") Long advisorId);
}
