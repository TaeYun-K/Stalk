package com.Stalk.project.api.user.dto.in;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class ProfileUpdateRequestDto {

  @Schema(description = "새로운 닉네임", example = "새로운스토크")
  @NotBlank(message = "닉네임은 필수 입력 항목입니다.")
  @Size(min = 2, max = 10, message = "닉네임은 2자 이상 10자 이하로 입력해주세요.")
  private String nickname;

  @Schema(description = "새로운 프로필 이미지 파일")
  private MultipartFile profileImage;
}