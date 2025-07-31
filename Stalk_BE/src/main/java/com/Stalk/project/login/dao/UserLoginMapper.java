package com.Stalk.project.login.dao;

import com.Stalk.project.signup.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface UserLoginMapper {
    @Select("SELECT * FROM users WHERE user_id = #{userId} AND is_active = 1")
    User findByUserId(String userId);

    @Update("UPDATE users SET last_login_at = #{lastLoginAt}, updated_at = CURRENT_TIMESTAMP WHERE id = #{id}")
    void update(User user);
}