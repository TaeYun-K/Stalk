package com.Stalk.project.signup.dto.in;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

@Data
public class AdvisorSignupRequest {

    @NotBlank(message = "아이디는 필수 입력 값입니다.")
    private String userId;

    @NotBlank(message = "이름은 필수 입력 값입니다.")
    private String name;

    @NotBlank(message = "닉네임은 필수 입력 값입니다.")
    private String nickname;

    @NotBlank(message = "비밀번호는 필수 입력 값입니다.")
    @Pattern(
        regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,20}$",
        message = "비밀번호는 8~20자이며, 숫자·대문자·소문자·특수문자를 모두 포함해야 합니다."
    )
    private String password;

    @NotBlank(message = "비밀번호 확인은 필수 입력 값입니다.")
    private String passwordConfirm;

    @NotBlank(message = "연락처는 필수 입력 값입니다.")
    @Pattern(
        regexp = "^\\d{9,11}$",
        message = "연락처는 숫자 9~11자리여야 합니다."
    )
    private String contact;

    @NotBlank(message = "이메일은 필수 입력 값입니다.")
    @Email(message = "유효한 이메일 주소를 입력하세요.")
    private String email;

    @NotBlank(message = "자격증 명칭은 필수 입력 값입니다.")
    private String certificateName;

    @NotBlank(message = "합격증 번호(8자리)는 필수 입력 값입니다.")
    @Size(min = 8, max = 8, message = "합격증 번호는 정확히 8자리여야 합니다.")
    private String certificateFileSn;

    @NotBlank(message = "생년월일(8자리)은 필수 입력 값입니다.")
    @Size(min = 8, max = 8, message = "생년월일은 YYYYMMDD 형식의 8자리여야 합니다.")
    private String birth;

    @NotBlank(message = "발급번호(6자리)는 필수 입력 값입니다.")
    @Size(min = 6, max = 6, message = "발급번호는 정확히 6자리여야 합니다.")
    private String certificateFileNumber;

    // 프로필 이미지를 필수로 받을 경우
    @NotNull(message = "프로필 이미지를 업로드해야 합니다.")
    private MultipartFile profileImage;

    @AssertTrue(message = "약관에 동의해야 합니다.")
    private Boolean agreedTerms;

    @AssertTrue(message = "개인정보 수집에 동의해야 합니다.")
    private Boolean agreedPrivacy;
}
