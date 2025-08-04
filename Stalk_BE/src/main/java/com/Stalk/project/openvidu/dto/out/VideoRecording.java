package com.Stalk.project.openvidu.dto.out;

import lombok.Data;

@Data
public class VideoRecording {
    private Long id;
    private Long consultationId;
    private String recordingId;
    private String sessionId;
    private String url;
    private String startTime;
    private String endTime;
    private String status;
}
