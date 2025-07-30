package com.Stalk.project.community.dto.out;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CommunityCommentCreateResponseDto {

  private Long commentId;
  private String createdAt;
  private String message;

}