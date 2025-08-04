package com.Stalk.project.api.openvidu.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.messaging.handler.annotation.SendTo;

import java.time.Instant;

@Schema(description = "상담방 생성 및 입장 시, 토큰을 발급하는 response")
@Data
@AllArgsConstructor
public class SessionTokenResponseDto {

  private final String sessionId;
  private final String token;
  private final String createdAt;

  public SessionTokenResponseDto(String sessionId, String token, Instant createdAt) {
    this.sessionId = sessionId;
    this.token = token;
    this.createdAt = createdAt.toString();
  }
}
