package com.Stalk.project.api.community.dto.out;

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
@Schema(description = "커뮤니티 댓글 정보")
public class CommunityCommentDto {

  @JsonProperty("commentId")
  @Schema(description = "댓글 ID", example = "1")
  private Long commentId;

  @JsonProperty("content")
  @Schema(description = "댓글 내용", example = "도움이 되는 정보네요. 감사합니다!")
  private String content;

  @JsonProperty("authorName")
  @Schema(description = "댓글 작성자명 (전문가: 실명, 일반사용자: 닉네임)", example = "투자초보자")
  private String authorName;

  @JsonProperty("authorRole")
  @Schema(description = "댓글 작성자 역할", example = "USER", allowableValues = {"USER", "ADVISOR"})
  private String authorRole;

  @JsonProperty("authorProfileImage")
  @Schema(description = "댓글 작성자 프로필 이미지", example = "/images/community/user1001.png")
  private String authorProfileImage;

  @JsonProperty("createdAt")
  @Schema(description = "댓글 작성일시 (ISO 8601 형식)", example = "2025-07-29T10:30:00+09:00")
  private String createdAt;
}