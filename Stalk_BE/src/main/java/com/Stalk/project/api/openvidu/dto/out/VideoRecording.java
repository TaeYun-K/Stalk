package com.Stalk.project.api.openvidu.dto.out;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class VideoRecording {
    private Long id;
    private Long consultationId;
    private String recordingId;
    private String sessionId;
    private String url;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
}
