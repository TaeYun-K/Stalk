package com.Stalk.project.api.auth.email.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EmailVerification {
    private Long id;
    private String email;
    private String code;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private Boolean verified;
}
