package com.Stalk.project.api.login.service;

import com.Stalk.project.api.login.dao.UserLoginMapper;
import com.Stalk.project.api.signup.entity.User;
import lombok.RequiredArgsConstructor;
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
    return new MyUserDetails(user);
  }

}