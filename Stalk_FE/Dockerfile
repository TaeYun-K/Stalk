# Stalk_FE/Dockerfile
FROM node:18-alpine

# 작업 디렉토리 생성
WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# Vite preview 서버 실행
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--port", "3000"]
