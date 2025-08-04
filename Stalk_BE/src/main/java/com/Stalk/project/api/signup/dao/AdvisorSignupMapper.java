package com.Stalk.project.api.signup.dao;

import com.Stalk.project.api.signup.entity.Advisor;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AdvisorSignupMapper {
    void insertAdvisor(Advisor advisor);
}
