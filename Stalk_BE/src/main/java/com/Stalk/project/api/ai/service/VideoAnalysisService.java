package com.Stalk.project.api.ai.service;

import com.Stalk.project.api.ai.dao.AnalysisResultMapper;
import com.Stalk.project.api.ai.entity.AnalysisResult;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.vertexai.VertexAI;
import com.google.cloud.vertexai.api.Content;
import com.google.cloud.vertexai.api.FileData;
import com.google.cloud.vertexai.api.Part;
import com.google.cloud.vertexai.api.GenerateContentResponse;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.cloud.vertexai.generativeai.ResponseHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@Service
public class VideoAnalysisService {

  private final VertexAI vertexAI;
  private final Storage storage;
  private final AnalysisResultMapper analysisResultMapper;

  @Value("${gcp.storage.bucket.name}")
  private String bucketName;

  @Value("${vertex.ai.model.name}")
  private String modelName;

  @Autowired
  public VideoAnalysisService(VertexAI vertexAI, Storage storage,
      AnalysisResultMapper analysisResultMapper) {
    this.vertexAI = vertexAI;
    this.storage = storage;
    this.analysisResultMapper = analysisResultMapper;
  }

  /**
   * 전체 영상 분석 프로세스를 오케스트레이션합니다.
   *
   * @param file 클라이언트로부터 업로드된 영상 파일
   * @return 데이터베이스에 저장된 분석 결과 객체
   * @throws IOException 파일 업로드 또는 AI 분석 중 오류 발생 시
   */
// VideoAnalysisService.java

  public AnalysisResult processAndSaveAnalysis(MultipartFile file) throws IOException {
    System.out.println("DEBUG: 1. GCS에 파일 업로드를 시작합니다...");
    // 1. 파일을 GCS에 업로드하고 URI를 받습니다.
    String gcsUri = uploadFileToGcs(file);
    System.out.println("DEBUG: 2. GCS 업로드 성공! URI: " + gcsUri);

    // 2. GCS URI를 사용하여 Vertex AI에 분석을 요청합니다.
    System.out.println("DEBUG: 3. Vertex AI 분석을 시작합니다...");
    String summary = analyzeVideo(gcsUri, file.getContentType());
    System.out.println("DEBUG: 4. Vertex AI 분석 성공!");

    // 3. 분석 결과를 데이터베이스에 저장합니다.
    AnalysisResult result = new AnalysisResult();
    result.setOriginalFileName(file.getOriginalFilename());
    result.setGcsUri(gcsUri);
    result.setAnalysisSummary(summary);
    result.setCreatedAt(LocalDateTime.now());

    analysisResultMapper.insert(result);
    return result;
  }

  /**
   * MultipartFile을 Google Cloud Storage에 업로드합니다.
   *
   * @param file 업로드할 파일
   * @return 업로드된 파일의 GCS URI (e.g., "gs://bucket-name/file-name")
   * @throws IOException 파일 I/O 오류 발생 시
   */
  private String uploadFileToGcs(MultipartFile file) throws IOException {
    String uniqueFileName = UUID.randomUUID().toString() + "-" + file.getOriginalFilename();
    BlobId blobId = BlobId.of(bucketName, uniqueFileName);
    BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(file.getContentType()).build();
    storage.create(blobInfo, file.getBytes());
    return String.format("gs://%s/%s", bucketName, uniqueFileName);
  }

  /**
   * GCS에 저장된 영상을 Gemini 모델을 사용하여 분석합니다.
   *
   * @param gcsUri   분석할 영상의 GCS URI
   * @param mimeType 영상의 MIME 타입
   * @return 모델이 생성한 텍스트 요약
   * @throws IOException
   */
  private String analyzeVideo(String gcsUri, String mimeType) throws IOException {
    GenerativeModel model = new GenerativeModel(modelName, vertexAI);

    // Builder 패턴을 사용하여 Part 객체들을 생성합니다.
    Content content = Content.newBuilder()
        .addParts(
            Part.newBuilder().setFileData(
                FileData.newBuilder()
                    .setFileUri(gcsUri)
                    .setMimeType(mimeType)
            )
        ) // 비디오 Part
        .addParts(
            Part.newBuilder().setText("""
                요구사항:
                1. 영상 내 시각 및 음성 정보를 기반으로 요약
                2. 주요 사건 식별 및 타임스탬프 포함
                3. 영상의 분위기 및 목적 판단
                """)
        ) // 텍스트 Part
        .build();

    GenerateContentResponse response = model.generateContent(content);

    return ResponseHandler.getText(response);
  }

}
