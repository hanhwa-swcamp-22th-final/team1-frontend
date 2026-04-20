# ==========================================
# Runtime Stage — Nginx (CI가 미리 생성한 dist 사용)
# ==========================================
FROM nginx:stable-alpine

# 기본 Nginx 설정 제거 후 커스텀 설정으로 교체
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# CI에서 먼저 생성한 빌드 결과물(dist/)을 Nginx 서빙 경로로 복사
COPY dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
