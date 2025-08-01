package com.Stalk.project.login.util;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    /**
     * /api/auth/** 경로의 요청은 이 필터를 아예 실행하지 않음
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        // 로그인, 리프레시, 회원가입 등 Auth 관련 엔드포인트 전체 스킵
        return request.getRequestURI().startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain)
        throws ServletException, IOException {

        // Authorization 헤더가 있을 때만 JWT 검사
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                String userId = jwtUtil.getUserIdFromToken(token);
                String role   = jwtUtil.getRoleFromToken(token);

                // Spring Security context 에 인증 정보 세팅
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        Collections.singletonList(
                            new SimpleGrantedAuthority("ROLE_" + role)
                        )
                    );
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        // 다음 필터/컨트롤러로 진행
        filterChain.doFilter(request, response);
    }
}
