# CONK Frontend 디렉터리 구조 가이드

> Vue.js 3 + Vite + Pinia + Vue Router 기반 프론트엔드 프로젝트입니다.
> Role별 화면 분리와 공통 기반 코드의 명확한 경계를 기준으로 구성했습니다.

---

## 전체 구조

```
src/
├── api/                    # Axios 인스턴스 및 서비스별 API 호출 함수
├── assets/
│   ├── images/             # 로고, 아이콘 등 정적 이미지
│   └── styles/             # 전역 CSS, 변수, 공통 스타일
├── components/
│   ├── common/             # 모든 Role에서 공통으로 사용하는 컴포넌트
│   ├── layout/             # 앱 전체 레이아웃 (사이드바, 헤더 등)
│   ├── seller/             # 셀러 전용 재사용 컴포넌트
│   ├── masterAdmin/        # 총괄 관리자 전용 재사용 컴포넌트
│   ├── whManager/          # 창고 관리자 전용 재사용 컴포넌트
│   ├── whWorker/           # 창고 작업자 전용 재사용 컴포넌트
│   └── systemAdmin/        # 시스템 관리자 전용 재사용 컴포넌트
├── constants/              # Role, 상태 코드 등 전역 상수
├── router/
│   ├── index.js            # 라우터 인스턴스 및 네비게이션 가드
│   └── routes/             # Role별 라우트 정의 파일
├── stores/                 # Pinia 스토어 (전역 상태 관리)
├── utils/                  # 날짜, 숫자 포맷 등 순수 유틸 함수
└── views/
    ├── auth/               # 로그인, 비밀번호 설정 등 인증 화면
    ├── common/             # Role 무관 공통 화면 (403, 404 등)
    ├── seller/             # 셀러 전용 페이지
    ├── masterAdmin/        # 총괄 관리자 전용 페이지
    ├── whManager/          # 창고 관리자 전용 페이지
    ├── whWorker/           # 창고 작업자 전용 페이지
    └── systemAdmin/        # 시스템 관리자 전용 페이지
```

---

## 디렉터리 상세 설명

### `api/`

백엔드 서비스별 API 호출 함수를 모아두는 폴더입니다.
Axios 인스턴스(인터셉터 포함)를 `instance.js` 하나에서 생성하고,
나머지 파일들은 인스턴스를 가져다 쓰는 방식으로 구성합니다.

```
api/
├── instance.js       # Axios 인스턴스 생성, JWT 인터셉터, tenant_code 헤더 자동 주입
├── member.js         # 로그인, 계정, 테넌트, RBAC 관련 API
├── wms.js            # 창고, 재고, ASN, 로케이션 관련 API
├── order.js          # 주문 등록, 조회, 출고 관련 API
├── notification.js   # 인앱 알림 조회 API
└── integration.js    # Amazon SP-API 인증, 마진 시뮬레이터 단가 조회 API
```

> ⚠️ API 함수는 반드시 이 폴더 안에서만 작성합니다. 
> View나 Store에서 Axios를 직접 import하지 않습니다.

---

### `assets/images/`

로고, 빈 상태 일러스트, 파비콘 등 정적 이미지를 보관합니다.

---

### `assets/styles/`

전역 스타일을 관리합니다.

```
styles/
├── main.css          # 전역 CSS reset 및 기본 스타일
├── variables.css     # CSS 커스텀 변수 (컬러, 폰트, 간격 등 Cool Slate 팔레트)
└── transitions.css   # 페이지 전환 애니메이션
```

---

### `components/common/`

Role에 상관없이 **2개 이상의 화면**에서 재사용되는 공통 컴포넌트입니다.
새 컴포넌트를 여기에 추가할 때는 팀원과 먼저 협의합니다.

```
common/
├── BaseTable.vue         # 정렬 / 필터 / 페이지네이션 포함 범용 테이블
├── BaseModal.vue         # 확인 / 취소 공통 모달 (삭제 확인, 경고 등)
├── BaseForm.vue          # 폼 레이아웃 래퍼 (라벨 + 입력 + 에러 메시지)
├── StatusBadge.vue       # 주문 상태 / 계정 상태 / ASN 상태 색상 배지
├── TimelineStepper.vue   # 주문 / ASN 단계별 상태 타임라인 UI
├── FileUpload.vue        # 엑셀 파일 업로드 공통 컴포넌트
├── ConfirmDialog.vue     # "정말 삭제하시겠습니까?" 형태의 확인 다이얼로그
├── ToastMessage.vue      # API 성공 / 실패 토스트 알림
├── EmptyState.vue        # 데이터 없을 때 빈 상태 표시
└── LoadingSpinner.vue    # 로딩 중 스피너
```

---

### `components/layout/`

