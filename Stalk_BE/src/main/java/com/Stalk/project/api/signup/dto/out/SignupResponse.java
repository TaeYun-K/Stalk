package com.Stalk.project.api.signup.dto.out;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SignupResponse {
    private boolean success;
    private Long userId;        // 회원가입 성공 시에만 사용
    private String message;     // 실패 시 원인
}
