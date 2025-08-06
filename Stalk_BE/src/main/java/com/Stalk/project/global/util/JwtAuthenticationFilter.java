package com.Stalk.project.global.util;

import com.Stalk.project.api.login.service.MyUserDetails;
import com.Stalk.project.api.login.service.MyUserDetailsService;
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

/*
 * 이 클래스를 Spring Bean으로 등록
 * 이렇게 등록된 Bean은 SecurityConfig에서 의존성 주입(DI)을 통해 가져다 쓸 수 있움
 */
@Component
/*
 * JwtAuthenticationFilter는 SecurityConfig에 의해 설정된 보안 시스템의 "문지기" 역할
 * 인증이 필요한 모든 API 요청은 이 문지기를 통과해야만 컨트롤러에 도달 가능
 * 문지기는 들어오는 모든 사람(요청)에게 "신분증(JWT)"을 요구
 * 신분증이 유효한지 확인한 뒤 "출입증(Authentication 객체)"을 발급하여 들여보내는 것과 같음
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  /*
   * JWT의 생성, 파싱, 유효성 검증 등 JWT와 관련된 모든 로직을 처리하는 유틸리티 클래스 (관심사의 분리)
   * Concern(관심사): 프로그램에서 하나의 목적이나 역할을 담당하는 코드 단위를 의미합니다.
   * 예: 인증, 데이터베이스 접근, 로깅, UI 렌더링, 에러 처리 등
   * 관심사의 분리란? 각 역할(관심사)을 하나의 클래스 또는 모듈에만 책임지도록 분리하는 것.
   */
  private final JwtUtil jwtUtil;

  // 사용자 ID를 기반으로 데이터베이스에서 실제 사용자 상세 정보(UserDetails)를 조회하는 서비스
  private final MyUserDetailsService userDetailsService;  // 추가

  public JwtAuthenticationFilter(JwtUtil jwtUtil,
      MyUserDetailsService userDetailsService) {
    this.jwtUtil = jwtUtil;
    this.userDetailsService = userDetailsService;
  }

  /*
   * shouldNotFilter vs .permitAll()
   * 핵심 차이점: '인증(Authentication)' vs '인가(Authorization)'
   */

  /*
   * shouldNotFilter: 공항의 '보안 검색대'와 같음.
   * 이 검색대는 모든 승객의 소지품(JWT 토큰)을 검사하는 것이 기본 임무.
   * shouldNotFilter는 "공항 직원 출입구"와 같아서,
   * 특정 사람들( /api/auth/** 요청)은 이 보안 검색대를 아예 거치지 않고 통과시키는 역할.
   * 즉, 검사 자체를 생략.
   */

  /*
   * .permitAll(): 최종 목적지로 가는 '탑승구'.
   * 이 탑승구 직원은 보안 검색을 통과했든(인증됨),
   * 직원 출입구로 들어왔든(인증 안됨) 상관없이, "이 탑승구는 누구나 들어올 수 있습니다"라고 허가해주는 규칙.
   * 즉, 최종 입장을 허가하는 것입니다.
   */

  /* shouldNotFilter
   * /api/auth/** 경로의 요청은 이 필터를 아예 실행하지 않음
   * true를 반환하면 doFilterInternal 메소드가 실행되지 않고 바로 다음 필터로 넘어감
   */
  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    /*
     * 로그인, 리프레시, 회원가입 등 Auth 관련 엔드포인트 전체 스킵
     * 로그인이나 회원가입 같은 기능은 아직 JWT 토큰이 발급되지 않은 상태에서 호출되므로, 토큰을 검증하는 이 필터가 동작할 필요 x
     */
    return request.getRequestURI().startsWith("/api/auth/");
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain)
      throws ServletException, IOException {

    // Authorization 헤더가 있을 때만 JWT 검사, HTTP 요청 헤더에서 Authorization 값 가져옴
    String authHeader = request.getHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      // 헤더에서 Bearer 토큰 추출 → jwtUtil.validateToken()
      String token = authHeader.substring(7);
      try {
        // 토큰 유효성 검사
        jwtUtil.validateToken(token);

        String userId = jwtUtil.getUserIdFromToken(token);
        /*
         * JwtAuthenticationFilter 에서 principal로 MyUserDetails 넣기
         * 추출한 userId로 DB에서 사용자 정보를 조회
         * 이는 토큰은 유효하지만 사용자가 탈퇴했거나 계정이 비활성화된 경우를 처리하기 위한 중요한 단계
         */
        MyUserDetails userDetails = (MyUserDetails) userDetailsService.loadUserByUsername(userId);

        // Spring Security context 에 인증 정보 세팅
        // 유효하면 사용자 ID·역할 가져와 UsernamePasswordAuthenticationToken 생성
        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(
                userDetails.getUsername(),
                null, // 자격 증명(비밀번호). 이미 토큰으로 인증했으므로 null
                // 사용자의 권한 목록 (ROLE_USER, ROLE_ADMIN 등). 이 정보는 나중에 @PreAuthorize 어노테이션 등에서 사용
                userDetails.getAuthorities()
            );
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        /*
         * 생성된 인증 객체를 SecurityContextHolder의 SecurityContext에 저장
         * 이 작업이 완료되면, 현재 요청을 처리하는 스레드 내에서 이 사용자는 인증된 것
         */
        SecurityContextHolder.getContext().setAuthentication(auth);
      } catch (JwtException | IllegalArgumentException ex) {
        // 로그 기록
        logger.error("Invalid JWT token", ex);
        // 컨텍스트 클리어
        SecurityContextHolder.clearContext();
        // 401 응답
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED,
            "토큰이 유효하지 않거나 만료되었습니다.");
        return;
      }
    }

    // 다음 필터/컨트롤러로 진행
    filterChain.doFilter(request, response);
  }
}
