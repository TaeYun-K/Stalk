package com.Stalk.project.community.dto.out;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityPostSummaryDto {

  private Long postId;
  private String title;
  private String authorName;
  private String authorRole; // USER or ADVISOR
  private String category;
  private String categoryDisplayName;
  private Integer viewCount;
  private Integer commentCount;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'+09:00'")
  private String createdAt;
}