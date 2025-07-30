package com.Stalk.project.openvidu.service;

import com.Stalk.project.openvidu.dto.out.SessionTokenResponseDto;
import io.openvidu.java.client.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ConsultationSessionService {

  private final OpenVidu openVidu;
  // 메모리나 DB에 세션 객체를 캐싱할 수 있습니다.
  private final Map<String, Session> sessionMap = new ConcurrentHashMap<>();
  private final Map<String, Instant> createdAtMap = new ConcurrentHashMap<>();

  public ConsultationSessionService(OpenVidu openVidu) {
    this.openVidu = openVidu;
  }

  private String generateToken(Session session, String consultationId)
      throws OpenViduJavaClientException, OpenViduHttpException {
    ConnectionProperties props = new ConnectionProperties.Builder()
        .type(ConnectionType.WEBRTC)
        .data("consultationId=" + consultationId)
        .build();

    return session.createConnection(props).getToken();
  }

  public SessionTokenResponseDto createSessionAndGetToken(String consultationId)
      throws OpenViduJavaClientException, OpenViduHttpException {
    // 1) 세션 get-or-create
    Session session = sessionMap.computeIfAbsent(consultationId, id -> {
      try {
        Session newSession = openVidu.createSession();
        createdAtMap.put(id, Instant.now());
        return newSession;
      } catch (OpenViduJavaClientException | OpenViduHttpException e) {
        throw new IllegalStateException("OpenVidu 세션 생성 실패", e);
      }
    });

    // 2) 토큰 발급 옵션 설정
    ConnectionProperties props = new ConnectionProperties.Builder()
        .type(ConnectionType.WEBRTC)
        .data("consultationId=" + consultationId)
        .build();

    // 3) 토큰 발급
    String token = generateToken(session, consultationId);

    // 4) 세션 생성 시각 조회
    String createdAt = createdAtMap
        .get(consultationId)
        .toString();

    // 5) DTO 반환
    return new SessionTokenResponseDto(
        session.getSessionId(),
        token,
        createdAt
    );
  }


  // 신규 조회 메서드
  public SessionTokenResponseDto getSessionInfo(String consultationId)
      throws OpenViduJavaClientException, OpenViduHttpException {
    Session session = sessionMap.get(consultationId);
    if (session == null) {
      throw new NoSuchElementException("Session not found");
    }

    String token = generateToken(session, consultationId);
    String createdAt = createdAtMap.get(consultationId).toString();
    return new SessionTokenResponseDto(
        session.getSessionId(),
        token,
        createdAt
    );
  }
}
