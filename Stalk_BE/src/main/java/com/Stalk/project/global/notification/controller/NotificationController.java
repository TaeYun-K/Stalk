package com.Stalk.project.global.notification.controller;

import com.Stalk.project.global.notification.dto.out.*;
import com.Stalk.project.global.notification.service.NotificationService;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.global.util.CursorPage;
import com.Stalk.project.global.util.PageRequestDto;
import com.Stalk.project.global.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification", description = "알람 관리 API")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(
        summary = "알람 목록 조회", 
        description = "현재 로그인한 사용자의 알람 목록을 페이징으로 조회합니다."
    )
    public BaseResponse<CursorPage<NotificationResponseDto>> getNotifications(
            @Parameter(description = "페이지 번호", example = "1") @RequestParam(defaultValue = "1") int pageNo,
            @Parameter(description = "페이지 크기", example = "10") @RequestParam(defaultValue = "10") int pageSize
    ) {
        log.debug("알람 목록 조회 요청 - pageNo: {}, pageSize: {}", pageNo, pageSize);
        
        // 현재 로그인한 사용자 ID 조회
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        
        // 페이지 요청 DTO 생성
        PageRequestDto pageRequest = new PageRequestDto(pageNo, pageSize);
        
        // 알람 목록 조회
        CursorPage<NotificationResponseDto> notifications = notificationService.getNotifications(currentUserId, pageRequest);
        
        log.debug("알람 목록 조회 완료 - 조회된 개수: {}", notifications.getContent().size());
        
        return new BaseResponse<>(notifications);
    }

    @PutMapping("/{notificationId}/read")
    @Operation(
        summary = "알람 읽음 처리", 
        description = "특정 알람을 읽음 상태로 변경합니다."
    )
    public BaseResponse<NotificationReadResponseDto> markAsRead(
            @Parameter(description = "알람 ID", required = true) @PathVariable Long notificationId
    ) {
        log.debug("알람 읽음 처리 요청 - notificationId: {}", notificationId);
        
        // 현재 로그인한 사용자 ID 조회
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        
        // 알람 읽음 처리
        NotificationReadResponseDto response = notificationService.markAsRead(notificationId, currentUserId);
        
        log.debug("알람 읽음 처리 완료 - notificationId: {}", notificationId);
        
        return new BaseResponse<>(response);
    }

    @GetMapping("/unread-count")
    @Operation(
        summary = "읽지않은 알람 개수 조회", 
        description = "현재 로그인한 사용자의 읽지않은 알람 개수를 조회합니다."
    )
    public BaseResponse<UnreadCountResponseDto> getUnreadCount() {
        log.debug("읽지않은 알람 개수 조회 요청");
        
        // 현재 로그인한 사용자 ID 조회
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        
        // 읽지않은 알람 개수 조회
        UnreadCountResponseDto response = notificationService.getUnreadCount(currentUserId);
        
        log.debug("읽지않은 알람 개수 조회 완료 - count: {}", response.getUnreadCount());
        
        return new BaseResponse<>(response);
    }

    @GetMapping("/recent")
    @Operation(
        summary = "최근 알람 확인", 
        description = "마지막 확인 이후의 새로운 알람을 조회합니다. (폴링용)"
    )
    public BaseResponse<RecentNotificationsResponseDto> getRecentNotifications() {
        log.debug("최근 알람 확인 요청");
        
        // 현재 로그인한 사용자 ID 조회
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        
        // 최근 알람 확인
        RecentNotificationsResponseDto response = notificationService.getRecentNotifications(currentUserId);
        
        log.debug("최근 알람 확인 완료 - 새 알람: {}개", response.getNewCount());
        
        return new BaseResponse<>(response);
    }

    @PutMapping("/mark-all-read")
    @Operation(
        summary = "모든 알람 읽음 처리", 
        description = "현재 로그인한 사용자의 모든 읽지않은 알람을 읽음 상태로 변경합니다."
    )
    public BaseResponse<Void> markAllAsRead() {
        log.debug("모든 알람 읽음 처리 요청");
        
        // 현재 로그인한 사용자 ID 조회
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        
        // 모든 알람 읽음 처리
        notificationService.markAllAsRead(currentUserId);
        
        log.debug("모든 알람 읽음 처리 완료");
        
        return new BaseResponse<>();
    }

    @PostMapping("/sync")
    @Operation(
        summary = "Redis-DB 동기화", 
        description = "Redis 캐시와 데이터베이스의 읽지않은 알람 개수를 동기화합니다. (관리자용)"
    )
    public BaseResponse<Void> syncRedisWithDatabase() {
        log.debug("Redis-DB 동기화 요청");
        
        // 현재 로그인한 사용자 ID 조회
        Long currentUserId = SecurityUtil.getCurrentUserPrimaryId();
        
        // Redis-DB 동기화
        notificationService.syncRedisWithDatabase(currentUserId);
        
        log.debug("Redis-DB 동기화 완료");
        
        return new BaseResponse<>();
    }
}