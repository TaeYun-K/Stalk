package com.Stalk.project.openvidu.controller;

import com.Stalk.project.openvidu.dto.out.SessionTokenResponseDto;
import com.Stalk.project.openvidu.service.ConsultationSessionService;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;
import org.springframework.web.server.ResponseStatusException;

@Tag(name = "상담 관련 Controller")
@Slf4j
@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

  private final ConsultationSessionService sessionService;

  public ConsultationController(ConsultationSessionService sessionService) {
    this.sessionService = sessionService;
  }


  @Operation(summary = "상담방 생성", description = "주어진 consultation로 Openvidu 세션을 생성하고 토큰을 반환합니다.")
  @PostMapping("/{consultationId}/session")
  public ResponseEntity<SessionTokenResponseDto> createSessionToken(
      @PathVariable String consultationId) {
    
    log.info("▶ 상담방 세션 토큰 생성 요청: consultationId={}", consultationId);
    try {
      SessionTokenResponseDto dto = sessionService.createSessionAndGetToken(consultationId);
      log.info("✅ 세션 토큰 생성 성공: {}", dto.getToken());
      return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    } catch (Exception e) {
      log.error("❌ 세션 토큰 생성 실패: consultationId={}", consultationId, e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  @Operation(summary = "상담방 생성 여부 조회", description = "해당 consultationId의 방이 생성되면 token 반환, 아니면 404 반환")
  @GetMapping("/{consultationId}/session")
  public ResponseEntity<SessionTokenResponseDto > getSession(
      @PathVariable String consultationId) {
    try {
      SessionTokenResponseDto  info = sessionService.getSessionInfo(consultationId);
      return ResponseEntity.ok(info);
    } catch (NoSuchElementException e) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  @Operation(
      summary = "상담방 종료",
      description = "주어진 consultationId에 해당하는 OpenVidu 세션을 종료합니다."
  )
  @DeleteMapping("/{consultationId}/session")
  public ResponseEntity<Void> closeSession(
      @PathVariable String consultationId) {
    try {
      sessionService.closeSession(consultationId);
      // 204 No Content
      return ResponseEntity.noContent().build();
    } catch (ResponseStatusException e) {
      // 404 등 예외 상태 그대로 전달
      return ResponseEntity.status(e.getStatusCode()).build();
    } catch (OpenViduJavaClientException | OpenViduHttpException e) {
      // OpenVidu 서버 연결 오류
      return ResponseEntity
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .build();
    }
  }
}
