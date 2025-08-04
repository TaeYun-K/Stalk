package com.Stalk.project.auth.duplicatecheck.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface DuplicateCheckMapper {

    /**
     * user_id로 조회된 레코드 수 반환
     * @param value 확인할 사용자 ID 문자열
     * @return 동일한 ID 개수
     */
    int countByUserId(@Param("value") String value);

    /**
     * nickname으로 조회된 레코드 수 반환
     * @param value 확인할 닉네임 문자열
     * @return 동일한 닉네임 개수
     */
    int countByNickname(@Param("value") String value);
}
