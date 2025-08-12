package com.Stalk.project.api.user.dto.in;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

// 예시 DTO
public record PasswordChangeRequestDto(
    @NotBlank(message = "현재 비밀번호를 입력해주세요.")
    String currentPassword,

    @NotBlank(message = "새 비밀번호를 입력해주세요.")
    @Pattern(
        regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,20}$",
        message = "비밀번호는 8~20자이며, 숫자·대문자·소문자·특수문자를 모두 포함해야 합니다."
    )
    String newPassword
) {

}