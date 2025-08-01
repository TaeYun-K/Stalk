package com.Stalk.project.signup.dao;

import com.Stalk.project.signup.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper {
    User findByUserId(String userId);
    User findByNickname(String nickname);
    void insertUser(User user);
    void markUserVerified(String email);
}
