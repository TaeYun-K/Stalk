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
@Schema(description = "커뮤니티 글 수정 응답 DTO")
public class CommunityPostUpdateResponseDto {

  @JsonProperty("postId")
  @Schema(description = "수정된 글 ID", example = "1")
  private Long postId;

  @JsonProperty("updatedAt")
  @Schema(description = "수정 일시 (ISO 8601 형식)", example = "2025-07-29T15:30:00+09:00")
  private String updatedAt;

  @JsonProperty("message")
  @Schema(description = "수정 완료 메시지", example = "글이 성공적으로 수정되었습니다.")
  private String message;
}