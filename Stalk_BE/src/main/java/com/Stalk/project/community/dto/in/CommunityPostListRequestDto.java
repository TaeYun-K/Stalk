package com.Stalk.project.community.dto.in;

import com.Stalk.project.util.PageRequestDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class CommunityPostListRequestDto extends PageRequestDto {

  @Schema(defaultValue = "ALL", description = "카테고리 필터")
  private PostCategory category = PostCategory.ALL;
}