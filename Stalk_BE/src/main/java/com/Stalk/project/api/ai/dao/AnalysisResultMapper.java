package com.Stalk.project.api.ai.dao;

import com.Stalk.project.api.ai.entity.AnalysisResult;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AnalysisResultMapper {

  /**
   * 분석 결과를 데이터베이스에 삽입
   *
   * @param result 저장할 분석 결과 객체
   */
  void insert(AnalysisResult result);

  /**
   * video_recording_id를 사용하여 분석 결과를 조회
   *
   * @param videoRecordingId 조회할 녹화 ID
   * @return 조회된 분석 결과 객체, 없으면 null
   */
  AnalysisResult findByVideoRecordingId(Long videoRecordingId);
}