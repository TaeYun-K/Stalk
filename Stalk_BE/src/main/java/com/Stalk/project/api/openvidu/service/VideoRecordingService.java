package com.Stalk.project.api.openvidu.service;


import com.Stalk.project.api.openvidu.mapper.VideoRecordingMapper;
import com.Stalk.project.api.openvidu.dto.out.VideoRecording;
import io.openvidu.java.client.Recording;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class VideoRecordingService {

    private final VideoRecordingMapper videoRecordingMapper;

    // 녹화 시작 시 DB 저장
    public void saveStartedRecording(Recording recording, Long consultationId) {
        VideoRecording entity = new VideoRecording();
        entity.setConsultationId(consultationId);
        entity.setRecordingId(recording.getId());
        entity.setSessionId(recording.getSessionId());

        LocalDateTime startTime = Instant.ofEpochMilli(recording.getCreatedAt())
            .atZone(ZoneId.systemDefault())
            .toLocalDateTime();

        entity.setStartTime(startTime);
        entity.setStatus("started");

        videoRecordingMapper.insertRecording(entity);
    }

    // 녹화 종료 시 DB 업데이트
    public void saveStoppedRecording(Recording recording) {
        LocalDateTime endTime = LocalDateTime.now(ZoneId.systemDefault());
        videoRecordingMapper.updateRecordingOnStop(
            recording.getId(),
            endTime,
            recording.getUrl(),
            recording.getStatus().name()
        );
    }

    public List<VideoRecording> getRecordingsByConsultation(Long consultationId) {
        return videoRecordingMapper.findByConsultationId(consultationId);
    }
}
