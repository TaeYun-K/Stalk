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
import java.util.UUID;

/**
 * 비즈니스 로직을 담당하는 서비스 클래스
 * 서비스 클래스는 컨트롤러로부터 전달받은 데이터를 가지고 실제 비즈니스 로직을 수행
 * 영상 업로드, AI 분석 요청, 결과 저장을 모두 총괄(Orchestration)
 */
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
   * 전체 영상 분석 프로세스를 오케스트레이션
   *
   * @param file 클라이언트로부터 업로드된 영상 파일
   * @return 데이터베이스에 저장된 분석 결과 객체
   * @throws IOException 파일 업로드 또는 AI 분석 중 오류 발생 시
   */
// VideoAnalysisService.java
  public AnalysisResult processAndSaveAnalysis(MultipartFile file) throws IOException {
    System.out.println("DEBUG: 1. GCS에 파일 업로드를 시작합니다...");
    /*
     * uploadFileToGcs(file) 메소드를 호출하여 받은 영상 파일을 Google Cloud Storage에 업로드
     * 해당 파일에 접근할 수 있는 고유 URI(gs://...)를 반환
     */
    String gcsUri = uploadFileToGcs(file);
    System.out.println("DEBUG: 2. GCS 업로드 성공! URI: " + gcsUri);

    System.out.println("DEBUG: 3. Vertex AI 분석을 시작합니다...");
    /*
     * 업로드된 영상의 GCS URI와 MIME 타입을 전달하여 Vertex AI의 Gemini 모델에게 분석을 요청
     * 결과 텍스트(JSON 형식)
     */
    String summary = analyzeVideo(gcsUri, file.getContentType());
    System.out.println("DEBUG: 4. Vertex AI 분석 성공!");

    // 원본 파일명, GCS URI, AI가 생성한 요약 내용, 생성 시각
    AnalysisResult result = new AnalysisResult();
    result.setOriginalFileName(file.getOriginalFilename());
    result.setGcsUri(gcsUri);
    result.setAnalysisSummary(summary);
    result.setCreatedAt(LocalDateTime.now());

    analysisResultMapper.insert(result);
    return result;
  }

  /**
   * MultipartFile을 Google Cloud Storage에 업로드
   * UUID.randomUUID()를 사용해 파일명이 중복되지 않도록 고유한 파일명을 생성
   * Storage 클라이언트를 사용하여 파일을 GCS 버킷에 업로드하고, 해당 파일의 GCS URI를 생성하여 반환
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
   * GCS에 저장된 영상을 Gemini 모델을 사용하여 분석
   *
   * @param gcsUri   분석할 영상의 GCS URI
   * @param mimeType 영상의 MIME 타입
   * @return 모델이 생성한 텍스트 요약
   * @throws IOException
   */
  private String analyzeVideo(String gcsUri, String mimeType) throws IOException {
    // 주입받은 modelName과 vertexAI 클라이언트로 GenerativeModel 객체를 생성
    GenerativeModel model = new GenerativeModel(modelName, vertexAI);

    /*
     * Builder 패턴을 사용하여 Part 객체들을 생성
     * 비디오 Part: 분석할 영상의 GCS URI와 MIME 타입 정보
     */
    Content content = Content.newBuilder()
        .setRole("user")
        .addParts(
            Part.newBuilder().setFileData(
                FileData.newBuilder()
                    .setFileUri(gcsUri)
                    .setMimeType(mimeType)
            )
        )
        /*
         * 텍스트 Part (프롬프트): AI 모델에게 어떻게 행동해야 할지 지시하는 상세한 프롬프트를 텍스트로 전달
         * 역할 부여 및 출력 형식 지정
         */
        .addParts(
            Part.newBuilder().setText("""
                당신은 STolk 플랫폼의 금융 교육 콘텐츠를 전문적으로 정리하는 AI 어시스턴트입니다.
                전문가가 투자자에게 특정 주제에 대해 강의하고 설명하는 영상과 음성을 분석합니다.
                응답은 반드시 유효한 단일 JSON 객체 형식이어야 하며, 다른 어떤 텍스트도 포함해서는 안 됩니다.

                JSON 객체는 아래 구조를 엄격하게 따라야 합니다:
                {
                  "lecture_content": [
                    {
                      "topic": "강의의 첫 번째 소주제 (예: 1. 현재 시장 상황과 주요 특징)",
                      "details": "해당 소주제에 대한 전문가의 상세한 설명과 강의 내용을 여기에 기록합니다."
                    },
                    {
                      "topic": "강의의 두 번째 소주제 (예: 2. 이동평균선을 활용한 추세 분석 방법)",
                      "details": "두 번째 소주제에 대한 전문가의 상세한 설명과 예시 등을 여기에 기록합니다."
                    }
                  ],
                  "key_takeaways": {
                    "main_subject": "강의의 핵심 주제를 한 문장으로 요약합니다. (예: '기술적 분석 지표인 이동평균선의 원리와 실제 적용 방안')",
                    "core_concepts": [
                      "강의에서 다룬 핵심 개념이나 용어 1 (예: '골든 크로스')",
                      "강의에서 다룬 핵심 개념이나 용어 2 (예: '데드 크로스')",
                      "강의에서 다룬 핵심 개념이나 용어 3 (예: '이격도')"
                    ],
                    "conclusion_and_strategy": "강의 내용을 바탕으로 전문가가 최종적으로 내린 결론이나 투자자에게 제안하는 학습 전략을 요약합니다."
                  }
                }
                """)
        ) // 텍스트 Part
        .build();

    GenerateContentResponse response = model.generateContent(content);

    return ResponseHandler.getText(response);
  }
}
