package com.Stalk.project.api.auth.duplicatecheck.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import com.Stalk.project.api.auth.duplicatecheck.service.DuplicateCheckService;

@RestController
@RequestMapping("/api/auth")
public class DuplicateCheckController {

    private final DuplicateCheckService service;

    public DuplicateCheckController(DuplicateCheckService service) {
        this.service = service;
    }

    /**
     * 중복 확인 API
     * GET /api/auth/duplicate-check?type={id|nickname}&value={값}
     * @param type  검사 대상("id" 또는 "nickname")
     * @param value 검사할 문자열
     * @return JSON { "success": true, "duplicated": boolean }
     */
    @GetMapping("/duplicate-check")
    public ResponseEntity<Map<String, Object>> check(
            @RequestParam("id|nickname") String type,
            @RequestParam("value") String value) {

        boolean duplicated = service.isDuplicated(type, value);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "duplicated", duplicated
        ));
    }
}
