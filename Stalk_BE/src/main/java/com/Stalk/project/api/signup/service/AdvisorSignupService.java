package com.Stalk.project.api.signup.service;

import com.Stalk.project.api.auth.email.dao.EmailVerificationMapper;
import com.Stalk.project.api.auth.email.entity.EmailVerification;
import com.Stalk.project.api.signup.dao.UserMapper;
import com.Stalk.project.api.signup.dao.AdvisorSignupMapper;
import com.Stalk.project.api.signup.dto.in.AdvisorSignupRequest;
import com.Stalk.project.api.signup.dto.out.AdvisorSignupResponse;
import com.Stalk.project.api.signup.entity.User;
import com.Stalk.project.api.signup.entity.Advisor;
import com.Stalk.project.global.util.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdvisorSignupService {

  private final UserMapper userMapper;
  private final AdvisorSignupMapper advisorSignupMapper;
  private final EmailVerificationMapper emailVerificationMapper;
  private final PasswordEncoder passwordEncoder;
  private final FileStorageService fileStorageService;

  @Transactional
  public AdvisorSignupResponse signup(AdvisorSignupRequest req) {
    // 아이디·닉네임 중복 검사
    if (userMapper.findByUserId(req.getUserId()) != null) {
      throw new IllegalArgumentException("이미 존재하는 사용자 ID입니다.");
    }
    if (userMapper.findByNickname(req.getNickname()) != null) {
      throw new IllegalArgumentException("이미 존재하는 닉네임입니다.");
    }
    // 비밀번호 일치 확인
    if (!req.getPassword().equals(req.getPasswordConfirm())) {
      throw new IllegalArgumentException("비밀번호와 확인이 일치하지 않습니다.");
    }
    // 이메일 인증 확인
    EmailVerification ev = emailVerificationMapper.findByEmail(req.getEmail());
    if (ev == null || !Boolean.TRUE.equals(ev.getVerified())) {
      throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");
    }
    // 약관 동의
    if (!Boolean.TRUE.equals(req.getAgreedTerms()) || !Boolean.TRUE.equals(
        req.getAgreedPrivacy())) {
      throw new IllegalArgumentException("약관 및 개인정보 수집에 동의해야 합니다.");
    }

    // 프로필 이미지 저장
    String imageUrl = fileStorageService.store(req.getProfileImage());

    // users 테이블에 회원 정보 삽입
    User user = User.builder()
        .userId(req.getUserId())
        .name(req.getName())
        .nickname(req.getNickname())
        .password(passwordEncoder.encode(req.getPassword()))
        .contact(req.getContact())
        .email(req.getEmail())
        .loginType("LOCAL")
        .role("ADVISOR")
        .image(imageUrl)
        .isVerified(false)
        .termsAgreed(req.getAgreedPrivacy())
        .isActive(true)
        .build();
    userMapper.insertUser(user);

    // 6) advisor 테이블에 전문가 정보 삽입
    Advisor advisor = Advisor.builder()
        .advisorId(user.getId())
        .profileImageUrl(imageUrl)
        .certificateName(req.getCertificateName())
        .certificateFileSn(req.getCertificateFileSn())
        .birth(req.getBirth())
        .certificateFileNumber(req.getCertificateFileNumber())
        .consultationFee(30000)
        .publicContact(null)
        .isApproved(false)
        .approvedAt(null)
        .isProfileCompleted(false)
        .build();
    advisorSignupMapper.insertAdvisor(advisor);

    // 7) 응답 반환
    return AdvisorSignupResponse.builder()
        .userId(user.getId())
        .message("전문가 회원가입이 완료되었습니다.")
        // --- User 정보 ---
        .name(user.getName())
        .email(user.getEmail())
        .contact(user.getContact())
        .nickname(user.getNickname())
        // --- Advisor 정보 ---
        .certificateName(advisor.getCertificateName())
        .certificateFileSn(advisor.getCertificateFileSn())
        .birth(advisor.getBirth())
        .certificateFileNumber(advisor.getCertificateFileNumber())
        .build();
  }
}
