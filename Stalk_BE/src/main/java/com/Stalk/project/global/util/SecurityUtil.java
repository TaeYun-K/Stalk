package com.Stalk.project.global.util;

import com.Stalk.project.api.login.dao.UserLoginMapper;
import com.Stalk.project.api.signup.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Spring Security Context에서 현재 인증된 사용자 정보를 가져오는 유틸리티 클래스
 */
@Component
public class SecurityUtil {

    private static UserLoginMapper userLoginMapper;

    @Autowired
    public SecurityUtil(UserLoginMapper userLoginMapper) {
        SecurityUtil.userLoginMapper = userLoginMapper;
    }

    /**
     * 현재 인증 상태를 확인
     * @return true if authenticated, false if not
     */
    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null &&
            authentication.isAuthenticated() &&
            authentication.getPrincipal() != null &&
            !"anonymousUser".equals(authentication.getPrincipal());
    }

    /**
     * 현재 인증된 사용자의 user_id를 반환
     * @return users.user_id (String) or null if not authenticated
     */
    public static String getCurrentUserId() {
        if (!isAuthenticated()) {
            return null;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (String) authentication.getPrincipal();
    }

    /**
     * 현재 인증된 사용자의 user_id를 반환 (예외 발생)
     * @return users.user_id (String)
     * @throws RuntimeException if not authenticated
     */
    public static String getCurrentUserIdRequired() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("인증된 사용자가 없습니다.");
        }
        return (String) authentication.getPrincipal();
    }

    /**
     * 현재 인증된 사용자의 역할을 반환
     * @return "USER", "ADVISOR", "ADMIN" or null if not authenticated
     */
    public static String getCurrentUserRole() {
        if (!isAuthenticated()) {
            return null;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getAuthorities() == null) {
            return null;
        }

        // ROLE_USER -> USER, ROLE_ADVISOR -> ADVISOR로 변환
        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .filter(role -> role.startsWith("ROLE_"))
            .map(role -> role.substring(5)) // "ROLE_" 제거
            .findFirst()
            .orElse(null);
    }

    /**
     * 현재 인증된 사용자의 역할을 반환 (예외 발생)
     * @return "USER", "ADVISOR", "ADMIN"
     * @throws RuntimeException if not authenticated
     */
    public static String getCurrentUserRoleRequired() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities() == null) {
            throw new RuntimeException("인증된 사용자가 없습니다.");
        }

        // ROLE_USER -> USER, ROLE_ADVISOR -> ADVISOR로 변환
        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .filter(role -> role.startsWith("ROLE_"))
            .map(role -> role.substring(5)) // "ROLE_" 제거
            .findFirst()
            .orElseThrow(() -> new RuntimeException("사용자 역할을 찾을 수 없습니다."));
    }

    /**
     * 현재 사용자가 ADVISOR 역할인지 확인
     * @return true if ADVISOR, false if NOT or not authenticated
     */
    public static boolean isCurrentUserAdvisor() {
        return "ADVISOR".equals(getCurrentUserRole());
    }

    /**
     * 현재 사용자가 일반 사용자인지 확인
     * @return true if USER, false if NOT or not authenticated
     */
    public static boolean isCurrentUserRegularUser() {
        return "USER".equals(getCurrentUserRole());
    }

    /**
     * 현재 사용자가 관리자인지 확인
     * @return true if ADMIN, false if NOT or not authenticated
     */
    public static boolean isCurrentUserAdmin() {
        return "ADMIN".equals(getCurrentUserRole());
    }

    /**
     * 현재 인증된 사용자의 users.id (PK)를 반환
     * JWT에서 가져온 user_id로 실제 DB의 PK를 조회
     * @return users.id (Long) or null if not authenticated
     */
    public static Long getCurrentUserPrimaryId() {
        String userId = getCurrentUserId(); // JWT에서 가져온 user_id
        if (userId == null) {
            return null;
        }

        User user = userLoginMapper.findByUserId(userId);
        if (user == null) {
            return null;
        }
        return user.getId(); // users.id (PK) 반환
    }

    /**
     * 현재 인증된 사용자의 users.id (PK)를 반환 (예외 발생)
     * JWT에서 가져온 user_id로 실제 DB의 PK를 조회
     * @return users.id (Long)
     * @throws RuntimeException if not authenticated or user not found
     */
    public static Long getCurrentUserPrimaryIdRequired() {
        String userId = getCurrentUserIdRequired(); // JWT에서 가져온 user_id
        User user = userLoginMapper.findByUserId(userId);
        if (user == null) {
            throw new RuntimeException("사용자를 찾을 수 없습니다: " + userId);
        }
        return user.getId(); // users.id (PK) 반환
    }
}