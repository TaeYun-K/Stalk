FROM gradle:8.4-jdk17 AS builder

WORKDIR /app

# 프로젝트 전체 복사
COPY . .

# JAR 빌드
RUN gradle clean bootJar --no-daemon

# --------- 실행용 이미지 구성 ---------
FROM openjdk:17-jdk-slim
WORKDIR /app

# 빌드된 JAR만 복사
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
