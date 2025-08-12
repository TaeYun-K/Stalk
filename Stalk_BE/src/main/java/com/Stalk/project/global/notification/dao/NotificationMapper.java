package com.Stalk.project.global.notification.dao;

import com.Stalk.project.global.notification.dto.in.NotificationCreateDto;
import com.Stalk.project.global.notification.dto.out.NotificationResponseDto;
import com.Stalk.project.global.util.PageRequestDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationMapper {
    
    /**
     * 알람 생성
     */
    void createNotification(NotificationCreateDto dto);
    
    /**
     * 사용자별 알람 목록 조회 (페이징)
     */
    List<NotificationResponseDto> findNotificationsByUserId(
        @Param("userId") Long userId, 
        @Param("pageRequest") PageRequestDto pageRequest
    );
    
    /**
     * 알람 읽음 처리
     */
    int markAsRead(@Param("notificationId") Long notificationId, @Param("userId") Long userId);
    
    /**
     * 사용자의 읽지않은 알람 개수 조회
     */
    Integer countUnreadNotifications(@Param("userId") Long userId);
    
    /**
     * 특정 시간 이후의 새로운 알람 조회
     */
    List<NotificationResponseDto> findNewNotifications(
        @Param("userId") Long userId, 
        @Param("afterTimestamp") Long afterTimestamp
    );
    
    /**
     * 알람 존재 여부 및 소유자 확인
     */
    Boolean existsByIdAndUserId(@Param("notificationId") Long notificationId, @Param("userId") Long userId);
    
    /**
     * 사용자의 모든 알람을 읽음 처리
     */
    int markAllAsRead(@Param("userId") Long userId);
    
    /**
     * 오래된 알람 삭제 (30일 이상)
     */
    int deleteOldNotifications(@Param("daysBefore") int daysBefore);
}