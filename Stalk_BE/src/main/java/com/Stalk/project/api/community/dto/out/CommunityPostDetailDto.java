package com.Stalk.project.api.community.dto.out;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.Stalk.project.global.util.CursorPage;
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
@Schema(description = "커뮤니티 글 상세 정보")
public class CommunityPostDetailDto {

  @JsonProperty("postId")
  @Schema(description = "글 ID", example = "1")
  private Long postId;

  @JsonProperty("title")
  @Schema(description = "글 제목", example = "주식 투자 초보자 질문입니다")
  private String title;

  @JsonProperty("content")
  @Schema(description = "글 내용", example = "주식 투자를 시작하려고 하는데...")
  private String content;

  @JsonProperty("authorName")
  @Schema(description = "작성자명 (전문가: 실명, 일반사용자: 닉네임)", example = "투자초보자")
  private String authorName;

  @JsonProperty("authorRole")
  @Schema(description = "작성자 역할", example = "USER", allowableValues = {"USER", "ADVISOR"})
  private String authorRole;

  @JsonProperty("authorProfileImage")
  @Schema(description = "작성자 프로필 이미지", example = "/images/community/user1001.png")
  private String authorProfileImage;

  @JsonProperty("category")
  @Schema(description = "카테고리 (enum)", example = "QUESTION")
  private String category;

  @JsonProperty("categoryDisplayName")
  @Schema(description = "카테고리 한글명", example = "질문")
  private String categoryDisplayName;

  @JsonProperty("viewCount")
  @Schema(description = "조회수", example = "123")
  private Integer viewCount;

  @JsonProperty("commentCount")
  @Schema(description = "댓글 수", example = "5")
  private Integer commentCount;

  @JsonProperty("createdAt")
  @Schema(description = "글 작성일시 (ISO 8601 형식)", example = "2025-07-29T10:00:00+09:00")
  private String createdAt;

  @JsonProperty("comments")
  @Schema(description = "댓글 목록 (페이징 적용)")
  private CursorPage<CommunityCommentDto> comments;
}