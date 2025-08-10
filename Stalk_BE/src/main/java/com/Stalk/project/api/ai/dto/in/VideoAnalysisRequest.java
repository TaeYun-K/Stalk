package com.Stalk.project.api.ai.dto.in;

import lombok.Data;

/**
 * 영상 분석 요청 시 URL을 전달받기 위한 DTO
 */
@Data
public class VideoAnalysisRequest {
  private String videoUrl;
}