모든 인증된 화면에서 사용하는 앱 셸(App Shell) 컴포넌트입니다.
로그인/비밀번호 설정 화면은 이 레이아웃을 사용하지 않습니다.

```
layout/
├── AppLayout.vue     # 사이드바 + 헤더 + 콘텐츠 영역을 감싸는 최상위 레이아웃
├── Sidebar.vue       # Role별 메뉴 항목 동적 렌더링 (RBAC 권한 매트릭스 반영)
└── Header.vue        # 상단 헤더 (현재 사용자 정보, 알림 벨, 로그아웃)
```

> Sidebar는 로그인 후 서버에서 받아온 권한 정보를 기반으로
> 메뉴 항목을 동적으로 렌더링합니다. 하드코딩하지 않습니다.

---

### `components/seller/` `components/masterAdmin/` `components/whManager/` `components/whWorker/` `components/systemAdmin/`

각 Role 전용으로 **해당 Role의 여러 View에서 반복 사용**되는 컴포넌트입니다.
단 하나의 View에서만 쓰이는 컴포넌트는 View 파일 내부에 인라인으로 작성합니다.

---

### `constants/`

전체 프로젝트에서 사용하는 상수를 중앙 관리합니다.
**문자열을 View나 Store에 직접 하드코딩하지 않습니다.**

```
constants/
├── roles.js          # SYSTEM_ADMIN / MASTER_ADMIN / WH_MANAGER / WH_WORKER / SELLER
├── status.js         # 주문 상태 6단계, ASN 상태 4단계, 계정 상태 3단계
├── routes.js         # 라우트 이름 상수 (문자열 오타 방지)
└── index.js          # 위 상수들을 한 곳에서 re-export
```

---

### `router/index.js`

Vue Router 인스턴스 생성 및 **전역 네비게이션 가드**를 정의합니다.

가드에서 처리하는 항목:
- 비로그인 상태 → 로그인 페이지 리다이렉트
- 임시 비밀번호 상태(`TEMP_PASSWORD`) → 비밀번호 변경 페이지 강제 이동
- Role 불일치 접근 → 403 페이지
- 로그인 상태에서 로그인 페이지 재접근 → Role별 대시보드로 리다이렉트

### `router/routes/`

Role별로 라우트 정의 파일을 분리합니다.

```
routes/
├── auth.js           # 로그인, 비밀번호 설정, 비밀번호 변경
├── seller.js         # 셀러 전용 라우트
├── masterAdmin.js    # 총괄 관리자 전용 라우트
├── whManager.js      # 창고 관리자 전용 라우트
├── whWorker.js       # 창고 작업자 전용 라우트
└── systemAdmin.js    # 시스템 관리자 전용 라우트
```

---

### `stores/`

Pinia 스토어 파일을 보관합니다.
**서버 데이터의 캐시 용도로는 사용하지 않습니다.**
전역에서 공유가 필요한 상태만 스토어로 관리합니다.

```
stores/
├── auth.js           # 로그인 유저 정보, JWT 토큰, role, tenant_code, customer_code
│                     # pinia-plugin-persistedstate로 새로고침 후에도 유지
├── ui.js             # 전역 로딩 상태, 사이드바 열림/닫힘
├── notification.js   # 인앱 알림 목록, 미확인 알림 수 배지
└── warehouse.js      # 창고 관리자가 선택한 현재 창고 (화면 이동 시 유지)
```

---

### `utils/`

특정 컴포넌트나 스토어에 종속되지 않는 **순수 함수**만 작성합니다.

```
utils/
├── format.js         # 날짜 포맷, 금액 포맷($, USD), 무게 단위 변환
├── validate.js       # 이메일, 비밀번호 복잡도, SKU 코드 유효성 검증
├── excel.js          # 엑셀 파일 파싱 / 다운로드 (xlsx 라이브러리 래퍼)
└── storage.js        # localStorage / sessionStorage 접근 헬퍼
```

---

### `views/auth/`

로그인 전 접근 가능한 인증 관련 화면입니다. `AppLayout`을 사용하지 않습니다.

```
auth/
├── LoginView.vue             # 이메일(또는 작업자 코드) + 비밀번호 로그인
├── SetPasswordView.vue       # 초대받은 사용자 최초 비밀번호 설정
└── ChangePasswordView.vue    # 임시 비밀번호 발급 계정 첫 로그인 시 강제 변경
```

---

### `views/common/`

Role과 무관하게 표시되는 공통 화면입니다.

```
common/
├── NotFoundView.vue      # 404 페이지
└── ForbiddenView.vue     # 403 권한 없음 페이지
```

---

### `views/seller/`

셀러(SELLER) Role 전용 화면입니다. (담당: 팀원 3)

