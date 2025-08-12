package com.Stalk.project.global.notification.service;

import com.Stalk.project.global.notification.dao.NotificationMapper;
import com.Stalk.project.global.notification.dto.in.NotificationCreateDto;
import com.Stalk.project.global.notification.dto.in.NotificationType;
import com.Stalk.project.global.notification.dto.out.*;
import com.Stalk.project.global.notification.event.CommentCreatedEvent;
import com.Stalk.project.global.util.NotificationRedisUtil;
import com.Stalk.project.global.response.BaseResponseStatus;
import com.Stalk.project.global.exception.BaseException;
import com.Stalk.project.global.util.CursorPage;
import com.Stalk.project.global.util.PageRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;
    private final NotificationRedisUtil redisUtil;

    /**
     * 알람 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public CursorPage<NotificationResponseDto> getNotifications(Long userId, PageRequestDto pageRequest) {
        log.debug("알람 목록 조회 시작 - userId: {}, pageNo: {}", userId, pageRequest.getPageNo());
        
        // DB에서 알람 목록 조회
        List<NotificationResponseDto> notifications = notificationMapper.findNotificationsByUserId(userId, pageRequest);
        
        // hasNext 판단 (limitPlusOne 방식)
        boolean hasNext = notifications.size() > pageRequest.getPageSize();
        if (hasNext) {
            notifications.remove(notifications.size() - 1);
        }
        
        log.debug("알람 목록 조회 완료 - 조회된 개수: {}, hasNext: {}", notifications.size(), hasNext);
        
        return CursorPage.<NotificationResponseDto>builder()
                .content(notifications)
                .nextCursor(null) // 커서 페이징이 아닌 오프셋 페이징 사용
                .hasNext(hasNext)
                .pageSize(pageRequest.getPageSize())
                .pageNo(pageRequest.getPageNo())
                .build();
    }

    /**
     * 알람 읽음 처리
     */
    @Transactional
    public NotificationReadResponseDto markAsRead(Long notificationId, Long userId) {
        log.debug("알람 읽음 처리 시작 - notificationId: {}, userId: {}", notificationId, userId);
        
        // 알람 존재 여부 및 소유자 확인
        Boolean exists = notificationMapper.existsByIdAndUserId(notificationId, userId);
        if (!Boolean.TRUE.equals(exists)) {
            throw new BaseException(BaseResponseStatus.NOTIFICATION_NOT_FOUND);
        }
        
        // 읽음 처리 (이미 읽은 경우 0 반환)
        int updatedRows = notificationMapper.markAsRead(notificationId, userId);
        
        String message;
        if (updatedRows > 0) {
            // Redis 캐시에서 읽지않은 개수 감소
            redisUtil.decrementUnreadCount(userId);
            message = "알람을 읽음으로 처리했습니다.";
            log.debug("알람 읽음 처리 완료 - notificationId: {}", notificationId);
        } else {
            message = "이미 읽은 알람입니다.";
            log.debug("이미 읽은 알람 - notificationId: {}", notificationId);
        }
        
        return NotificationReadResponseDto.builder()
                .notificationId(notificationId)
                .message(message)
                .build();
    }

    /**
     * 읽지않은 알람 개수 조회
     */
    @Transactional(readOnly = true)
    public UnreadCountResponseDto getUnreadCount(Long userId) {
        log.debug("읽지않은 알람 개수 조회 시작 - userId: {}", userId);
        
        // Redis에서 캐시된 개수 조회
        Integer cachedCount = redisUtil.getUnreadCount(userId);
        
        // 캐시가 없으면 DB에서 조회하고 캐시 업데이트
        if (cachedCount == null || cachedCount == 0) {
            Integer dbCount = notificationMapper.countUnreadNotifications(userId);
            if (dbCount != null && dbCount > 0) {
                redisUtil.resetUnreadCount(userId, dbCount);
                cachedCount = dbCount;
            } else {
                cachedCount = 0;
            }
        }
        
        // 마지막 확인 시간 업데이트
        redisUtil.updateLastCheckTime(userId);
        
        Long lastCheckTime = redisUtil.getLastCheckTime(userId);
        
        log.debug("읽지않은 알람 개수 조회 완료 - userId: {}, count: {}", userId, cachedCount);
        
        return UnreadCountResponseDto.builder()
                .unreadCount(cachedCount)
                .lastCheckTime(lastCheckTime)
                .build();
    }

    /**
     * 최근 알람 확인 (폴링용)
     */
    @Transactional(readOnly = true)
    public RecentNotificationsResponseDto getRecentNotifications(Long userId) {
        log.debug("최근 알람 확인 시작 - userId: {}", userId);
        
        // 마지막 확인 시간 조회
        Long lastCheckTime = redisUtil.getLastCheckTime(userId);
        
        List<NotificationResponseDto> newNotifications;
        if (lastCheckTime != null) {
            // 마지막 확인 시간 이후의 새로운 알람 조회
            newNotifications = notificationMapper.findNewNotifications(userId, lastCheckTime);
        } else {
            // 처음 확인하는 경우 최근 5개만
            PageRequestDto pageRequest = new PageRequestDto(1, 5);
            newNotifications = notificationMapper.findNotificationsByUserId(userId, pageRequest);
        }
        
        // 마지막 확인 시간 업데이트
        redisUtil.updateLastCheckTime(userId);
        
        // 전체 읽지않은 개수 조회
        Integer totalUnreadCount = getUnreadCount(userId).getUnreadCount();
        
        log.debug("최근 알람 확인 완료 - userId: {}, 새 알람: {}개", userId, newNotifications.size());
        
        return RecentNotificationsResponseDto.builder()
                .newNotifications(newNotifications)
                .newCount(newNotifications.size())
                .totalUnreadCount(totalUnreadCount)
                .hasNewNotifications(!newNotifications.isEmpty())
                .build();
    }

    /**
     * 알람 생성 (내부 사용)
     */
    @Transactional
    public void createNotification(NotificationCreateDto dto) {
        try {
            log.debug("알람 생성 시작 - userId: {}, type: {}", dto.getUserId(), dto.getType());
            
            // DB에 알람 저장
            notificationMapper.createNotification(dto);
            
            // Redis 캐시에서 읽지않은 개수 증가
            redisUtil.incrementUnreadCount(dto.getUserId());
            
            log.debug("알람 생성 완료 - userId: {}, type: {}", dto.getUserId(), dto.getType());
            
        } catch (Exception e) {
            log.error("알람 생성 실패 - userId: {}, type: {}", dto.getUserId(), dto.getType(), e);
            throw new BaseException(BaseResponseStatus.NOTIFICATION_CREATE_FAILED);
        }
    }

    /**
     * 예약 생성 알람 생성
     */
    public void createReservationCreatedNotification(Long advisorUserId, String clientName, String dateTime) {
        NotificationCreateDto dto = NotificationCreateDto.builder()
                .userId(advisorUserId)
                .type(NotificationType.RESERVATION_CREATED)
                .title("새로운 상담 예약")
                .message(String.format("%s님이 %s 상담을 예약했습니다.", clientName, dateTime))
                .build();
        
        createNotification(dto);
    }

    /**
     * 예약 취소 알람 생성
     */
    public void createReservationCanceledNotification(Long targetUserId, String canceledByName, String dateTime, String reason) {
        NotificationCreateDto dto = NotificationCreateDto.builder()
                .userId(targetUserId)
                .type(NotificationType.RESERVATION_CANCELED)
                .title("상담 예약 취소")
                .message(String.format("%s님이 %s 상담 예약을 취소했습니다. (사유: %s)", canceledByName, dateTime, reason))
                .build();
        
        createNotification(dto);
    }

    /**
     * 예약 승인 알람 생성
     */
    public void createReservationApprovedNotification(Long clientUserId, String advisorName, String dateTime) {
        NotificationCreateDto dto = NotificationCreateDto.builder()
                .userId(clientUserId)
                .type(NotificationType.RESERVATION_APPROVED)
                .title("상담 예약 승인")
                .message(String.format("%s 전문가가 %s 상담을 승인했습니다.", advisorName, dateTime))
                .build();
        
        createNotification(dto);
    }

    /**
     * 댓글 작성 알람 생성
     */
    public void createCommentCreatedNotification(Long postAuthorId, Long commentId, String commenterName, String postTitle) {
        NotificationCreateDto dto = NotificationCreateDto.builder()
                .userId(postAuthorId)
                .type(NotificationType.COMMENT_CREATED)
                .title("새로운 댓글")
                .message(String.format("%s님이 '%s' 글에 댓글을 남겼습니다.", commenterName, postTitle))
                .relatedId(commentId)
                .build();
        
        createNotification(dto);
    }

    /**
     * Redis와 DB 동기화 (관리자용)
     */
    @Transactional
    public void syncRedisWithDatabase(Long userId) {
        try {
            log.debug("Redis-DB 동기화 시작 - userId: {}", userId);
            
            // DB에서 실제 읽지않은 개수 조회
            Integer dbCount = notificationMapper.countUnreadNotifications(userId);
            
            // Redis 캐시 업데이트
            redisUtil.resetUnreadCount(userId, dbCount != null ? dbCount : 0);
            
            log.debug("Redis-DB 동기화 완료 - userId: {}, count: {}", userId, dbCount);
            
        } catch (Exception e) {
            log.error("Redis-DB 동기화 실패 - userId: {}", userId, e);
        }
    }

    /**
     * 사용자의 모든 알람을 읽음 처리
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        try {
            log.debug("모든 알람 읽음 처리 시작 - userId: {}", userId);
            
            int updatedRows = notificationMapper.markAllAsRead(userId);
            
            if (updatedRows > 0) {
                // Redis 캐시 리셋
                redisUtil.resetUnreadCount(userId, 0);
            }
            
            log.debug("모든 알람 읽음 처리 완료 - userId: {}, 처리된 개수: {}", userId, updatedRows);
            
        } catch (Exception e) {
            log.error("모든 알람 읽음 처리 실패 - userId: {}", userId, e);
            throw new BaseException(BaseResponseStatus.NOTIFICATION_UPDATE_FAILED);
        }
    }

    /**
     * 댓글 작성 알람 생성
     */
    public void createCommentNotification(CommentCreatedEvent event) {
        try {
            // 알람 메시지 생성
            NotificationType notificationType = NotificationType.COMMENT_CREATED;
            String message = notificationType.getMessageTemplate()
                .replace("{commentAuthor}", event.getCommentAuthorName())
                .replace("{postTitle}", event.getPostTitle());

            // 알람 DTO 생성
            NotificationCreateDto notificationDto = NotificationCreateDto.builder()
                .userId(event.getPostAuthorId())
                .type(NotificationType.valueOf(notificationType.getCode()))  // name() → getCode()로 수정
                .title(notificationType.getTitle())
                .message(message)
                .relatedId(event.getCommentId())
                .build();

            // 알람 생성 (MySQL + Redis)
            createNotification(notificationDto);

            log.info("댓글 알람 생성 완료: 수신자={}, 댓글ID={}",
                event.getPostAuthorId(), event.getCommentId());

        } catch (Exception e) {
            log.error("댓글 알람 생성 중 오류 발생: {}", e.getMessage(), e);
        }
    }
}