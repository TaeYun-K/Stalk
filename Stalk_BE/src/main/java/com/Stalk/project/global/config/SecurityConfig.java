package com.Stalk.project.global.config;

import com.Stalk.project.api.login.service.MyUserDetailsService;
import com.Stalk.project.global.util.JwtAuthenticationFilter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
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

/*
 * 해당 클래스가 Spring의 설정 파일임을 나타냄
 * Spring 컨테이너는 이 클래스를 스캔하여 @Bean으로 정의된 객체들을 생성하고 관리
 */
@Configuration
/*
 * Spring Security의 웹 보안 기능을 활성화
 * 해당 어노테이션을 추가하면 기본적인 보안 필터 체인이 자동으로 등록
 */
@EnableWebSecurity
/*
 * PreAuthorize, @PostAuthorize 등 메소드 수준에서 보안을 적용할 수 있는 기능을 활성화
 */
@EnableMethodSecurity
/*
 * final 키워드가 붙은 필드들을 인자로 받는 생성자를 자동으로 생성해주는 Lombok 어노테이션
 * 의존성 주입(DI) 간편하게 처리
 */
@RequiredArgsConstructor
public class SecurityConfig {

  private final MyUserDetailsService userDetailsService;
  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final JwtAuthenticationEntryPoint jwtEntryPoint;
  private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

  /**
   * DAO 기반 인증 Provider - UserDetailsService + PasswordEncoder 데이터베이스 접근을 통해 인증을 처리하는 제공자
   */
  @Bean
  public DaoAuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService); // 사용자 정보를 가져올 때 
    provider.setPasswordEncoder(passwordEncoder()); // 비밀번호 비교할때 BCryptPasswordEncoder 사용하도록 설정
    return provider;
  }

  /*
   * AuthenticationManager 빈 추가 (로그인 인증 처리용) 사용자 자격 증명(아이디·비밀번호 등)을 실제로 검증하는 핵심 인터페이스
   * 로그인 요청(authenticate 메소드 호출)이 오면,
   * 등록된 authenticationProvider (여기서는 DaoAuthenticationProvider)에게 인증 처리를 위임
   *
   *
   * spring boot가 자동으로 설정해 놓은 AuthenticationProvider들을 모아서 AuthenticationManager 인스턴스를 반환
   * AuthenticationManager의 역할
   * 내부적으로 DaoAuthenticationProvider → UserDetailsService + PasswordEncoder 조합으로 구성
   * authenticate(new UsernamePasswordAuthenticationToken(id, pwd)) 호출 시,
   * AuthService가 DB에서 사용자(UserDetails)를 로드
   * PasswordEncoder.matches(rawPassword, encodedPasswordFromUserDetails) 비밀번호 검증
   * -> 성공하면 Authentication 객체를 반환, 실패하면 BadCredentialsException 발생
   */
  @Bean
  public AuthenticationManager authenticationManager(
      AuthenticationConfiguration authenticationConfiguration) throws Exception {
    return authenticationConfiguration.getAuthenticationManager();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
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
         * JWT 기반 인증은 세션 쿠키 대신 Authorization 헤더의 토큰을 이용하기 때문에,
         * 브라우저가 자동으로 포함시키는 쿠키에 의존하지 않고 CSRF 취약점 대상에서 벗어날 수 있음
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
        /* 인증 Provider 등록
         * 로그인 요청(authenticate 메소드 호출)이 오면,
         * 등록된 authenticationProvider (여기서는 DaoAuthenticationProvider)에게 인증 처리를 위임
         */
        .authenticationProvider(authenticationProvider())
        // 엔드포인트 권한 설정
        // 예외 핸들러 등록
        .exceptionHandling(e -> e
            .authenticationEntryPoint(jwtEntryPoint) // 인증 실패 시 jwtEntryPoint가 동작
            .accessDeniedHandler(jwtAccessDeniedHandler) // 인가 실패 시 jwtAccessDeniedHandler가 동작
        )
        // HTTP 요청에 대한 접근 권한을 설정
        /*
         *  | 코드                            | 의미
            | ------------------------------ | --------------------------------------
            | `.permitAll()`                 | 누구나 접근 가능 (비로그인 포함)
            | `.authenticated()`             | 로그인한 사용자만 접근 가능
            | `.hasRole("ADMIN")`            | `ROLE_ADMIN` 권한을 가진 사용자만 접근 가능
            | `.hasAnyRole("ADMIN", "USER")` | `ADMIN` 또는 `USER` 권한 모두 허용
            | `.denyAll()`                   | 모든 사용자에게 차단

         */
        .authorizeHttpRequests(authz -> authz
            // Swagger UI 와 API docs 허용
            .requestMatchers(
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html",
                "/webjars/**"
            ).permitAll()

            // 정적 리소스 허용 (HTML, CSS, JS, 이미지 등)
            .requestMatchers(
                "/payment-test.html",
                "/static/**",
                "/css/**",
                "/js/**",
                "/images/**",
                "/favicon.ico"
            ).permitAll()

            // 결제 관련 API - 보안상 안전한 엔드포인트만 허용
            .requestMatchers(
                "/api/payments/request",      // 결제 요청 (결제창 띄우기)
                "/api/payments/*/status",     // 결제 상태 조회
                "/api/payments/webhook"       // 토스페이먼츠 웹훅 (인증 없이 받아야 함)
            ).permitAll()

            // 회원, 로그인 관련 API - 인증 없이 열어둘 엔드포인트
            .requestMatchers("/api/auth/**").permitAll()

            // 전문가 목록, 정보 관련 - 인증 없이 열어두기
            .requestMatchers("/api/advisors").permitAll()

            // 회원 탈퇴 API는 인증된 사용자만 접근 가능하도록 설정
            .requestMatchers(HttpMethod.PATCH, "/api/users/me/deactivate").authenticated()

            .requestMatchers(HttpMethod.GET, "/api/advisors/certificate-approval")
            .hasAnyRole("ADVISOR")
            .requestMatchers(HttpMethod.POST, "/api/advisors/certificate-approval").permitAll()

            // 커뮤니티
            .requestMatchers(HttpMethod.GET, "/api/community/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/community/posts/*/comments")
            .hasAnyRole("ADVISOR")
            .requestMatchers(HttpMethod.PUT, "/api/community/**").authenticated()
            .requestMatchers(HttpMethod.DELETE, "/api/community/**").authenticated()

            // KRX
            .requestMatchers(HttpMethod.GET, "/api/krx/**").permitAll()

            // 주식 조회
            .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/stock/**").permitAll()

            // 그 외 모든 요청은 인증 필요
            .anyRequest().authenticated()
        )
        // JWT 필터를 UsernamePasswordAuthenticationFilter 전에 추가
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  // CORS 정책 정의: 모든 출처, 모든 헤더, 주요 메서드 허용
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    // 모든 출처(Origin)의 요청을 허용 (개발 환경에서는 편리하지만, 프로덕션 환경에서는 특정 도메인만 명시하는 것이 더 안전)
    config.setAllowedOriginPatterns(List.of("*"));
    // GET, POST, PUT, DELETE, OPTIONS HTTP 메소드를 허용
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    // 모든 종류의 HTTP 헤더를 허용
    config.setAllowedHeaders(List.of("*"));
    // 자격 증명(쿠키, Authorization 헤더 등)을 포함한 요청을 허용
    config.setAllowCredentials(true); // 쿠키/인증 정보 허용

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config); // 모든 경로에 적용
    return source;
  }

}