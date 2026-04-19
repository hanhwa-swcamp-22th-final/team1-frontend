# ==========================================
# 1. Build Stage — Node 22 (package.json engines 기준)
# ==========================================
FROM node:22 AS build

WORKDIR /app

# package manifest 먼저 복사 → 의존성 레이어 캐싱
COPY package.json package-lock.json* ./

# lock 파일이 있으면 npm ci, 없으면 npm install로 빌드 지속
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 나머지 소스 파일 복사
COPY . .

# VITE_API_BASE_URL: 배포 시 docker-compose build.args 로 주입
# (.dockerignore가 .env.* 제외하므로 env 파일 복사 불가 → ARG 방식 필수)
ARG VITE_API_BASE_URL
ARG VITE_API_PREFIX
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_PREFIX=${VITE_API_PREFIX}

# 배포용 prod 모드 빌드 (dist/ 디렉토리 생성)
RUN npm run build:prod

# ==========================================
# 2. Runtime Stage — Nginx (경량 Alpine 기반)
# ==========================================
FROM nginx:stable-alpine

# 기본 Nginx 설정 제거 후 커스텀 설정으로 교체
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물(dist/)을 Nginx 서빙 경로로 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
