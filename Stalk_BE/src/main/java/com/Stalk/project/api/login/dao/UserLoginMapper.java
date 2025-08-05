package com.Stalk.project.api.login.dao;

import com.Stalk.project.api.signup.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface UserLoginMapper {
    @Select("SELECT * FROM users WHERE user_id = #{userId} AND is_active = 1")
    User findByUserId(String userId);

    @Update("UPDATE users SET last_login_at = #{lastLoginAt}, updated_at = CURRENT_TIMESTAMP WHERE id = #{id}")
    void update(@Param("id") Long id, @Param("lastLoginAt") java.time.LocalDateTime lastLoginAt);
}
