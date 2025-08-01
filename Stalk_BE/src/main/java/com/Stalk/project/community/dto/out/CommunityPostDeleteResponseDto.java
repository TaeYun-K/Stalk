package com.Stalk.project.community.dto.out;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "커뮤니티 글 삭제 응답 DTO")
public class CommunityPostDeleteResponseDto {

  @JsonProperty("postId")
  @Schema(description = "삭제된 글 ID", example = "1")
  private Long postId;

  @JsonProperty("deletedAt")
  @Schema(description = "삭제 일시 (ISO 8601 형식)", example = "2025-07-29T15:45:00+09:00")
  private String deletedAt;

  @JsonProperty("message")
  @Schema(description = "삭제 완료 메시지", example = "글이 성공적으로 삭제되었습니다.")
  private String message;
}