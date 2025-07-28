package com.Stalk.project.auth.email.dao;

import com.Stalk.project.auth.email.entity.EmailVerification;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface EmailVerificationMapper {
    EmailVerification findByEmail(String email);
    void insert(EmailVerification ev);
    void updateCode(EmailVerification ev);
    void markVerified(String email);
}
