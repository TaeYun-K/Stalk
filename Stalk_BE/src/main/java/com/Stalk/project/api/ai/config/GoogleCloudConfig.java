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

@Configuration
public class GoogleCloudConfig {

  @Value("${gcp.project.id}")
  private String projectId;

  @Value("${gcp.credentials.location}")
  private String credentialsPath;

  @Value("${vertex.ai.location}")
  private String location;

  /**
   * 서비스 계정 자격 증명을 로드합니다.
   *
   * @return GoogleCredentials 객체
   * @throws IOException 자격 증명 파일 로드 실패 시
   */
  @Bean
  public GoogleCredentials googleCredentials() throws IOException {
    // 'file:' 접두사를 제거하여 순수 파일 경로만 사용합니다.
    String cleanPath = credentialsPath.replace("file:", "");
    return GoogleCredentials.fromStream(new FileInputStream(cleanPath));
  }

  /**
   * VertexAI 클라이언트 빈을 생성합니다.
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
   * Google Cloud Storage 클라이언트 빈을 생성합니다.
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
