package com.Stalk.project.api.openvidu.controller;

import com.Stalk.project.api.openvidu.dto.out.VideoRecording;
import com.Stalk.project.api.openvidu.service.VideoRecordingService;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.global.response.BaseResponseStatus;
import io.openvidu.java.client.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeoutException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/recordings")
@RequiredArgsConstructor
public class VideoRecordingController {

    private final OpenVidu openVidu;
    private final VideoRecordingService recordingService;

    private static final long WAIT_TIMEOUT_MS = 10_000; // 최대 10초
    private static final long WAIT_INTERVAL_MS = 300;   // 폴링 간격

    @Operation(summary = "OV 연결 토큰 발급", description = "웹캠/화면공유 모두 공통. ownerId/ownerName/kind를 serverData로 저장")
    @PostMapping("/sessions/{sessionId}/connections")
    public ResponseEntity<BaseResponse<Map<String, String>>> createConnectionToken(
            @Parameter(description = "OpenVidu 세션 ID") @PathVariable String sessionId,
            @Parameter(description = "cam | screen") @RequestParam(defaultValue = "cam") String kind,
            @Parameter(description = "유저 ID(문자)") @RequestParam String userId,
            @Parameter(description = "유저 이름") @RequestParam String name
    ) {
        try {
            Session s = openVidu.getActiveSession(sessionId);
            if (s == null) {
                return ResponseEntity.status(404)
                        .body(new BaseResponse<>(BaseResponseStatus.NOT_FOUND_SESSION, "세션을 찾을 수 없습니다."));
            }

            // 서버 메타데이터(두 연결 모두 동일 스키마)
            String dataJson = String.format("{\"ownerId\":\"%s\",\"ownerName\":\"%s\",\"kind\":\"%s\"}", userId, name, kind);

            ConnectionProperties props = new ConnectionProperties.Builder()
                    .type(ConnectionType.WEBRTC)
                    .role(OpenViduRole.PUBLISHER)
                    .data(dataJson) // <= 핵심
                    .build();

            Connection connection = s.createConnection(props);
            return ResponseEntity.ok(new BaseResponse<>(Map.of("token", connection.getToken())));

        } catch (Exception e) {
            log.error("🔴 토큰 발급 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new BaseResponse<>(BaseResponseStatus.INTERNAL_SERVER_ERROR));
        }
    }

    @Operation(summary = "녹화 시작", description = "COMPOSED(PIP)로 녹화를 시작. 서버가 CAMERA+SCREEN 스트림을 인지할 때까지 대기 후 시작합니다.")
    @PostMapping("/start/{sessionId}")
    public ResponseEntity<BaseResponse<Void>> startRecording(
            @Parameter(description = "OpenVidu 세션 ID") @PathVariable String sessionId,
            @Parameter(description = "상담 ID") @RequestParam Long consultationId) {
        try {
            // ✅ 1) 서버가 CAM+SCREEN을 실제로 보고 있을 때까지 대기
            waitUntilServerSees(sessionId, Set.of("CAMERA", "SCREEN"), WAIT_TIMEOUT_MS, WAIT_INTERVAL_MS);

            // ✅ 2) 녹화 시작 (COMPOSED + PICTURE_IN_PICTURE)
            RecordingProperties properties = new RecordingProperties.Builder()
                    .outputMode(Recording.OutputMode.COMPOSED)
                    .recordingLayout(RecordingLayout.PICTURE_IN_PICTURE)
                    .name("recording_" + sessionId)
                    .hasAudio(true)
                    .hasVideo(true)
                    .build();

            Recording recording = openVidu.startRecording(sessionId, properties);

            // ✅ 3) DB 등 사후 처리
            recordingService.saveStartedRecording(recording, consultationId);

            return ResponseEntity.ok(new BaseResponse<>(BaseResponseStatus.SUCCESS));
        } catch (TimeoutException te) {
            log.warn("⏱️ 녹화 시작 대기 타임아웃: {}", te.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new BaseResponse<>(BaseResponseStatus.INTERNAL_SERVER_ERROR, "CAMERA/SCREEN 스트림이 서버에 인식되지 않았습니다."));
        } catch (Exception e) {
            log.error("🔴 녹화 시작 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new BaseResponse<>(BaseResponseStatus.INTERNAL_SERVER_ERROR));
        }
    }

    @Operation(summary = "녹화 종료")
    @PostMapping("/stop/{recordingId}")
    public ResponseEntity<BaseResponse<Void>> stopRecording(@PathVariable String recordingId) {
        try {
            Recording recording = openVidu.stopRecording(recordingId);
            recordingService.saveStoppedRecording(recording);

            return ResponseEntity.ok(new BaseResponse<>(BaseResponseStatus.SUCCESS));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new BaseResponse<>(BaseResponseStatus.INTERNAL_SERVER_ERROR));
        }
    }

    @Operation(summary = "상담별 녹화 목록 조회")
    @GetMapping("/consultations/{consultationId}/recordings")
    public ResponseEntity<BaseResponse<List<VideoRecording>>> getRecordingsByConsultation(
        @PathVariable Long consultationId) {

        List<VideoRecording> recordings = recordingService.getRecordingsByConsultation(consultationId);
        return ResponseEntity.ok(new BaseResponse<>(recordings));
    }



    /**
     * OpenVidu 서버 상태를 동기화(fetch)하면서,
     * 해당 세션이 지정한 typeOfVideo(CAMERA/SCREEN)를 모두 포함할 때까지 기다린다.
     */
    private void waitUntilServerSees(String sessionId, Set<String> needTypes,
                                     long timeoutMs, long intervalMs) throws TimeoutException {
        long deadline = System.currentTimeMillis() + timeoutMs;

        while (System.currentTimeMillis() < deadline) {
            if (hasAllTypes(sessionId, needTypes)) {
                return;
            }
            try {
                Thread.sleep(intervalMs);
            } catch (InterruptedException ignored) {}
        }
        throw new TimeoutException("Server did not see " + needTypes + " for session " + sessionId);
    }

    private boolean hasAllTypes(String sessionId, Set<String> needTypes) {
        try {
            // 서버 상태를 최신으로 동기화
            openVidu.fetch();

            // 활성 세션 중 대상 세션 찾기
            Session session = openVidu.getActiveSessions().stream()
                    .filter(s -> s.getSessionId().equals(sessionId))
                    .findFirst().orElse(null);

            if (session == null || session.getConnections() == null) return false;

            // 퍼블리셔들의 typeOfVideo 수집 (CAMERA / SCREEN)
            List<String> types = session.getConnections().stream()
                    .flatMap(c -> c.getPublishers().stream())
                    .map(Publisher::getTypeOfVideo) // "CAMERA" / "SCREEN"
                    .toList();

            // 모두 포함하는지 검사
            return needTypes.stream().allMatch(types::contains);
        } catch (OpenViduJavaClientException | OpenViduHttpException e) {
            log.warn("OpenVidu fetch 실패 또는 조회 오류: {}", e.getMessage());
            return false;
        }
    }

}
