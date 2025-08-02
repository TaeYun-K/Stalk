package com.Stalk.project.auth.email.dto.in;

import lombok.Data;

@Data
public class VerifyEmailRequest {
    private String email;
    private String code;
}
