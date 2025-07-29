package com.Stalk.project.signup.dto.in;

import lombok.Data;

@Data
public class SignupRequest {
    private String name;
    private String userId;
    private String nickname;
    private String password;
    private String passwordConfirm;
    private String contact;
    private String email;
    private Boolean agreedTerms;
    private Boolean agreedPrivacy;
}
