package com.Stalk.project.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MockUserProfile {
    private Long userId;
    private String name;
    private String contact;
    private String email;
    private String profileImage;
    private String role;
}
