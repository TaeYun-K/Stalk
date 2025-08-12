package com.Stalk.project.api.auth.email.service;

import com.Stalk.project.api.auth.email.dao.EmailVerificationMapper;
import com.Stalk.project.api.auth.email.entity.EmailVerification;
import com.Stalk.project.api.signup.dao.UserMapper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailVerificationMapper emailVerificationMapper;
    private final UserMapper userMapper;

    @Value("${spring.mail.username}")
    private String from;

    /**
     * 인증 코드 생성 및 이메일 전송
     */
    public void sendVerificationCode(String email) {
        String code = generateCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);

        EmailVerification existing = emailVerificationMapper.findByEmail(email);

        if (existing == null) {
            EmailVerification ev = new EmailVerification();
            ev.setEmail(email);
            ev.setCode(code);
            ev.setExpiresAt(expiresAt);
            ev.setVerified(false);
            emailVerificationMapper.insert(ev);
        } else {
            existing.setCode(code);
            existing.setExpiresAt(expiresAt);
            existing.setVerified(false);
            emailVerificationMapper.updateCode(existing);
        }

        sendEmail(email, code);
    }

    /**
     * 인증 코드 검증
     */
    public boolean verifyCode(String email, String code) {
        EmailVerification ev = emailVerificationMapper.findByEmail(email);

        if (ev == null) {
            throw new IllegalArgumentException("해당 이메일의 인증 정보가 없습니다.");
        }

        if (ev.getVerified() != null && ev.getVerified()) {
            return true;
        }

        if (ev.getExpiresAt() == null || ev.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("인증 코드가 만료되었거나 유효하지 않습니다.");
        }

        if (!ev.getCode().equals(code)) {
            throw new IllegalArgumentException("인증 코드가 일치하지 않습니다.");
        }

        emailVerificationMapper.markVerified(email);
        userMapper.markUserVerified(email);
        return true;
    }

    /**
     * 이메일 전송
     */
    private void sendEmail(String to, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(to);
            helper.setSubject("[STALK] 이메일 인증 코드입니다");
            helper.setFrom(from);
            helper.setText("인증 코드: " + code + "\n10분 안에 입력해주세요.");
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("이메일 발송 실패", e);
        }
    }

    /**
     * 인증 코드 생성
     */
    private String generateCode() {
        Random r = new Random();
        return String.format("%06d", r.nextInt(1000000));
    }
}
