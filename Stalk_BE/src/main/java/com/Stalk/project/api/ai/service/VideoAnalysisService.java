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
        .setRole("user")
        .addParts(
            Part.newBuilder().setFileData(
                FileData.newBuilder()
                    .setFileUri(gcsUri)
                    .setMimeType(mimeType)
            )
        ) // 비디오 Part
        /**
         * """
         당신은 STolk 플랫폼의 유능하고 꼼꼼한 금융 상담 기록 전문가입니다.
         전문가와 투자자 간의 주식 상담 영상 및 음성을 분석하여, 아래 지시사항과 양식에 따라 결과를 생성해주세요.

         [지시사항]
         1. **상담 내용 상세 기술**: 먼저, 상담의 전체적인 흐름을 시간 순서에 따라 대화 형식처럼 자세하게 설명해주세요. 투자자의 현재 상황, 전문가의 주요 질문, 차트나 데이터를 보며 분석하는 과정, 주고받는 주요 의견 등을 포함해야 합니다.
         2. **최종 핵심 요약**: 상세 기술이 끝난 후, 마지막에 전체 상담의 핵심 내용을 아래 항목에 맞춰 간결하게 요약해주세요.

         [결과 양식]
         반드시 아래 마크다운 양식에 맞춰서 결과를 생성해야 합니다.

         ### 상담 상세 내용

         (여기에 시간 순서에 따른 상담의 상세한 내용을 작성합니다. 예를 들어, "상담 초반, 투자자는 OOO 종목의 향후 전망에 대해 질문했습니다. 이에 전문가는 현재 주가와 차트를 화면에 띄우고 OOO 지표를 근거로 설명하기 시작했습니다...")

         ### 최종 핵심 요약
         * **주요 분석 종목**: (상담에서 주로 다룬 주식 종목의 이름과 코드 명시)
         * **전문가 진단 및 근거**: (해당 종목에 대한 전문가의 최종 분석과 핵심 근거 요약)
         * **투자자 핵심 질문**: (투자자가 가장 궁금해했던 핵심적인 질문 요약)
         * **최종 투자 전략**: (전문가가 제안한 구체적인 매수/매도/보유 등 투자 전략 요약)
         """
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
