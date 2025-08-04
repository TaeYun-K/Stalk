package com.Stalk.project.signup.dao;

import com.Stalk.project.signup.entity.Advisor;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AdvisorSignupMapper {
    void insertAdvisor(Advisor advisor);
}
