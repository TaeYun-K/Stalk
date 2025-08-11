package com.Stalk.project.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  @Value("${file.upload-dir}")
  private String uploadDir;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // /images/** URL 요청이 오면, file:///C:/project/uploads/images/ 경로에서 파일을 찾아 제공합니다.
    registry.addResourceHandler("/images/**")
        .addResourceLocations("file:" + uploadDir + "/");
  }
}