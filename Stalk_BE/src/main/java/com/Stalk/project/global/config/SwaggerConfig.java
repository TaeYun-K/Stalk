package com.Stalk.project.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        Info info = new Info()
                .title("Stalk Project API Document")
                .description("Stalk 프로젝트의 API 명세서입니다.");

        // JWT 인증 스키마를 정의.
        String jwtSchemeName = "bearerAuth";
        
        // API 요청 헤더에 인증 정보를 담을 방식을 설정.
        SecurityRequirement securityRequirement = new SecurityRequirement().addList(jwtSchemeName);
        
        // SecuritySchemes 등록
        Components components = new Components()
                .addSecuritySchemes(jwtSchemeName, new SecurityScheme()
                        .name(jwtSchemeName) // 보안 스키마 이름
                        .type(SecurityScheme.Type.HTTP) // 인증 타입: HTTP
                        .scheme("bearer") // 스키마: bearer
                        .bearerFormat("JWT")); // 베어러 포맷: JWT

        return new OpenAPI()
                .info(info)
                .addSecurityItem(securityRequirement)
                .components(components);
    }
}
