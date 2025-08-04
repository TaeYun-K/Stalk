package com.Stalk.project.api.auth.duplicatecheck.service;

import org.springframework.stereotype.Service;
import com.Stalk.project.api.auth.duplicatecheck.dao.DuplicateCheckMapper;

@Service
public class DuplicateCheckService {

    private final DuplicateCheckMapper mapper;

    public DuplicateCheckService(DuplicateCheckMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * 중복 여부 판단
     * @param type  "id" 또는 "nickname"
     * @param value 검사할 문자열 값
     * @return true: 중복(사용 불가), false: 사용 가능
     */
    public boolean isDuplicated(String type, String value) {
        int count;
        switch (type) {
            case "id":
                count = mapper.countByUserId(value);
                break;
            case "nickname":
                count = mapper.countByNickname(value);
                break;
            default:
                throw new IllegalArgumentException("허용되지 않는 타입입니다: " + type);
        }
        return count > 0;
    }
}
