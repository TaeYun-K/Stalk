FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production
RUN npm run build

# 디버깅: vite가 설치되었는지 확인
RUN ls -la node_modules/.bin && ls -la node_modules/vite

EXPOSE 3000

# 🔧 npx로 실행
CMD ["npx", "vite", "preview", "--port", "3000"]
