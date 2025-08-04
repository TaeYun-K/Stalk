package com.Stalk.project.api.community.dto.in;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "커뮤니티 글 수정 요청 DTO")
public class CommunityPostUpdateRequestDto {

  @NotBlank(message = "제목은 필수입니다.")
  @Size(max = 200, message = "제목은 200자 이하로 입력해주세요.")
  @Schema(description = "글 제목", example = "수정된 주식 투자 질문입니다", required = true)
  private String title;

  @NotBlank(message = "내용은 필수입니다.")
  @Size(max = 5000, message = "내용은 5000자 이하로 입력해주세요.")
  @Schema(description = "글 내용", example = "수정된 내용입니다...", required = true)
  private String content;

  @NotNull(message = "카테고리는 필수입니다.")
  @Schema(description = "글 카테고리", example = "QUESTION", required = true)
  private PostCategory category;
}