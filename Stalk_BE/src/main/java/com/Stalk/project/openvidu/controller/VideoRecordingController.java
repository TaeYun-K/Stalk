package com.Stalk.project.openvidu.controller;

import com.Stalk.project.openvidu.service.VideoRecordingService;
import com.Stalk.project.response.BaseResponse;
import com.Stalk.project.response.BaseResponseStatus;
import io.openvidu.java.client.*;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
