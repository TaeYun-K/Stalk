package com.Stalk.project.openvidu.service;

import com.Stalk.project.openvidu.dto.out.SessionInfoDto;
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

    public SessionTokenResponseDto createSessionAndGetToken(String reservationId)
            throws OpenViduJavaClientException, OpenViduHttpException {
        try {
            // 1) 세션이 없으면 생성
            Session session = sessionMap.computeIfAbsent(reservationId, id -> {
                try {
                    Session s = openVidu.createSession();
                    createdAtMap.put(id, Instant.now());
                    return s;
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });

            // 2) 토큰 옵션 설정 (예: 사용자 이름 등 메타데이터 포함)
            ConnectionProperties connectionProps = new ConnectionProperties.Builder()
                    .type(ConnectionType.WEBRTC)
                    .data("reservationId=" + reservationId)
                    .build();

            // 3) 토큰 발급
            String token = session.createConnection(connectionProps).getToken();

            // 4) 생성 시각 조회
            Instant createdAt = createdAtMap.get(reservationId);

            // 5) DTO 반환
            return new SessionTokenResponseDto(
                    session.getSessionId(),
                    token,
                    createdAt.toString()
            );
        }catch (Exception e) {
            throw new RuntimeException("세션 생성 또는 토큰 발급 중 오류 발생", e);
        }
    }

    // 신규 조회 메서드
    public SessionInfoDto getSessionInfo(String reservationId) {
        Session session = sessionMap.get(reservationId);
        if (session == null) {
            throw new NoSuchElementException("Session not found");
        }
        Instant createdAt = createdAtMap.get(reservationId);
        return new SessionInfoDto(session.getSessionId(), createdAt.toString());
    }
}
