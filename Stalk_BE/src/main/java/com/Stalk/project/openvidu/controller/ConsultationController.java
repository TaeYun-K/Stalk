package com.Stalk.project.openvidu.controller;

import com.Stalk.project.openvidu.dto.out.SessionTokenResponseDto;
import com.Stalk.project.openvidu.service.ConsultationSessionService;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.response.BaseResponseStatus;
import com.fasterxml.jackson.databind.ser.Serializers.Base;
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
  public ResponseEntity<BaseResponse<SessionTokenResponseDto>> createSessionToken(
      @PathVariable String consultationId) {
    
    log.info("▶ 상담방 세션 토큰 생성 요청: consultationId={}", consultationId);
    try {
      SessionTokenResponseDto dto = sessionService.createSessionAndGetToken(consultationId);
      log.info("✅ 세션 토큰 생성 성공: {}", dto.getToken());

      BaseResponse<SessionTokenResponseDto> response = new BaseResponse<>(dto);
      return ResponseEntity
          .status(HttpStatus.CREATED)
          .body(response);
    } catch (Exception e) {
      log.error("❌ 세션 토큰 생성 실패: consultationId={}", consultationId, e);
      BaseResponse<SessionTokenResponseDto> response =
          new BaseResponse<>(BaseResponseStatus.INTERNAL_SERVER_ERROR);
      return ResponseEntity
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(response);
    }
  }

  @Operation(
      summary = "상담방 생성 여부 조회",
      description = "해당 consultationId의 방이 이미 생성되어 있으면 토큰을, 없으면 404 상태의 에러 응답을 반환합니다."
  )
  @GetMapping("/{consultationId}/session")
  public ResponseEntity<BaseResponse<SessionTokenResponseDto>> getSession(
      @PathVariable String consultationId
  ) {
    log.info("▶ 상담방 세션 조회 요청: consultationId={}", consultationId);
    try {
      // 기존 세션 정보만 조회
      SessionTokenResponseDto info = sessionService.getSessionInfo(consultationId);
      log.info("✅ 세션 조회 성공: {}", info.getToken());

      BaseResponse<SessionTokenResponseDto> response = new BaseResponse<>(info);
      return ResponseEntity
          .ok(response);

    } catch (NoSuchElementException e) {
      log.warn("⚠️ 세션을 찾을 수 없음: consultationId={}", consultationId);

      BaseResponse<SessionTokenResponseDto> response =
          new BaseResponse<>(BaseResponseStatus.NOT_FOUND_SESSION);
      return ResponseEntity
          .status(HttpStatus.NOT_FOUND)
          .body(response);

    } catch (Exception e) {
      log.error("❌ 세션 조회 중 오류 발생: consultationId={}", consultationId, e);

      BaseResponse<SessionTokenResponseDto> response =
          new BaseResponse<>(BaseResponseStatus.INTERNAL_SERVER_ERROR);
      return ResponseEntity
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(response);
    }
  }

  @Operation(
          summary = "상담방 종료",
          description = "주어진 consultationId에 해당하는 OpenVidu 세션을 종료하고 sessionId를 저장, 관련 정보를 정리합니다."
  )
  @PostMapping("/{consultationId}/session/close")
  public ResponseEntity<BaseResponse<Void>> closeSession(
          @PathVariable String consultationId
  ) {
    log.info("▶ 상담방 세션 종료 요청: consultationId={}", consultationId);
    try {
      sessionService.closeSession(consultationId);
      log.info("✅ 세션 종료 성공: consultationId={}", consultationId);

      return ResponseEntity.ok(new BaseResponse<>(BaseResponseStatus.SUCCESS));

    } catch (ResponseStatusException e) {
      BaseResponseStatus status = e.getStatusCode() == HttpStatus.NOT_FOUND
              ? BaseResponseStatus.NOT_FOUND_SESSION
              : BaseResponseStatus.INTERNAL_SERVER_ERROR;
      return ResponseEntity.status(e.getStatusCode()).body(new BaseResponse<>(status));

    } catch (OpenViduJavaClientException | OpenViduHttpException e) {
      log.error("❌ OpenVidu 서버 에러로 세션 종료 실패:", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
              .body(new BaseResponse<>(BaseResponseStatus.INTERNAL_SERVER_ERROR));
    }
  }

}
