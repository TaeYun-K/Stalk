package com.Stalk.project.api.ai.dto.out;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class VideoAnalysisResponse {

  private Long analysisId;
  private String fileName;
  private String summary;
  private LocalDateTime processedAt;
}