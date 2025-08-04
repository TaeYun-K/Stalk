package com.Stalk.project.signup.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private String name;
    private String userId;
    private String email;
    private String password;
    private String contact;
    private String nickname;
    private String loginType;
    private String role;
    private String image;
    private Boolean isVerified;
    private Boolean termsAgreed;
    private Boolean isActive;
    private LocalDateTime deletedAt;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
