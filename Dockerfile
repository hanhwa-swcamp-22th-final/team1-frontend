# ==========================================
# 1. Build Stage — Node 22 (package.json engines 기준)
# ==========================================
FROM node:22-alpine AS build

WORKDIR /app

# package.json, package-lock.json 먼저 복사 → 의존성 레이어 캐싱
COPY package.json package-lock.json* ./

# 의존성 설치 (ci: 재현 가능한 빌드 보장)
RUN npm ci

# 나머지 소스 파일 복사
COPY . .

# 프로덕션 빌드 (dist/ 디렉토리 생성)
RUN npm run build

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
