package com.Stalk.project.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // 1) CORS 허용 설정 적용
        .cors(Customizer.withDefaults())
        // 2) CSRF 비활성화
        .csrf(csrf -> csrf.disable())
        // 3) 모든 요청 허용 (추후 권한 설정 추가 가능)
        .authorizeHttpRequests(authz -> authz
            .anyRequest().permitAll()
        );

    return http.build();
  }

  // CORS 정책 정의: 모든 출처, 모든 헤더, 주요 메서드 허용
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(Arrays.asList("*"));            // 모든 출처 허용
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(Arrays.asList("*"));            // 모든 요청 헤더 허용
    config.setAllowCredentials(true);                        // 쿠키/인증 정보 허용 시 true
    // 필요에 따라 setExposedHeaders(), setMaxAge() 등 추가 설정 가능

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);         // 모든 경로에 이 정책 적용
    return source;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
