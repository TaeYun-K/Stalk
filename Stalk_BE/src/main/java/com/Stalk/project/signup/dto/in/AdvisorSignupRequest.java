package com.Stalk.project.signup.dto.in;

import jakarta.validation.constraints.*;
import org.springframework.web.multipart.MultipartFile;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdvisorSignupRequest {
    
    @NotBlank @Size(max = 50)
    private String userId;                          // UI: 아이디

    @NotBlank @Size(max = 50)
    private String name;                            // UI: 이름

    @NotBlank @Size(max = 50)
    private String nickname;                        // UI: 닉네임

    @NotBlank @Size(min = 8, max = 100)
    private String password;                        // UI: 비밀번호

    @NotBlank @Size(min = 8, max = 100)
    private String passwordConfirm;                 // UI: 비밀번호 확인

    @Pattern(regexp = "\\d{9,20}")
    private String contact;                         // UI: 연락처

    @NotBlank @Email
    private String email;                           // UI: 이메일

    @NotNull
    private Boolean termsAgreed;                    // UI: 약관 동의 여부

    @NotNull
    private MultipartFile profileImage;             // UI: 프로필 사진 등록

    @NotBlank @Size(max = 100)
    private String certificateName;                 // UI: 전문 자격명

    @NotBlank @Size(min = 8, max = 8)
    private String certificateFileSn;               // UI: 합격증 번호(8)

    @Pattern(regexp = "\\d{8}")
    private String birth;                           // UI: 생년월일(8)

    @NotBlank @Size(min = 6, max = 6)
    private String certificateFileNumber;           // UI: 발급번호(6)
}
