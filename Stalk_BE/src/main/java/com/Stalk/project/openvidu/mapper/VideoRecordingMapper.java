package com.Stalk.project.openvidu.mapper;

import com.Stalk.project.openvidu.dto.out.VideoRecording;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface VideoRecordingMapper {

    void insertRecording(VideoRecording recording);

    void updateRecordingOnStop(@Param("recordingId") String recordingId,
                                @Param("endTime") String endTime,
                                @Param("url") String url,
                                @Param("status") String status);
}
