package com.Stalk.project.config;

import com.Stalk.project.login.util.JwtAuthenticationFilter;
import com.Stalk.project.login.util.JwtUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
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
        // CORS 설정 적용
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        // CSRF 비활성화 (JWT 사용 시 세션이 없으므로)
        .csrf(csrf -> csrf.disable())
        // 세션 관리: Stateless로 설정
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        // 요청 권한 설정
        .authorizeHttpRequests(authz -> authz
            // Swagger UI 와 API docs 허용
            .requestMatchers(
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html",
                "/webjars/**"           // Swagger의 JS/CSS 리소스
            ).permitAll()
            // 인증 없이 열어둘 애플리케이션 엔드포인트
            .requestMatchers("/api/auth/**").permitAll()
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
    config.setAllowedOriginPatterns(Arrays.asList("*")); // 모든 출처 허용
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(Arrays.asList("*")); // 모든 요청 헤더 허용
    config.setAllowCredentials(true); // 쿠키/인증 정보 허용

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config); // 모든 경로에 적용
    return source;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  // AuthenticationManager 빈 추가 (로그인 인증 처리용)
  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
    return authenticationConfiguration.getAuthenticationManager();
  }
}