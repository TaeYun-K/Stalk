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
public class CommunityPostCreateResponseDto {

  private Long postId;
  private String title;
  private String category;
  private String message;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'+09:00'")
  private LocalDateTime createdAt;
}