# 1. 베이스 이미지 선택
FROM node:18-alpine

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. package.json, lock 파일 복사 → 의존성 설치 (캐시 최적화)
COPY package*.json ./
RUN npm install

# 4. 전체 프로젝트 복사
COPY . .

# 5. Vite 빌드 실행 (타입 문제 방지를 위해 ENV 적용)
ENV NODE_ENV=production
RUN npm run build

# 6. Vite preview 서버 실행
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--port", "3000"]
