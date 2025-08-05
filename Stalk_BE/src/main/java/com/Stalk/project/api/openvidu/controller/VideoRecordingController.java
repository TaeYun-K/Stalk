package com.Stalk.project.api.openvidu.controller;

import com.Stalk.project.api.openvidu.dto.out.VideoRecording;
import com.Stalk.project.api.openvidu.service.VideoRecordingService;
import com.Stalk.project.global.response.BaseResponse;
import com.Stalk.project.global.response.BaseResponseStatus;
import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.Recording;
import io.openvidu.java.client.RecordingProperties;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
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

    @Operation(summary = "녹화 시작")
    @PostMapping("/start/{sessionId}")
    public ResponseEntity<BaseResponse<Void>> startRecording(@PathVariable String sessionId,
                                                             @RequestParam Long consultationId) {
        try {
            RecordingProperties properties = new RecordingProperties.Builder()
                .outputMode(Recording.OutputMode.COMPOSED)
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
