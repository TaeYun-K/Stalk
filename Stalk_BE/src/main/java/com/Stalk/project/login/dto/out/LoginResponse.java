// LoginResponse.java (DTO)
package com.Stalk.project.login.dto.out;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
}