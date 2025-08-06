package com.Stalk.project.api.ai.entity;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class AnalysisResult {

  private Long id;
  private String originalFileName;
  private String gcsUri;
  private String analysisSummary;
  private LocalDateTime createdAt;
}