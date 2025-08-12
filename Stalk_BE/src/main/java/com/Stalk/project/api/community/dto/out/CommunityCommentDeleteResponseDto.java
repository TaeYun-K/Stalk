package com.Stalk.project.api.community.dto.out;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CommunityCommentDeleteResponseDto {

  private Long commentId;
  private String deletedAt;
  private String message;

}