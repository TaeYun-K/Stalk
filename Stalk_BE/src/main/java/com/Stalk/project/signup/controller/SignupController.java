package com.Stalk.project.signup.controller;

import com.Stalk.project.signup.dto.in.SignupRequest;
import com.Stalk.project.signup.dto.out.SignupResponse;
import com.Stalk.project.signup.service.SignupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth/signup")
public class SignupController {

    private final SignupService signupService;

    @PostMapping
    public ResponseEntity<SignupResponse> signup(@RequestBody SignupRequest request) {
        SignupResponse response = signupService.register(request);
        return ResponseEntity.ok(response);
    }
}
