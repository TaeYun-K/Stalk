package com.Stalk.project.util;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    /**
     * 업로드된 MultipartFile을 저장하고, 접근 가능한 URL 또는 저장 경로를 반환합니다.
     * @param file 업로드된 파일
     * @return 저장된 파일의 URL 또는 상대/절대 경로
     */
    String store(MultipartFile file);
}
