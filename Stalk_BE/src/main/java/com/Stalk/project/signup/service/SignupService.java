package com.Stalk.project.signup.service;

import com.Stalk.project.signup.dao.UserMapper;
import com.Stalk.project.signup.dto.in.SignupRequest;
import com.Stalk.project.signup.dto.out.SignupResponse;
import com.Stalk.project.signup.entity.User;
import com.Stalk.project.auth.email.dao.EmailVerificationMapper;
import com.Stalk.project.auth.email.entity.EmailVerification;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SignupService {

    private final UserMapper userMapper;
    private final EmailVerificationMapper emailVerificationMapper;
    private final PasswordEncoder passwordEncoder;

    public SignupResponse register(SignupRequest req) {
        // 중복 검사
        if (userMapper.findByUserId(req.getUserId()) != null) {
            return new SignupResponse(false, null, "이미 사용 중인 userId입니다.");
        }

        if (userMapper.findByNickname(req.getNickname()) != null) {
            return new SignupResponse(false, null, "이미 사용 중인 닉네임입니다.");
        }

        // 비밀번호 확인
        if (!req.getPassword().equals(req.getPasswordConfirm())) {
            return new SignupResponse(false, null, "비밀번호가 일치하지 않습니다.");
        }
        // 이메일 인증 확인
        EmailVerification ev = emailVerificationMapper.findByEmail(req.getEmail());
        if (ev == null || !Boolean.TRUE.equals(ev.getVerified())) {
            return new SignupResponse(false, null, "이메일 인증이 완료되지 않았습니다.");
        }

        // 약관 동의
        if (!Boolean.TRUE.equals(req.getAgreedTerms()) || !Boolean.TRUE.equals(req.getAgreedPrivacy())) {
            return new SignupResponse(false, null, "약관 및 개인정보 수집에 동의해야 합니다.");
        }

        // 유저 생성
        User user = new User();
        user.setName(req.getName());
        user.setUserId(req.getUserId());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setContact(req.getContact());
        user.setNickname(req.getNickname());
        user.setLoginType("LOCAL");
        user.setRole("USER");
        user.setImage("/images/default_profile.png");
        user.setIsVerified(true);
        user.setTermsAgreed(req.getAgreedPrivacy());
        user.setIsActive(true);

        userMapper.insertUser(user);

        return new SignupResponse(true, user.getId(), null);
    }
}
