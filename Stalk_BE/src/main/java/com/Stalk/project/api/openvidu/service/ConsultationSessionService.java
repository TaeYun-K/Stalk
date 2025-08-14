package com.Stalk.project.api.openvidu.service;

import com.Stalk.project.api.openvidu.mapper.ConsultationSessionMapper;
import com.Stalk.project.api.openvidu.dto.out.SessionTokenResponseDto;
import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.concurrent.ConcurrentHashMap;
@Slf4j
@Service
@RequiredArgsConstructor
public class ConsultationSessionService {

  private final OpenVidu openVidu;

  @Value("${openvidu.url}")
  private String openviduUrl;
  private final Map<String, Session> sessionMap = new ConcurrentHashMap<>();
  private final Map<String, Instant> createdAtMap = new ConcurrentHashMap<>();

  private final ConsultationSessionMapper consultationSessionMapper;
  private final VideoRecordingService videoRecordingService;


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

    // 1) sessionMap에서 기존 세션 가져오기 (있을 경우)
    Session session = sessionMap.get(consultationId);

    // 2) 세션 유효성 확인 (서버에 아직 살아있는지)
    if (session != null) {
      openVidu.fetch(); // OpenVidu 상태 최신화

      Session existingSession = session;
      boolean isValid = openVidu.getActiveSessions().stream()
              .anyMatch(s -> s.getSessionId().equals(existingSession.getSessionId()));

      if (!isValid) {
        log.warn("기존 세션이 OpenVidu에서 만료됨. 새로 생성합니다. consultationId={}, expiredSessionId={}",
                consultationId, session.getSessionId());
        sessionMap.remove(consultationId);
        createdAtMap.remove(consultationId);
        // 세션 만료된 경우 → 재귀 호출로 새로 생성
        return createSessionAndGetToken(consultationId);
      }

      // ✅ (안전) ROUTED 확인: 혹시 과거에 RELAYED로 만들어졌다면 녹화 불가 → 재생성 유도
      if (existingSession.getProperties() != null
              && existingSession.getProperties().mediaMode() != MediaMode.ROUTED) {
        log.warn("기존 세션이 ROUTED가 아님. 재생성합니다. consultationId={}, sessionId={}",
                consultationId, existingSession.getSessionId());
        // 주의: 실제로는 기존 세션에 참여자가 있으면 강제 종료가 필요할 수 있음
        sessionMap.remove(consultationId);
        createdAtMap.remove(consultationId);
        return createSessionAndGetToken(consultationId);
      }
    }

    // 3) 세션 get-or-create (ROUTED + MANUAL 로 고정)
    session = sessionMap.computeIfAbsent(consultationId, id -> {
      try {
        SessionProperties props = new SessionProperties.Builder()
                .mediaMode(MediaMode.ROUTED)          // ✅ COMPOSED 녹화 필수
                .recordingMode(RecordingMode.MANUAL)  // ✅ API로 시작/종료 제어
                // .customSessionId("con_" + id)       // (선택) 디버깅 편의
                .build();

        Session newSession = openVidu.createSession(props);
        createdAtMap.put(id, Instant.now());

        // 4) 세션 생성 시 DB에 sessionId 저장
        try {
          consultationSessionMapper.updateSessionId(Long.parseLong(consultationId), newSession.getSessionId());
          log.info("세션 생성 및 DB 저장 완료: consultationId={}, sessionId={}", consultationId, newSession.getSessionId());
        } catch (Exception e) {
          log.error("세션 ID DB 저장 실패: consultationId={}", consultationId, e);
          // DB 저장 실패해도 세션은 계속 진행
        }

        return newSession;
      } catch (OpenViduJavaClientException | OpenViduHttpException e) {
        throw new IllegalStateException("OpenVidu 세션 생성 실패", e);
      }
    });

    // 5) 토큰 발급 (역할/데이터가 필요하면 여기서 명시)
    String token = generateToken(session, consultationId);

    // 6) 세션 생성 시각 조회
    String createdAt = createdAtMap.get(consultationId).toString();

    // 7) DTO 반환
    return new SessionTokenResponseDto(
            session.getSessionId(),
            token,
            createdAt);
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
        createdAt);
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

    String sessionId = session.getSessionId();

    try {

      if (session.isBeingRecorded()) {
        Recording recording = openVidu.stopRecording(sessionId);
        videoRecordingService.saveStoppedRecording(recording);
      }

      session.close();

      // DB 상태 변경
      consultationSessionMapper.updateStatusToApprovedBySessionId(sessionId);

      // 메모리에서 세션 정보 제거
      sessionMap.remove(consultationId);
      createdAtMap.remove(consultationId);

      log.info("상담 종료 완료: consultationId={}, sessionId={}", consultationId, sessionId);
    } catch (Exception e) {
      log.error("상담방 종료 실패: {}", consultationId, e);
      throw new IllegalStateException("상담방 종료 실패", e);
    }
  }
}
