package com.Stalk.project.community.dto.in;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Getter
@Setter
@ToString
public class CommunityPostCreateRequestDto {

  @NotNull(message = "카테고리는 필수입니다.")
  @Schema(description = "글 카테고리")
  private PostCategory category;

  @NotBlank(message = "제목은 필수입니다.")
  @Size(max = 200, message = "제목은 200자 이하여야 합니다.")
  @Schema(description = "글 제목", example = "주식 투자 관련 질문입니다")
  private String title;

  @NotBlank(message = "내용은 필수입니다.")
  @Size(max = 5000, message = "내용은 5000자 이하여야 합니다.")
  @Schema(description = "글 내용", example = "투자 초보인데 어떤 종목을 선택해야 할지 조언 부탁드립니다.")
  private String content;
}