package com.Stalk.project.api.ai.config;

import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.cloud.vertexai.VertexAI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

@Configuration
/*
 * Spring Boot 애플리케이션이 Google Cloud Platform(GCP) 서비스와 통신하는 데 필요한 핵심 클라이언트 객체(Bean)를 생성하고 구성하는 역할
 *
 */
public class GoogleCloudConfig {

  /*
   * @Value 어노테이션을 사용하여 application.properties 또는 application.yml 파일에 정의된 GCP 프로젝트 ID, 인증 키 파일 경로, Vertex AI 리전 등의 값을 주입
   */
  @Value("${gcp.project.id}")
  private String projectId;

  @Value("${gcp.credentials.location}")
  private String credentialsPath;

  @Value("${vertex.ai.location}")
  private String location;

  /**
   * 서비스 계정 자격 증명을 로드
   *
   * @return GoogleCredentials 객체
   * @throws IOException 자격 증명 파일 로드 실패 시
   */
  @Bean
  public GoogleCredentials googleCredentials() throws IOException {
    if (credentialsPath.startsWith("classpath:")) {
      String relativePath = credentialsPath.replace("classpath:", "");
      Resource resource = new ClassPathResource(relativePath);
      return GoogleCredentials.fromStream(resource.getInputStream())
          .createScoped(List.of("https://www.googleapis.com/auth/cloud-platform"));
    } else {
      String cleanPath = credentialsPath.replace("file:", "");
      return GoogleCredentials.fromStream(new FileInputStream(cleanPath))
          .createScoped(List.of("https://www.googleapis.com/auth/cloud-platform"));
    }
  }

  /**
   * VertexAI 클라이언트 빈을 생성
   * 생성된 GoogleCredentials를 사용하여 Vertex AI와 통신할 수 있는 VertexAI 클라이언트 객체를 생성
   * 요청을 보낼 GCP 프로젝트 ID와 리전(location) 정보가 함께 설정
   *
   * @param credentials 인증을 위한 GoogleCredentials
   * @return VertexAI 클라이언트 인스턴스
   * @throws IOException
   */
  @Bean
  public VertexAI vertexAI(GoogleCredentials credentials) throws IOException {
    return new VertexAI.Builder()
        .setProjectId(projectId)
        .setLocation(location)
        .setCredentials(credentials)
        .build();
  }

  /**
   * Google Cloud Storage 클라이언트 빈을 생성
   * GoogleCredentials를 사용하여 Google Cloud Storage(GCS)와 상호작용(파일 업로드, 삭제 등)할 수 있는 Storage 클라이언트 객체를 생성
   *
   * @param credentials 인증을 위한 GoogleCredentials
   * @return Storage 클라이언트 인스턴스
   * @throws IOException
   */
  @Bean
  public Storage storage(GoogleCredentials credentials) throws IOException {
    return StorageOptions.newBuilder()
        .setProjectId(projectId)
        .setCredentials(credentials)
        .build()
        .getService();
  }
}
