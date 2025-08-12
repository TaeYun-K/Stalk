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
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    @Async("notificationExecutor") // 비동기 처리
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleReservationCreated(ReservationCreatedEvent event) {
        try {
            NotificationCreateDto dto = NotificationCreateDto.builder()
                .userId(event.getTargetUserId())
                .type(NotificationType.RESERVATION_CREATED)
                .title("새로운 상담 예약")
                .message(event.getMessage())
                .relatedId(event.getReservationId())  // 이 줄만 추가
                .build();

            notificationService.createNotification(dto);

            log.debug("예약 생성 알람 전송 완료 - advisorId: {}", event.getAdvisorUserId());

        } catch (Exception e) {
            log.error("예약 생성 알람 전송 실패 - advisorId: {}", event.getAdvisorUserId(), e);
        }
    }

    @Async("notificationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
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

    /**
     * 댓글 작성 이벤트 처리
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("notificationExecutor")
    public void handleCommentCreated(CommentCreatedEvent event) {
        try {
            log.info("댓글 알람 이벤트 수신: postId={}, commentId={}, 글작성자={}, 댓글작성자={}",
                event.getPostId(), event.getCommentId(), event.getPostAuthorId(), event.getCommentAuthorId());

            // 자기 글에 자기가 댓글 달면 알람 안 보내기
            if (!event.getCommentAuthorId().equals(event.getPostAuthorId())) {
                notificationService.createCommentNotification(event);
                log.info("댓글 알람 전송 완료: 수신자={}", event.getPostAuthorId());
            } else {
                log.info("자기 댓글이므로 알람 전송 안함: userId={}", event.getCommentAuthorId());
            }
        } catch (Exception e) {
            log.error("댓글 알람 처리 중 오류 발생: postId={}, commentId={}",
                event.getPostId(), event.getCommentId(), e);
        }
    }
}