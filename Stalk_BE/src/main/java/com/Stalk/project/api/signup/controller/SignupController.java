package com.Stalk.project.api.signup.controller;

import com.Stalk.project.api.signup.dto.in.SignupRequest;
import com.Stalk.project.api.signup.dto.out.SignupResponse;
import com.Stalk.project.api.signup.service.SignupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/signup")
@RequiredArgsConstructor
@Validated  // 클래스 레벨에서도 검증 활성화
public class SignupController {

    private final SignupService signupService;

    @PostMapping
    public ResponseEntity<SignupResponse> signup(
        @Validated @RequestBody SignupRequest request          // <-- @Valid 추가
    ) {
        SignupResponse response = signupService.register(request);
        return ResponseEntity.ok(response);
    }
}
