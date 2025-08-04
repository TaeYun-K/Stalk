package com.Stalk.project.auth.mock.dto.in;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDto {

  @NotBlank(message = "사용자 ID는 필수입니다.")
  private String userId;

  @NotBlank(message = "비밀번호는 필수입니다.")
  private String password;
}
