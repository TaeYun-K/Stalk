package com.Stalk.project.api.ai.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class VideoSummary {

  private Long id;
  private String videoUrl;
  private String transcript;
  private String summary;
  private LocalDateTime createdAt;
}