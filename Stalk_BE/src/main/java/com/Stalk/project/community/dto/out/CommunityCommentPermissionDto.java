package com.Stalk.project.community.dto.out;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CommunityCommentPermissionDto {

  private Long id;
  private Long userId;
  private Long postId;
  private String content;

}