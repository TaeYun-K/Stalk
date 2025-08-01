FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# 정적 파일 서버 설치
RUN npm install -g serve

EXPOSE 3000

# dist 폴더의 빌드된 파일을 서빙
CMD ["serve", "-s", "build", "-l", "3000"]