```
seller/
├── DashboardView.vue           # 셀러 메인 대시보드 (재고/주문/출고 요약)
├── ProductListView.vue         # 상품 목록 조회
├── ProductRegisterView.vue     # 상품 등록
├── AsnListView.vue             # ASN 목록 조회
├── AsnCreateView.vue           # ASN 생성
├── AsnDetailView.vue           # ASN 상세 및 입고 트래킹
├── InventoryView.vue           # 가용 재고 실시간 조회
├── OrderListView.vue           # 주문 목록 조회
├── OrderDetailView.vue         # 주문 상세 및 상태 트래킹
├── OrderRegisterView.vue       # 수동 주문 단건 등록 + 엑셀 일괄 업로드
├── AmazonConnectView.vue       # Amazon SP-API 인증 설정
└── MarginSimulatorView.vue     # 마진 시뮬레이터 (입력 + 결과 파이차트)
```

---

### `views/masterAdmin/`

총괄 관리자(MASTER_ADMIN) Role 전용 화면입니다. (담당: 팀원 2)

```
masterAdmin/
├── DashboardView.vue           # 전체 창고 통합 운영 현황 대시보드
├── WarehouseListView.vue       # 창고 목록 및 상세 현황 조회
├── WarehouseRegisterView.vue   # 신규 창고 등록
├── AccountListView.vue         # 소속 사용자 목록 (관리자 / 작업자 / 셀러)
├── AccountInviteView.vue       # 창고 관리자 / 작업자 / 셀러 담당자 초대
├── SellerCompanyListView.vue   # 셀러 회사 목록 조회
├── SellerCompanyRegisterView.vue # 셀러 회사 등록
├── RbacSettingView.vue         # Role별 메뉴 접근 권한 매트릭스 설정
└── FeeSettingView.vue          # 단가 설정 (보관비 / 작업비 / 배송비 / 수입부가비용)
```

---

### `views/whManager/`

창고 관리자(WH_MANAGER) Role 전용 화면입니다. (담당: 팀원 4)

```
whManager/
├── DashboardView.vue           # 소속 창고 일일 운영 현황 대시보드
├── AsnListView.vue             # ASN 목록 조회 (셀러가 등록한 입고예정)
├── AsnDetailView.vue           # ASN 상세 / SKU-BIN 매칭 / 입고 확인 / 작업 배정
├── InspectionView.vue          # 검수 결과 확인 및 입고 확정 처리
├── LocationSettingView.vue     # Zone-Rack-Bin 구조 생성 및 Put-away 제안
├── InventoryView.vue           # 셀러 회사별 / SKU별 재고 현황 조회
├── OrderListView.vue           # 출고 대상 주문 목록 조회
├── OrderDetailView.vue         # 주문 상세 조회
├── OutboundView.vue            # 출고 지시 / 피킹 리스트 생성 및 작업자 배정
├── LabelPrintView.vue          # 배송 라벨 (송장) 출력
├── OutboundConfirmView.vue     # 출고 확정 및 재고 차감
├── WorkerAccountView.vue       # 창고 작업자 계정 직접 발급
└── WorkerBinAssignView.vue     # Worker-Bin 사전 배정 설정
```

---

### `views/whWorker/`

창고 작업자(WH_WORKER) Role 전용 화면입니다. 태블릿 터치 UI 기준으로 개발합니다. (담당: 팀원 4)

```
whWorker/
├── TaskListView.vue            # 오늘 배정된 작업 목록 조회
├── InspectionView.vue          # 입고 검수 수량 입력 및 적재 완료 처리
├── PickingView.vue             # 피킹 리스트 확인 및 피킹 수량 입력
└── PackingView.vue             # 패킹 검수 및 작업 완료 처리
```

---

### `views/systemAdmin/`

시스템 관리자(SYSTEM_ADMIN) Role 전용 화면입니다. (담당: 팀원 1)

```
systemAdmin/
├── CompanyListView.vue         # 3PL 업체 목록 조회
├── CompanyRegisterView.vue     # 신규 3PL 업체 등록 및 최초 총괄 관리자 동시 생성
└── FeeSettingView.vue          # 판매 채널 수수료율 등록
```

---

## 개발 규칙 요약

| 항목 | 규칙 |
|---|---|
| API 호출 | 반드시 `api/` 폴더의 함수만 사용, View에서 Axios 직접 import 금지 |
| 상수 | `constants/` 에서 import, 문자열 하드코딩 금지 |
| 공통 컴포넌트 추가 | 팀원과 협의 후 `components/common/` 에 추가 |
| 스토어 사용 | 전역 공유 상태만 Pinia로 관리, 단일 화면 상태는 `ref/reactive` 로 처리 |
| Role별 화면 | `views/{role}/` 와 `components/{role}/` 에만 작성, 다른 Role 폴더 수정 금지 |
| 태블릿 UI | `views/whWorker/` 는 터치 친화적 UI (큰 버튼, 넓은 터치 영역) 적용 |
