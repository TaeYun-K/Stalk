package com.Stalk.project.api.user.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Schema(description = "프로필 수정 응답 DTO")
public class ProfileUpdateResponseDto {

  @Schema(description = "사용자 ID")
  private Long userId;

  @Schema(description = "수정된 닉네임")
  private String nickname;

  @Schema(description = "수정된 프로필 이미지 경로")
  private String imageUrl;
}
