package com.Stalk.project.api.user.dto.in;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
@Schema(description = "프로필 수정 요청 DTO (닉네임, 프로필 이미지)")
public class ProfileUpdateRequestDto {

  @Schema(description = "새로운 닉네임 (2~10자)", example = "새로운닉네임")
  @Size(min = 2, max = 10, message = "닉네임은 2자 이상 10자 이하로 입력해주세요.")
  private String nickname;

  @Schema(description = "새로운 프로필 이미지 파일")
  private MultipartFile profileImage;
}
