package com.Stalk.project.api.ai.dto;

import lombok.Data;

@Data
public class VideoSummaryDTO {

  private Long id;
  private String videoUrl;
  private String transcript;
  private String summary;
  private String createdAt;
}