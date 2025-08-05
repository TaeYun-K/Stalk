package com.Stalk.project.api.community.dto.out;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CommunityCommentUpdateResponseDto {

  private Long commentId;
  private String updatedAt;
  private String message;

}