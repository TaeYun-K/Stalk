package com.Stalk.project.global.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationRedisUtil {

    @Qualifier("notificationRedisTemplate")
    private final RedisTemplate<String, Object> redisTemplate;
    
    // Redis 키 패턴
    private static final String UNREAD_COUNT_KEY = "notification:unread_count:";
    private static final String LAST_CHECK_KEY = "notification:last_check:";
    private static final String RECENT_NOTIFICATIONS_KEY = "notification:recent:";
    
    /**
     * 읽지 않은 알람 개수 증가
     */
    public void incrementUnreadCount(Long userId) {
        try {
            String key = UNREAD_COUNT_KEY + userId;
            redisTemplate.opsForValue().increment(key);
            // 30일 후 자동 삭제
            redisTemplate.expire(key, Duration.ofDays(30));
            log.debug("사용자 {}의 읽지않은 알람 개수 증가", userId);
        } catch (Exception e) {
            log.error("읽지않은 알람 개수 증가 실패: userId={}", userId, e);
        }
    }
    
    /**
     * 읽지 않은 알람 개수 감소
     */
    public void decrementUnreadCount(Long userId) {
        try {
            String key = UNREAD_COUNT_KEY + userId;
            Long count = redisTemplate.opsForValue().decrement(key);
            // 음수가 되지 않도록 처리
            if (count != null && count < 0) {
                redisTemplate.opsForValue().set(key, 0);
            }
            log.debug("사용자 {}의 읽지않은 알람 개수 감소", userId);
        } catch (Exception e) {
            log.error("읽지않은 알람 개수 감소 실패: userId={}", userId, e);
        }
    }
    
    /**
     * 읽지 않은 알람 개수 조회
     */
    public Integer getUnreadCount(Long userId) {
        try {
            String key = UNREAD_COUNT_KEY + userId;
            Object count = redisTemplate.opsForValue().get(key);
            return count != null ? (Integer) count : 0;
        } catch (Exception e) {
            log.error("읽지않은 알람 개수 조회 실패: userId={}", userId, e);
            return 0;
        }
    }
    
    /**
     * 읽지 않은 알람 개수 리셋 (DB와 동기화용)
     */
    public void resetUnreadCount(Long userId, Integer count) {
        try {
            String key = UNREAD_COUNT_KEY + userId;
            redisTemplate.opsForValue().set(key, count);
            redisTemplate.expire(key, Duration.ofDays(30));
            log.debug("사용자 {}의 읽지않은 알람 개수 리셋: {}", userId, count);
        } catch (Exception e) {
            log.error("읽지않은 알람 개수 리셋 실패: userId={}", userId, e);
        }
    }
    
    /**
     * 마지막 확인 시간 저장
     */
    public void updateLastCheckTime(Long userId) {
        try {
            String key = LAST_CHECK_KEY + userId;
            long timestamp = System.currentTimeMillis();
            redisTemplate.opsForValue().set(key, timestamp);
            redisTemplate.expire(key, Duration.ofDays(7));
            log.debug("사용자 {}의 마지막 확인시간 업데이트: {}", userId, timestamp);
        } catch (Exception e) {
            log.error("마지막 확인시간 업데이트 실패: userId={}", userId, e);
        }
    }
    
    /**
     * 마지막 확인 시간 조회
     */
    public Long getLastCheckTime(Long userId) {
        try {
            String key = LAST_CHECK_KEY + userId;
            Object timestamp = redisTemplate.opsForValue().get(key);
            return timestamp != null ? (Long) timestamp : null;
        } catch (Exception e) {
            log.error("마지막 확인시간 조회 실패: userId={}", userId, e);
            return null;
        }
    }
    
    /**
     * 최근 알람 ID 추가 (중복 방지용)
     */
    public void addRecentNotification(Long userId, Long notificationId) {
        try {
            String key = RECENT_NOTIFICATIONS_KEY + userId;
            redisTemplate.opsForSet().add(key, notificationId);
            redisTemplate.expire(key, Duration.ofHours(1)); // 1시간 후 삭제
        } catch (Exception e) {
            log.error("최근 알람 추가 실패: userId={}, notificationId={}", userId, notificationId, e);
        }
    }
    
    /**
     * 최근 알람 확인 (중복 체크용)
     */
    public boolean isRecentNotification(Long userId, Long notificationId) {
        try {
            String key = RECENT_NOTIFICATIONS_KEY + userId;
            return Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(key, notificationId));
        } catch (Exception e) {
            log.error("최근 알람 확인 실패: userId={}, notificationId={}", userId, notificationId, e);
            return false;
        }
    }
    
    /**
     * 사용자의 모든 알람 관련 캐시 삭제
     */
    public void clearUserNotificationCache(Long userId) {
        try {
            Set<String> keys = redisTemplate.keys("notification:*:" + userId);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("사용자 {}의 알람 캐시 삭제 완료", userId);
            }
        } catch (Exception e) {
            log.error("사용자 알람 캐시 삭제 실패: userId={}", userId, e);
        }
    }
}