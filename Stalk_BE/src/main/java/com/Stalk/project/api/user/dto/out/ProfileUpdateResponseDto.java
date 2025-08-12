package com.Stalk.project.api.user.dto.out;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Schema(description = "프로필 수정 응답 DTO")
public class ProfileUpdateResponseDto {

  @Schema(description = "수정된 닉네임", example = "새로운닉네임")
  private String nickname;

  @Schema(description = "수정된 프로필 이미지 URL", example = "/uploads/new_profile.jpg")
  private String imageUrl;
}
