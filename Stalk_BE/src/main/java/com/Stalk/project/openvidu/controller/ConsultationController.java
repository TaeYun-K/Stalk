package com.Stalk.project.openvidu.controller;

import com.Stalk.project.openvidu.dto.out.SessionInfoDto;
import com.Stalk.project.openvidu.dto.out.SessionTokenResponseDto;
import com.Stalk.project.openvidu.service.ConsultationSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;

@Tag(name = "상담 관련 Controller")
@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

  private final ConsultationSessionService sessionService;

  public ConsultationController(ConsultationSessionService sessionService) {
    this.sessionService = sessionService;
  }


  @Operation(summary = "상담방 생성")
  @PostMapping("/{consultationId}/session")
  public ResponseEntity<SessionTokenResponseDto> createSessionToken(
      @PathVariable String consultationId) {
    try {
      SessionTokenResponseDto dto =
          sessionService.createSessionAndGetToken(consultationId);
      return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  @Operation(summary = "상담방 생성 여부 조회")
  @GetMapping("/{consultationId}/session")
  public ResponseEntity<SessionInfoDto> getSession(
      @PathVariable String consultationId) {
    try {
      SessionInfoDto info = sessionService.getSessionInfo(consultationId);
      return ResponseEntity.ok(info);
    } catch (NoSuchElementException e) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }
}
