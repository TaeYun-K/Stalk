package com.Stalk.project.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 업로드된 파일 경로 매핑 (예: http://도메인/uploads/{filename})
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}
