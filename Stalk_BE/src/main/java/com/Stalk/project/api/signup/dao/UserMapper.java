package com.Stalk.project.api.signup.dao;

import com.Stalk.project.api.signup.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper {
    User findByUserId(String userId);
    User findByNickname(String nickname);
    void insertUser(User user);
    void markUserVerified(String email);
}
