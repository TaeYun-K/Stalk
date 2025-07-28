package com.Stalk.project.openvidu.service;

import io.openvidu.java.client.*;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ConsultationSessionService {

    private final OpenVidu openVidu;
    // 메모리나 DB에 세션 객체를 캐싱할 수 있습니다.
    private final Map<String, Session> sessionMap = new ConcurrentHashMap<>();

    public ConsultationSessionService(OpenVidu openVidu) {
        this.openVidu = openVidu;
    }

    public String getTokenForConsultation(String consultationId) throws OpenViduJavaClientException, OpenViduHttpException {
        // 1) 세션이 없으면 생성
        Session session = sessionMap.computeIfAbsent(consultationId, id -> {
            try {
                return openVidu.createSession();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        // 2) 토큰 옵션 설정 (예: 사용자 이름 등 메타데이터 포함)
        ConnectionProperties connectionProps = new ConnectionProperties.Builder()
            .type(ConnectionType.WEBRTC)
            .data("consultationId=" + consultationId)
            .build();

        // 3) 토큰 발급
        return session.createConnection(connectionProps).getToken();
    }
}
