package com.Stalk.project.api.openvidu.mapper;

import com.Stalk.project.api.openvidu.dto.out.VideoRecording;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface VideoRecordingMapper {

    void insertRecording(VideoRecording recording);

    void updateRecordingOnStop(@Param("recordingId") String recordingId,
                                @Param("endTime") LocalDateTime endTime,
                                @Param("url") String url,
                                @Param("status") String status);

    List<VideoRecording> findByConsultationId(Long consultationId);
}
