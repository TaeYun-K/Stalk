package com.Stalk.project.api.login.dao;

import com.Stalk.project.api.signup.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserLoginMapper {
    User findByActiveUserId(String userId);

    void update(@Param("id") Long id, @Param("lastLoginAt") java.time.LocalDateTime lastLoginAt);
}
