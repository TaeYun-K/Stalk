package com.Stalk.project.api.ai.service;

import com.Stalk.project.api.ai.dao.AnalysisResultMapper;
import com.Stalk.project.api.ai.entity.AnalysisResult;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.vertexai.VertexAI;
import com.google.cloud.vertexai.api.Content;
import com.google.cloud.vertexai.api.FileData;
import com.google.cloud.vertexai.api.GenerateContentResponse;
import com.google.cloud.vertexai.api.Part;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.cloud.vertexai.generativeai.ResponseHandler;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;
import java.util.Optional;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;


@Service
public class VideoAnalysisService {

  private final VertexAI vertexAI;
  private final Storage storage;
  private final AnalysisResultMapper analysisResultMapper;

  @Value("${openvidu.secret}")
  private String openViduSecret;

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
   * 전체 영상 분석 프로세스를 오케스트레이션 (URL 기반)
   *
   * @param videoUrl 클라이언트로부터 전달받은 영상 URL
   * @return 데이터베이스에 저장된 분석 결과 객체
   * @throws IOException 파일 다운로드, 업로드 또는 AI 분석 중 오류 발생 시
   */
  public AnalysisResult processAndSaveAnalysisFromUrl(Long videoRecordingId, String videoUrl) throws IOException {
    System.out.println("DEBUG: 1. URL로부터 GCS에 파일 업로드를 시작합니다...");
    /*
     * uploadFileFromUrlToGcs(videoUrl) 메소드를 호출하여 URL의 영상을 Google Cloud Storage에 업로드
     * 해당 파일에 접근할 수 있는 고유 URI(gs://...), 원본 파일명, MIME 타입을 반환
     */
    GcsUploadResult uploadResult = uploadFileFromUrlToGcs(videoUrl);
    System.out.println("DEBUG: 2. GCS 업로드 성공! URI: " + uploadResult.getGcsUri());

    System.out.println("DEBUG: 3. Vertex AI 분석을 시작합니다...");
    /*
     * 업로드된 영상의 GCS URI와 MIME 타입을 전달하여 Vertex AI의 Gemini 모델에게 분석을 요청
     * 결과 텍스트(JSON 형식)
     */
    String summary = analyzeVideo(uploadResult.getGcsUri(), uploadResult.getMimeType());
    System.out.println("DEBUG: 4. Vertex AI 분석 성공!");

    AnalysisResult result = new AnalysisResult();
    result.setVideoRecordingId(videoRecordingId); // 녹화 ID 설정
    result.setOriginalFileName(uploadResult.getOriginalFileName());
    result.setGcsUri(uploadResult.getGcsUri());
    result.setAnalysisSummary(summary);
    result.setCreatedAt(LocalDateTime.now());

    analysisResultMapper.insert(result);
    return result;
  }

  /**
   * URL로부터 영상을 다운로드하여 Google Cloud Storage에 업로드
   *
   * @param videoUrl 다운로드할 영상의 URL
   * @return 업로드된 파일의 GCS URI, MIME 타입, 원본 파일명을 담은 객체
   * @throws IOException I/O 오류 발생 시
   */
  private GcsUploadResult uploadFileFromUrlToGcs(String videoUrl) throws IOException {
    URL url = new URL(videoUrl);

    // URL 경로에서 원본 파일명 추출
    String path = url.getPath();
    String originalFileName = path.substring(path.lastIndexOf('/') + 1);
    if (originalFileName.trim().isEmpty()) {
      originalFileName = "video-" + UUID.randomUUID(); // URL 경로에 파일명이 없는 경우 대체 파일명 사용
    }

    // HTTP 연결을 통해 MIME 타입 확인
    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
    connection.setRequestMethod("GET"); // 실제 스트림을 읽어야 하므로 GET 사용

    String user = "OPENVIDUAPP";
    String secret = this.openViduSecret; // application.properties에서 주입받은 secret 값 사용
    String basicAuth = "Basic " + Base64.getEncoder().encodeToString((user + ":" + secret).getBytes());
    connection.setRequestProperty("Authorization", basicAuth);

    String mimeType = connection.getContentType();

    // GCS에 저장할 고유한 파일명 생성
    String uniqueFileName = UUID.randomUUID() + "-" + originalFileName;
    BlobId blobId = BlobId.of(bucketName, uniqueFileName);
    BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(mimeType).build();

    // URL의 InputStream을 직접 사용하여 GCS에 업로드 (메모리 효율적)
    try (InputStream inputStream = connection.getInputStream()) {
      storage.create(blobInfo, inputStream);
    }

    String gcsUri = String.format("gs://%s/%s", bucketName, uniqueFileName);
    return new GcsUploadResult(gcsUri, mimeType, originalFileName);
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
    GenerativeModel model = new GenerativeModel(modelName, vertexAI);

    Content content = Content.newBuilder()
        .setRole("user")
        .addParts(
            Part.newBuilder().setFileData(
                FileData.newBuilder()
                    .setFileUri(gcsUri)
                    .setMimeType(mimeType)
            )
        )
        .addParts(
            Part.newBuilder().setText("""
            당신은 STalk 플랫폼의 금융 교육 콘텐츠를 전문적으로 정리하는 AI 어시스턴트입니다.
            전문가가 투자자에게 특정 주제에 대해 강의하고 설명하는 영상과 음성을 분석합니다.
            
            분석 후, 영상의 내용에 따라 다음 두 가지 형식 중 하나로만 응답해야 합니다.
            
            1. 영상에 금융 투자 관련 내용이 있는 경우:
            응답은 반드시 다른 어떤 텍스트도 포함하지 않는, 유효한 단일 JSON 객체 형식이어야 합니다. JSON 객체는 아래 구조를 엄격하게 따라야 합니다:
            
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
            
            2. 영상에 금융 투자 관련 내용이 없는 경우:
            만약 영상이 금융, 투자, 경제와 관련이 없다면, 아래의 평문 형식에 맞춰 응답해야 합니다.
            
            [안내] 금융 투자 관련 콘텐츠가 아닙니다.
            
            요청하신 영상 분석 결과, 금융 투자 관련 콘텐츠가 아닌 것으로 판단됩니다. STalk의 AI 요약 기능은 금융 교육 영상에 최적화되어 있어, 요청하신 영상에 대해서는 표준 형식의 분석을 제공하기 어렵습니다.
            
            대신, 영상의 주요 내용을 아래와 같이 간략히 요약해 드립니다.
            
            [영상 내용 요약]
            
            (이곳에 영상의 전반적인 내용을 1~3문장으로 요약하여 서술합니다.)
            
            [권장 사항]
            
            정확한 금융 콘텐츠 요약을 원하시면, 전문가의 투자 강의나 시장 분석과 같은 관련 영상을 다시 업로드해 주시기 바랍니다.

            """)
        )
        .build();

    GenerateContentResponse response = model.generateContent(content);

    return ResponseHandler.getText(response);
  }

  /**
   * 녹화 ID를 기반으로 분석 결과를 조회
   *
   * @param videoRecordingId 조회할 영상의 녹화 ID
   * @return Optional<AnalysisResult> 분석 결과 객체
   */
  public Optional<AnalysisResult> getAnalysisResultByVideoRecordingId(Long videoRecordingId) {
    return Optional.ofNullable(analysisResultMapper.findByVideoRecordingId(videoRecordingId));
  }

  /**
   * GCS 업로드 결과를 담기 위한 내부 헬퍼 클래스
   */
  @Getter
  @AllArgsConstructor
  private static class GcsUploadResult {
    private final String gcsUri;
    private final String mimeType;
    private final String originalFileName;
  }
}