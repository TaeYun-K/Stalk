package com.Stalk.project.openvidu.service;

import com.Stalk.project.openvidu.dto.out.SessionTokenResponseDto;
import io.openvidu.java.client.*;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.server.ResponseStatusException;

@Service
@Slf4j
public class ConsultationSessionService {

  private final OpenVidu openVidu;
  // 메모리나 DB에 세션 객체를 캐싱할 수 있습니다.
  private final Map<String, Session> sessionMap = new ConcurrentHashMap<>();
  private final Map<String, Instant> createdAtMap = new ConcurrentHashMap<>();

  public ConsultationSessionService(OpenVidu openVidu) {
    this.openVidu = openVidu;
  }


  /**
   * 토큰 발급 메서드
   */
  private String generateToken(Session session, String consultationId)
      throws OpenViduJavaClientException, OpenViduHttpException {
    ConnectionProperties props = new ConnectionProperties.Builder()
        .type(ConnectionType.WEBRTC)
        .data("consultationId=" + consultationId)
        .build();

    return session.createConnection(props).getToken();
  }

  /**
   * consulttationId에 해당하는 방을 생성하고, token 발급
   */
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


  /**
   * 신규 조회 메서드
   */
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

  /**
   * 주어진 sessionId(consultationId)에 해당하는 OpenVidu 세션을 종료합니다.
   */
  public void closeSession(String consultationId)
      throws OpenViduJavaClientException, OpenViduHttpException {
    Session session = sessionMap.get(consultationId);
    if (session == null) {
      throw new NoSuchElementException("Session not found");
    }

    try {
      // 1) OpenVidu 세션 종료
      session.close();

      // 2) 메모리에서 세션 정보 제거
      sessionMap.remove(consultationId);
      createdAtMap.remove(consultationId);

      log.info("상담방 종료 완료: {}", consultationId);
    } catch (OpenViduJavaClientException | OpenViduHttpException e) {
      log.error("상담방 종료 실패: {}", consultationId, e);
      throw new IllegalStateException("상담방 종료 실패", e);
    }
  }
}
