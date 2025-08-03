package com.Stalk.project.config;

import com.Stalk.project.login.util.JwtAuthenticationFilter;
import com.Stalk.project.login.util.JwtUtil;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  private final JwtUtil jwtUtil;
  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  public SecurityConfig(JwtUtil jwtUtil, JwtAuthenticationFilter jwtAuthenticationFilter) {
    this.jwtUtil = jwtUtil;
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        /*
         * CORS 설정 적용 (Cross-Origin Resource Sharing)
         * 왜 해야할까?
         * 기본적으로 브라우저는 출처가 다른 요청을 차단하기 때문에, SPA(리액트·뷰 등)에서 API를 호출하려면 명시적으로 허용 도메인, 허용 메서드, 허용 헤더 등을 설정
         */
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        /*
         * CSRF 비활성화 (Cross-Site Request Forgery)
         * (JWT 사용 시 세션이 없으므로)
         * 왜 해야할까?
         * JWT 기반 인증은 세션 쿠키 대신 Authorization 헤더의 토큰을 이용하기 때문에, 브라우저가 자동으로 포함시키는 쿠키에 의존하지 않고 CSRF 취약점 대상에서 벗어날 수 있음
         */
        .csrf(AbstractHttpConfigurer::disable)
        /*
         * 세션 관리: Stateless로 설정
         * 스프링 시큐리티가 HTTP 세션을 생성·조회하지 않고, 모든 요청마다 반드시 인증 토큰을 검사하도록 강제
         * 왜 Stateless 인가?
         * JWT를 사용하면 서버에 사용자 상태(session)를 저장할 필요 x -> csrf의 비활성화 이유이기도 함
         * 확장성(스케일 아웃)과 성능 측면에서, 서버 간 세션 동기화와 같은 오버헤드를 제거
         */
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        // 엔드포인트 권한 설정
        .authorizeHttpRequests(authz -> authz
            // Swagger UI 와 API docs 허용
            .requestMatchers(
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html",
                "/webjars/**"           // Swagger의 JS/CSS 리소스
            ).permitAll()
            // 인증 없이 열어둘 애플리케이션 엔드포인트 -> 추후 /api/auth/** 예정
            .requestMatchers("/api/**").permitAll()
            // 그 외 모든 요청은 인증 필요
            .anyRequest().authenticated())
        // JWT 필터를 UsernamePasswordAuthenticationFilter 전에 추가
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  // CORS 정책 정의: 모든 출처, 모든 헤더, 주요 메서드 허용
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(List.of("*")); // 모든 출처 허용
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*")); // 모든 요청 헤더 허용
    config.setAllowCredentials(true); // 쿠키/인증 정보 허용

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config); // 모든 경로에 적용
    return source;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  /*
   * AuthenticationManager 빈 추가 (로그인 인증 처리용)
   * 사용자 자격 증명(아이디·비밀번호 등)을 실제로 검증하는 핵심 인터페이스
   * spring boot가 자동으로 설정해 놓은 AuthenticationProvider들을 모아서 AuthenticationManager 인스턴스를 반환
   */
  @Bean
  public AuthenticationManager authenticationManager(
      AuthenticationConfiguration authenticationConfiguration) throws Exception {
    return authenticationConfiguration.getAuthenticationManager();
  }
}