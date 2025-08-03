package com.Stalk.project.login.util;

import com.Stalk.project.login.service.MyUserDetails;
import com.Stalk.project.login.service.MyUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import io.jsonwebtoken.JwtException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
// OncePerRequestFilter 상속으로 매 요청마다 한 번 실행
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final MyUserDetailsService userDetailsService;  // 추가

    public JwtAuthenticationFilter(JwtUtil jwtUtil,
        MyUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    /**
     * /api/auth/** 경로의 요청은 이 필터를 아예 실행하지 않음
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
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
            // 헤더에서 Bearer 토큰 추출 → jwtUtil.validateToken()
            try {
                // 토큰 유효성 검사
                jwtUtil.validateToken(token);

                String userId = jwtUtil.getUserIdFromToken(token);
                // JwtAuthenticationFilter 에서 principal로 MyUserDetails 넣기
                MyUserDetails userDetails = (MyUserDetails) userDetailsService.loadUserByUsername(userId);


                // Spring Security context 에 인증 정보 세팅
                // 유효하면 사용자 ID·역할 가져와 UsernamePasswordAuthenticationToken 생성
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                    );
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }catch (JwtException | IllegalArgumentException ex) {
                // 1) 로그 기록
                logger.error("Invalid JWT: {}", ex);
                // 2) 컨텍스트 클리어
                SecurityContextHolder.clearContext();
                // 3) 401 응답
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED,
                    "토큰이 유효하지 않거나 만료되었습니다.");
                return;
            }
        }

        // 다음 필터/컨트롤러로 진행
        filterChain.doFilter(request, response);
    }
}
