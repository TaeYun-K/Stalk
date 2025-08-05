package com.Stalk.project.global.notification.listener;

import com.Stalk.project.global.notification.dto.in.NotificationCreateDto;
import com.Stalk.project.global.notification.dto.in.NotificationType;
import com.Stalk.project.global.notification.event.*;
import com.Stalk.project.global.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    @Async("notificationExecutor") // 비동기 처리
    @EventListener
    public void handleReservationCreated(ReservationCreatedEvent event) {
        try {
            NotificationCreateDto dto = NotificationCreateDto.builder()
                    .userId(event.getTargetUserId())
                    .type(NotificationType.RESERVATION_CREATED)
                    .title("새로운 상담 예약")
                    .message(event.getMessage())
                    .build();
            
            notificationService.createNotification(dto);
            
            log.debug("예약 생성 알람 전송 완료 - advisorId: {}", event.getAdvisorUserId());
            
        } catch (Exception e) {
            log.error("예약 생성 알람 전송 실패 - advisorId: {}", event.getAdvisorUserId(), e);
        }
    }

    @Async("notificationExecutor")
    @EventListener
    public void handleReservationCanceled(ReservationCanceledEvent event) {
        try {
            NotificationCreateDto dto = NotificationCreateDto.builder()
                    .userId(event.getTargetUserId())
                    .type(NotificationType.RESERVATION_CANCELED)
                    .title("상담 예약 취소")
                    .message(event.getMessage())
                    .build();
            
            notificationService.createNotification(dto);
            
            log.debug("예약 취소 알람 전송 완료 - targetUserId: {}", event.getTargetUserId());
            
        } catch (Exception e) {
            log.error("예약 취소 알람 전송 실패 - targetUserId: {}", event.getTargetUserId(), e);
        }
    }

    @Async("notificationExecutor")
    @EventListener
    public void handleCommentCreated(CommentCreatedEvent event) {
        try {
            NotificationCreateDto dto = NotificationCreateDto.builder()
                    .userId(event.getTargetUserId())
                    .type(NotificationType.COMMENT_CREATED)
                    .title("새로운 댓글")
                    .message(event.getMessage())
                    .relatedId(event.getCommentId())
                    .build();
            
            notificationService.createNotification(dto);
            
            log.debug("댓글 작성 알람 전송 완료 - postAuthorId: {}", event.getTargetUserId());
            
        } catch (Exception e) {
            log.error("댓글 작성 알람 전송 실패 - postAuthorId: {}", event.getTargetUserId(), e);
        }
    }
}