FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

# SPA 라우팅을 위한 설정 파일 생성
RUN echo '{ \
  "public": "dist", \
  "rewrites": [ \
    { "source": "**", "destination": "/index.html" } \
  ] \
}' > serve.json

EXPOSE 3000
CMD ["serve", "-c", "serve.json", "-l", "3000"]