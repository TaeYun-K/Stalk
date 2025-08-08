package com.Stalk.project.api.favorite.stock.dao;

import org.apache.ibatis.annotations.Mapper;
import java.util.List;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface FavoriteStockMapper {
    /**
     * 특정 사용자가 등록한 모든 관심 종목의 티커 목록을 조회
     * @param userId 사용자 ID
     * @return 관심 종목 티커 리스트
     */
    List<String> findTickersByUserId(Long userId);
    /**
     * 특정 사용자의 관심 종목으로 특정 티커가 이미 존재하는지 확인합니다.
     * @param userId 사용자 ID
     * @param stockTicker 종목 티커
     * @return 존재하면 1, 아니면 0
     */
    int exists(@Param("userId") Long userId, @Param("stockTicker") String stockTicker);

    /**
     * 관심 종목을 추가합니다.
     * @param userId 사용자 ID
     * @param stockTicker 종목 티커
     */
    void addFavorite(@Param("userId") Long userId, @Param("stockTicker") String stockTicker);

    /**
     * 관심 종목을 삭제합니다.
     * @param userId 사용자 ID
     * @param stockTicker 종목 티커
     */
    void deleteFavorite(@Param("userId") Long userId, @Param("stockTicker") String stockTicker);
}