package com.Stalk.project.api.auth.email.controller;

import com.Stalk.project.api.auth.email.dto.in.SendEmailRequest;
import com.Stalk.project.api.auth.email.dto.in.VerifyEmailRequest;
import com.Stalk.project.api.auth.email.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth/email")
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<?> sendCode(@RequestBody SendEmailRequest request) {
        emailService.sendVerificationCode(request.getEmail());
        return ResponseEntity.ok().body("{\"success\": true}");
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyEmailRequest request) {
        boolean result = emailService.verifyCode(request.getEmail(), request.getCode());
        if (result) {
            return ResponseEntity.ok().body("{\"success\": true}");
        } else {
            return ResponseEntity.badRequest().body("{\"success\": false, \"message\": \"인증 실패 또는 만료됨\"}");
        }
    }
}
