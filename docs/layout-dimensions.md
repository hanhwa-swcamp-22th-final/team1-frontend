# 레이아웃 치수 설계 문서

기준 해상도: **1920 × 1080px**

---

## 사이드바 영역 분할

```
┌─────────────────────────────────┐ ← top: 0
│  ① 로고 영역 (--sidebar-logo-h) │
│     108px  (10vh @ 1080px)     │
├─────────────────────────────────┤
│  ② 프로필 (--sidebar-profile-h) │
│     146px  (13.52vh @ 1080px)  │
├─────────────────────────────────┤
│  ③ 네비게이션                   │
│     flex: 1                    │
│     ≈826px @ 1080px 화면        │
│     (= 1080 - 108 - 146)       │
└─────────────────────────────────┘ ← bottom: 0
  전체: 250px (--sidebar-width)
```

> ④ 하단 푸터 영역은 제거됨. 푸터는 `Footer.vue`로 독립 분리 (아래 섹션 참조).

---

## clamp() 수치 근거 (전체 표)

**계산 공식:**
- `vw 기준값 = preferred_px ÷ 1920 × 100`
- `vh 기준값 = preferred_px ÷ 1080 × 100`

### 레이아웃 구조

| CSS 변수 | clamp 식 | 1366px | 1920px (기준) | 2560px |
|---|---|---|---|---|
| `--sidebar-width` | `clamp(200px, 13vw, 260px)` | 200px | **249.6px ≈ 250px** | 260px |
| `--header-height` | `clamp(68px, 10vh, 108px)` | 68px (720p) | **108px** | 108px |
| `--footer-height` | `clamp(76px, 9.72vh, 105px)` | 76px | **104.98px ≈ 105px** | 105px |
| `--sidebar-logo-h` | `clamp(68px, 10vh, 108px)` | 68px | **108px** | 108px |
| `--sidebar-profile-h` | `clamp(124px, 13.52vh, 160px)` | 124px | **146.016px ≈ 146px** | 160px |

### 내부 패딩

| CSS 변수 | clamp 식 | 1366px | 1920px (기준) | 2560px |
|---|---|---|---|---|
| `--sidebar-px` | `clamp(12px, 1.042vw, 20px)` | 14.2px | **20px** | 20px |
| `--header-px` | `clamp(20px, 1.667vw, 32px)` | 22.8px | **32px** | 32px |
| `--content-px` | `clamp(20px, 1.667vw, 32px)` | 22.8px | **32px** | 32px |
| `--content-py` | `clamp(18px, 1.458vw, 28px)` | 19.9px | **28px** | 28px |

### 아이콘 크기

| CSS 변수 | clamp 식 | 1366px | 1920px (기준) |
|---|---|---|---|
| `--avatar-logo` | `clamp(32px, 2.083vw, 40px)` | 32px | **40px** |
| `--avatar-profile` | `clamp(36px, 2.292vw, 44px)` | 36px | **44px** |

### 폰트 크기

| CSS 변수 | clamp 식 | 1366px | 1920px (기준) | 용도 |
|---|---|---|---|---|
| `--font-size-xs` | `clamp(10px, 0.573vw, 11px)` | 10px | **11px** | 배지, 캡션 |
| `--font-size-sm` | `clamp(11px, 0.625vw, 12px)` | 11px | **12px** | 테이블 셀 |
| `--font-size-md` | `clamp(12px, 0.729vw, 14px)` | 12px | **14px** | 본문 기본 |
| `--font-size-lg` | `clamp(14px, 0.833vw, 16px)` | 14px | **16px** | 섹션 제목 |
| `--font-size-xl` | `clamp(15px, 0.938vw, 18px)` | 15px | **18px** | 페이지 제목 |
| `--font-size-2xl` | `clamp(18px, 1.146vw, 22px)` | 18px | **22px** | 대형 수치 |

---

## 헤더 고정 치수

| 항목 | 값 | 계산 근거 |
|---|---|---|
| 높이 | 108px | `10vh @ 1080px` |
| 너비 | 1670px | `1920 - 250 = 1670` |
| 좌측 오프셋 | 250px (= `--sidebar-width`) | 사이드바 이후 시작 |
| `z-index` | 110 (`--z-header`) | 사이드바(100) + 10 |

---

## 사이드바 접힘 상태 (collapsed)

| 상태 | 너비 | 표시 내용 |
|---|---|---|
| 펼침 | `--sidebar-width` = 250px | 아이콘 + 텍스트 |
| 접힘 | 64px (고정) | 아이콘만 |

**64px 근거:**
- `nav-icon`: 20px
- 좌우 패딩: `--sidebar-px` ≈ 20px × 2 = 40px
- 여유 공간: 4px
- 합계: 20 + 40 + 4 = **64px**

---

## Footer.vue (독립 컴포넌트)

| 항목 | 값 |
|---|---|
| `position` | `fixed` |
| `bottom` | `0` |
| `left` | `var(--sidebar-width)` = 250px |
| `right` | `0` |
| `height` | `var(--footer-height)` = 105px |
| `z-index` | `var(--z-header)` = 110 |
| `padding` | `0 var(--header-px)` = 좌우 32px |

좌측: `CONK ● © 2026 CONK Fulfillment Platform. All rights reserved.`
우측: `이용약관 · 개인정보처리방침 · 고객센터 · v0.1.0`

---

## 콘텐츠 영역 치수 (1920×1080 기준)

| 항목 | 계산 | 결과 |
|---|---|---|
| 너비 | `1920 - 250` | **1670px** |
| 상단 여백 | `108px` (--header-height) | 헤더 아래부터 |
| 좌우 패딩 | `32px` (--content-px) | 양쪽 각각 |
| 상하 패딩 | `28px` (--content-py) | 위아래 기본 |
| 하단 패딩 | `28 + 105 = 133px` | 푸터에 가려지지 않도록 |
| 실제 콘텐츠 너비 | `1670 - 32 × 2` | **1606px** |

---

## 관련 파일

- `src/assets/styles/variables.css` — CSS 변수 정의
- `src/components/layout/AppLayout.vue` — fixed 구조 구현
- `src/components/layout/Sidebar.vue` — 사이드바 치수 CSS
- `src/components/layout/Header.vue` — 헤더 치수 CSS
- `src/components/layout/Footer.vue` — 하단 고정 푸터
