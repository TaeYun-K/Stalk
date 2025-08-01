package com.Stalk.project.community.dto.in;

import com.Stalk.project.util.PageRequestDto;
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
@Schema(description = "커뮤니티 글 상세 조회 요청 DTO")
public class CommunityPostDetailRequestDto extends PageRequestDto {

  @Schema(description = "댓글 페이지 번호", defaultValue = "1", example = "1")
  private int commentPageNo = 1;

  @Schema(description = "댓글 페이지 크기", defaultValue = "10", example = "10")
  private int commentPageSize = 10;

  // 댓글 페이징을 위한 offset 계산
  public int getCommentOffset() {
    return (commentPageNo - 1) * commentPageSize;
  }

  // hasNext 판단을 위한 limit + 1
  public int getCommentLimitPlusOne() {
    return commentPageSize + 1;
  }
}