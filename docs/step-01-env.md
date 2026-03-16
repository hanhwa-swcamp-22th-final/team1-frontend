# 환경변수 설정 가이드

> **한 줄 요약**: Vite 환경변수 파일 생성 및 설정 방법, VITE_ 접두어 규칙 정리

## 목차

- [.env 파일 종류](#env-파일-종류)
- [환경변수 로드 순서](#환경변수-로드-순서)
- [CONK 필수 환경변수](#conk-필수-환경변수)
- [로컬 개발 환경 설정](#로컬-개발-환경-설정)
- [Vite 환경변수 규칙](#vite-환경변수-규칙)
- [참고 자료](#참고-자료)

---

## .env 파일 종류

Vite는 여러 `.env.*` 파일을 지원합니다. 다음 표는 파일 우선순위와 커밋 정책을 정리한 것입니다.

| 파일                       | 언제 로드?                 | 커밋 여부        | 용도                 |
|--------------------------|------------------------|--------------|--------------------|
| `.env`                   | 항상                     | ✅ 커밋         | 모든 환경 공통 설정 (기본값)  |
| `.env.local`             | 항상 (로컬 전용)             | ❌ .gitignore | 개인별 설정, 로컬 API URL |
| `.env.development`       | `npm run dev` 시        | ✅ 커밋         | 개발 환경 고정값          |
| `.env.production`        | `npm run build` 시      | ✅ 커밋         | 운영 환경 고정값          |
| `.env.development.local` | `npm run dev` 시 (로컬)   | ❌ .gitignore | 개인 개발 설정           |
| `.env.production.local`  | `npm run build` 시 (로컬) | ❌ .gitignore | 개인 운영 설정           |

### 로드 순서 (우선순위 높음 → 낮음)

```
.env.*.local  (최우선)
   ↓
.env.*       (dev/production 구분)
   ↓
.env         (기본값)
```

**예시**: `npm run dev`를 실행할 때

```
1. .env.development.local (있으면 우선 로드)
2. .env.development
3. .env
```

중복된 키가 있으면 우선순위 높은 파일이 덮어씁니다.

---

## 환경변수 로드 순서

### 개발 모드 (`npm run dev`)

```
┌─ .env.development.local ──┐
│ VITE_API_BASE_URL=http://... │ (로컬 테스트용, .gitignore)
└──────────────────────────┘
            ↓ (덮어쓰기)
┌─ .env.development ────────┐
│ VITE_API_BASE_URL=https://... │ (팀 개발 서버)
└──────────────────────────┘
            ↓ (덮어쓰기)
┌─ .env ──────────────┐
│ # 기본값 없음      │
└──────────────────────┘

최종 결과: .env.development.local 값 사용
```

### 프로덕션 빌드 (`npm run build`)

```
┌─ .env.production.local ───┐
│ VITE_API_BASE_URL=https://... │ (로컬 테스트용)
└──────────────────────────┘
            ↓
┌─ .env.production ────────┐
│ VITE_API_BASE_URL=https://prod-api.conk.com │
└──────────────────────────┘
            ↓
┌─ .env ──────────────┐
│ # 기본값 없음      │
└──────────────────────┘
```

---

## CONK 필수 환경변수

### VITE_API_BASE_URL

| 항목    | 값                   |
|-------|---------------------|
| 변수명   | `VITE_API_BASE_URL` |
| 타입    | 문자열 (URL)           |
| 필수 여부 | ✅ 필수                |
| 기본값   | 없음                  |
| 설명    | 백엔드 API 서버의 기본 URL  |

#### 설정 예시

**개발 환경 (`.env.development`)**

```
VITE_API_BASE_URL=http://localhost:8080/api
```

**운영 환경 (`.env.production`)**

```
VITE_API_BASE_URL=https://api.conk-wms.com/api
```

**로컬 커스텀 (`.env.local` — 커밋 금지)**

```
VITE_API_BASE_URL=http://192.168.1.100:3000/api
```

#### 코드 사용법

```js
// src/api/instance.js
const baseURL = import.meta.env.VITE_API_BASE_URL

const instance = axios.create({
  baseURL: baseURL,  // http://localhost:8080/api
  timeout: 10000
})
```

---

## 로컬 개발 환경 설정

### 1단계: .env.example 확인

프로젝트 루트의 `.env.example` 파일을 확인합니다:

```bash
# 프로젝트 루트
ls -la .env.example
cat .env.example
```

예상 내용:

```
VITE_API_BASE_URL=http://localhost:8080/api
```

### 2단계: .env.local 생성

```bash
# 프로젝트 루트에서 실행
cp .env.example .env.local
```

또는 직접 생성:

```bash
echo "VITE_API_BASE_URL=http://localhost:8080/api" > .env.local
```

### 3단계: 필요시 수정

로컬 백엔드 서버가 다른 포트에서 실행 중이면:

```bash
# .env.local 편집
VITE_API_BASE_URL=http://192.168.1.100:3000/api
```

### 4단계: Vite 개발 서버 시작

```bash
npm run dev
```

Vite가 `.env.local`을 읽고 환경변수를 로드합니다.

### 검증

브라우저 콘솔에서 확인:

```js
console.log(import.meta.env.VITE_API_BASE_URL)
// 출력: http://localhost:8080/api
```

---

## Vite 환경변수 규칙

### VITE_ 접두어 필수

Vite는 **보안상 이유**로 `VITE_` 접두어가 있는 변수만 브라우저에 노출합니다.

#### ✅ 브라우저에서 접근 가능

```env
# .env.local
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=CONK WMS
```

```js
// 컴포넌트 내 접근 가능
console.log(import.meta.env.VITE_API_BASE_URL)  // ✅ 접근 가능
console.log(import.meta.env.VITE_APP_NAME)      // ✅ 접근 가능
```

#### ❌ 브라우저에서 접근 불가능 (보안)

```env
# .env.local
DATABASE_URL=postgresql://...
SECRET_API_KEY=sk-1234567890
```

```js
// 컴포넌트 내 접근 불가능
console.log(import.meta.env.DATABASE_URL)       // ❌ undefined
console.log(import.meta.env.SECRET_API_KEY)     // ❌ undefined
```

**이유**: 민감한 정보(DB 연결, 비밀키)가 클라이언트에 노출되는 것을 방지

### 환경변수 접근 문법

```js
// 개발 환경에서만 접근
if (import.meta.env.DEV) {
  console.log(import.meta.env.VITE_API_BASE_URL)
}

// 모드 확인
if (import.meta.env.MODE === 'development') {
  // 개발 환경 로직
}

// SSR 확인 (현재 프로젝트는 SPA이므로 false)
console.log(import.meta.env.SSR)  // false
```

### 내장 환경변수

| 변수                     | 값         | 설명                                |
|------------------------|-----------|-----------------------------------|
| `import.meta.env.DEV`  | `boolean` | `npm run dev` 실행 중이면 true         |
| `import.meta.env.PROD` | `boolean` | `npm run build` 후이면 true          |
| `import.meta.env.MODE` | `string`  | `'development'` 또는 `'production'` |
| `import.meta.env.SSR`  | `boolean` | SSR 빌드이면 true (항상 false)          |

---

## 환경변수 타입 안전성 (선택)

TypeScript를 사용하면 환경변수 타입 체크를 할 수 있습니다:

### vite-env.d.ts 작성 (선택사항)

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

그러면 환경변수가 자동 완성됩니다:

```js
import.meta.env.VITE_API_BASE_URL  // 자동 완성 + 타입 체크
```

---

## 문제 해결

### Q: 환경변수 변경 후에도 적용이 안 됨

**해결책**: 개발 서버 재시작

```bash
# 기존 프로세스 종료 (Ctrl+C)
# 다시 시작
npm run dev
```

Vite HMR은 코드 변경만 감지하고, `.env.*` 파일 변경은 수동 재시작 필요합니다.

### Q: .env.local이 .gitignore에 있는데, 팀원과 환경변수를 공유하려면?

**해결책**: `.env.example` 사용

1. `.env.example` 파일에 템플릿 작성:
   ```
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

2. `.gitignore`에 `.env.local` 등록:
   ```
   .env.local
   .env.development.local
   .env.production.local
   ```

3. 팀원은 `.env.example` 복사 후 수정:
   ```bash
   cp .env.example .env.local
   # 자신의 환경에 맞게 수정
   ```

---

## 참고 자료

- [Vite 환경변수 공식 문서](https://vitejs.dev/guide/env-and-mode.html)
- [vite.config.js 설정 예시](https://vitejs.dev/config/)
- [Node.js 환경변수 처리 모범 사례](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
