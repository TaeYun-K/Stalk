package com.Stalk.project.api.login.service;

import com.Stalk.project.api.login.dao.UserLoginMapper;
import com.Stalk.project.api.signup.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MyUserDetailsService implements UserDetailsService {

  private final UserLoginMapper userLoginMapper;

  @Override
  public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
    User user = userLoginMapper.findByActiveUserId(userId);
    if (user == null) {
      throw new UsernameNotFoundException("User not found: " + userId);
    }
    // 사용자가 비활성화(탈퇴) 상태인지 확인
    if (!user.getIsActive()) {
      // 비활성화된 계정일 경우, DisabledException 또는 커스텀 예외를 발생시켜 인증을 거부
      throw new DisabledException("비활성화된 계정입니다. ID: " + userId);
    }
    return new MyUserDetails(user);
  }

}