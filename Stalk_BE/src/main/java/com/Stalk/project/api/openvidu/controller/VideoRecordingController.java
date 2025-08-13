package com.Stalk.project.api.openvidu.controller;

import com.Stalk.project.api.openvidu.dto.out.VideoRecording;
import com.Stalk.project.api.openvidu.service.VideoRecordingService;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.global.response.BaseResponseStatus;
import io.openvidu.java.client.Connection;
import io.openvidu.java.client.ConnectionProperties;
import io.openvidu.java.client.ConnectionType;
import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduRole;
import io.openvidu.java.client.Recording;
import io.openvidu.java.client.RecordingLayout;
import io.openvidu.java.client.RecordingProperties;
import io.openvidu.java.client.Session;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/recordings")
@RequiredArgsConstructor
public class VideoRecordingController {

    private final OpenVidu openVidu;
    private final VideoRecordingService recordingService;

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

    @Operation(summary = "녹화 시작")
    @PostMapping("/start/{sessionId}")
    public ResponseEntity<BaseResponse<Void>> startRecording(@PathVariable String sessionId,
                                                            @RequestParam Long consultationId) {
        try {
            RecordingProperties properties = new RecordingProperties.Builder()
                .outputMode(Recording.OutputMode.COMPOSED)
                .recordingLayout(RecordingLayout.PICTURE_IN_PICTURE)
                .name("recording_" + sessionId)
                .hasAudio(true)
                .hasVideo(true)
                .build();

            Recording recording = openVidu.startRecording(sessionId, properties);
            recordingService.saveStartedRecording(recording, consultationId);

            return ResponseEntity.ok(new BaseResponse<>(BaseResponseStatus.SUCCESS));
        } catch (Exception e) {
            log.error("🔴 녹화 시작 실패: {}", e.getMessage(), e); // ✅ 로그 추가
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

}
