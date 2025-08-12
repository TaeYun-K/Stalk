package com.Stalk.project.api.auth.email.dto.in;

import lombok.Data;

@Data
public class VerifyEmailRequest {
    private String email;
    private String code;
}
