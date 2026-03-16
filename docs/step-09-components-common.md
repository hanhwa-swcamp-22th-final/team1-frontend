# 공통 컴포넌트 레퍼런스

> **한 줄 요약**: 전역에서 재사용되는 10개 공통 컴포넌트(테이블, 모달, 폼, 배지 등)의 사용법 및 Props/Slots 명세.

## 목차 (Table of Contents)

- [개요](#개요)
- [BaseTable](#basetable)
- [BaseModal](#basemodal)
- [BaseForm](#baseform)
- [StatusBadge](#statusbadge)
- [TimelineStepper](#timelinestepper)
- [FileUpload](#fileupload)
- [ConfirmDialog](#confirmdialog)
- [ToastMessage](#toastmessage)
- [EmptyState](#emptystate)
- [LoadingSpinner](#loadingspinner)
- [모범 사례](#모범-사례)

---

## 개요

모든 공통 컴포넌트는 `src/components/common/`에 위치합니다.

```
src/components/common/
├── BaseTable.vue
├── BaseModal.vue
├── BaseForm.vue
├── StatusBadge.vue
├── TimelineStepper.vue
├── FileUpload.vue
├── ConfirmDialog.vue
├── ToastMessage.vue
├── EmptyState.vue
└── LoadingSpinner.vue
```

### 사용 방법

**전역 등록 없음**: 필요한 컴포넌트를 각 파일에서 직접 import하여 사용합니다.

```vue
<script setup>
import BaseTable from '@/components/common/BaseTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
</script>

<template>
  <BaseTable :columns="cols" :rows="rows" />
  <BaseModal title="편집" :isOpen="isOpen" />
</template>
```

---

## BaseTable

범용 데이터 테이블. 정렬, 페이지네이션, 커스텀 셀 렌더링 지원.

### Props

| Prop         | 타입                   | 필수 | 기본값     | 설명               |
|--------------|----------------------|----|---------|------------------|
| `columns`    | `Column[]`           | ✅  | —       | 컬럼 정의 배열         |
| `rows`       | `Object[]`           |    | `[]`    | 데이터 행 배열         |
| `loading`    | `boolean`            |    | `false` | 로딩 중 표시 여부       |
| `pagination` | `Pagination \| null` |    | `null`  | null이면 페이지네이션 숨김 |
| `rowKey`     | `string`             |    | `'id'`  | 행 고유키 필드명        |
| `striped`    | `boolean`            |    | `false` | 줄무늬 스타일          |
| `bordered`   | `boolean`            |    | `false` | 테두리 표시           |

### Column 타입 정의

```ts
type Column = {
  key: string              // 데이터 필드명
  label: string            // 헤더 텍스트
  sortable?: boolean       // 정렬 가능 여부
  width?: string           // 컬럼 너비 (예: '80px', '20%')
  align?: 'left'|'center'|'right'  // 정렬 위치
}
```

### Pagination 타입 정의

```ts
type Pagination = {
  page: number             // 현재 페이지 (1-indexed)
  pageSize: number         // 페이지당 행 수
  total: number            // 전체 행 수
}
```

### Emits

| 이벤트           | 인자             | 발생 시점               |
|---------------|----------------|---------------------|
| `sort`        | `key: string`  | 정렬 가능 헤더 클릭 (토글 방식) |
| `page-change` | `page: number` | 페이지 버튼 클릭           |

### Slots

| 슬롯 이름        | Props            | 설명                  |
|--------------|------------------|---------------------|
| `cell-{key}` | `{ row, value }` | 특정 컬럼의 셀 내용 커스텀 렌더링 |
| `empty`      | —                | 데이터가 없을 때 표시        |
| `loading`    | —                | 로딩 중 표시             |

### 기본 사용 예

```vue
<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'

const currentPage = ref(1)
const orders = ref([
  { id: 'ORD-001', name: '홍길동', qty: 5, status: 'PENDING' },
  { id: 'ORD-002', name: '김영희', qty: 3, status: 'SHIPPED' },
])

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'name', label: '고객명', sortable: true },
  { key: 'qty', label: '수량', width: '60px', align: 'center' },
  { key: 'status', label: '상태', align: 'center' },
]

const pagination = {
  page: currentPage.value,
  pageSize: 20,
  total: 100
}

function handleSort(key) {
  console.log(`${key} 컬럼으로 정렬`)
  // API 호출하여 데이터 재조회
}

function handlePageChange(page) {
  currentPage.value = page
  // API 호출하여 데이터 재조회
}
</script>

<template>
  <BaseTable
    :columns="columns"
    :rows="orders"
    :pagination="pagination"
    @sort="handleSort"
    @page-change="handlePageChange"
  />
</template>
```

### 커스텀 셀 렌더링 예

```vue
<template>
  <BaseTable :columns="columns" :rows="orders">
    <!-- status 컬럼을 StatusBadge로 렌더링 -->
    <template #cell-status="{ row, value }">
      <StatusBadge :status="value" type="order" />
    </template>

    <!-- 액션 컬럼 (테이블에 없는 데이터) -->
    <template #cell-actions>
      <button @click="editOrder(row.id)">편집</button>
      <button @click="deleteOrder(row.id)">삭제</button>
    </template>
  </BaseTable>
</template>
```

### 페이지네이션 없는 사용

```vue
<template>
  <!-- pagination prop을 null로 설정하면 페이지네이션 숨김 -->
  <BaseTable
    :columns="columns"
    :rows="rows"
    :pagination="null"
  />
</template>
```

---

## BaseModal

공통 모달 다이얼로그. `<Teleport>`로 z-index 문제 제거.

### Props

| Prop         | 타입        | 기본값       | 설명                 |
|--------------|-----------|-----------|--------------------|
| `title`      | `string`  | — (필수)    | 모달 제목              |
| `isOpen`     | `boolean` | — (필수)    | 표시 여부              |
| `width`      | `string`  | `'520px'` | 모달 패널 너비           |
| `hideFooter` | `boolean` | `false`   | 기본 footer 버튼 숨김 여부 |

### Emits

| 이벤트       | 인자 | 발생 시점           |
|-----------|----|-----------------|
| `confirm` | —  | confirm 버튼 클릭   |
| `cancel`  | —  | 배경/cancel 버튼 클릭 |

### Slots

| 슬롯        | 설명                                 |
|-----------|------------------------------------|
| `default` | 모달 본문 내용                           |
| `footer`  | 버튼 영역 커스텀 (hideFooter=true 시에만 사용) |

### 기본 사용 예

```vue
<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseForm from '@/components/common/BaseForm.vue'

const isOpen = ref(false)
const form = ref({ name: '', quantity: 0 })

function openModal() {
  isOpen.value = true
}

function handleConfirm() {
  // 저장 로직
  console.log('저장:', form.value)
  isOpen.value = false
}

function handleCancel() {
  // 취소 로직
  form.value = { name: '', quantity: 0 }
  isOpen.value = false
}
</script>

<template>
  <button @click="openModal">재고 수정</button>

  <BaseModal
    title="재고 수정"
    :isOpen="isOpen"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <BaseForm label="상품명" required>
      <input v-model="form.name" type="text" />
    </BaseForm>
    <BaseForm label="수량" required>
      <input v-model.number="form.quantity" type="number" min="0" />
    </BaseForm>
  </BaseModal>
</template>
```

### 커스텀 footer 예

```vue
<template>
  <BaseModal
    title="커스텀 모달"
    :isOpen="isOpen"
    hideFooter
    @cancel="isOpen = false"
  >
    <p>모달 본문</p>

    <template #footer>
      <button @click="doSomething">특수 액션</button>
      <button @click="isOpen = false">닫기</button>
    </template>
  </BaseModal>
</template>
```

---

## BaseForm

폼 필드 래퍼. 라벨, 에러 메시지, hint 포함.

### Props

| Prop       | 타입        | 기본값     | 설명        |
|------------|-----------|---------|-----------|
| `label`    | `string`  | — (필수)  | 필드 라벨     |
| `error`    | `string`  | `''`    | 에러 메시지    |
| `required` | `boolean` | `false` | 필수 표시 (*) |
| `hint`     | `string`  | `''`    | 힌트 텍스트    |

### Slots

| 슬롯        | 설명                            |
|-----------|-------------------------------|
| `default` | input/select/textarea 등 입력 요소 |

### 사용 예

```vue
<script setup>
import { ref } from 'vue'
import BaseForm from '@/components/common/BaseForm.vue'

const form = ref({ email: '', password: '' })
const errors = ref({})

function validate() {
  errors.value = {}
  if (!form.value.email.includes('@')) {
    errors.value.email = '유효한 이메일을 입력하세요'
  }
  if (form.value.password.length < 8) {
    errors.value.password = '8자 이상이어야 합니다'
  }
}
</script>

<template>
  <form @submit.prevent="validate">
    <BaseForm label="이메일" :error="errors.email" required hint="example@domain.com">
      <input v-model="form.email" type="email" />
    </BaseForm>

    <BaseForm label="비밀번호" :error="errors.password" required>
      <input v-model="form.password" type="password" />
    </BaseForm>

    <button type="submit">제출</button>
  </form>
</template>
```

---

## StatusBadge

상태 색상 배지. 상태에 따라 색상 자동 결정.

### Props

| Prop     | 타입                              | 필수 | 기본값       | 설명                           |
|----------|---------------------------------|----|-----------|------------------------------|
| `status` | `string`                        | ✅  | —         | 상태값 (예: 'PENDING', 'ACTIVE') |
| `type`   | `'order' \| 'asn' \| 'account'` |    | `'order'` | 상태 타입 (색상 테마)                |

### 상태 매핑

**type="order"** (주문 상태):

- `PENDING` → 회색
- `PROCESSING` → 파란색
- `SHIPPED` → 초록색
- `DELIVERED` → 초록색
- `CANCELLED` → 빨강색

**type="asn"** (ASN 상태):

- `DRAFT` → 회색
- `CONFIRMED` → 파란색
- `RECEIVED` → 초록색
- `REJECTED` → 빨강색

**type="account"** (계정 상태):

- `ACTIVE` → 초록색
- `PENDING` → 노랑색
- `SUSPENDED` → 빨강색
- `INACTIVE` → 회색

### 사용 예

```vue
<template>
  <!-- 주문 상태 -->
  <StatusBadge :status="order.status" type="order" />

  <!-- ASN 상태 -->
  <StatusBadge :status="asn.status" type="asn" />

  <!-- 계정 상태 -->
  <StatusBadge :status="user.status" type="account" />
</template>

<script setup>
import StatusBadge from '@/components/common/StatusBadge.vue'
</script>
```

---

## TimelineStepper

단계별 진행 상황을 시간축으로 표시.

### Props

| Prop          | 타입       | 필수 | 설명                  |
|---------------|----------|----|---------------------|
| `steps`       | `Step[]` | ✅  | 단계 배열               |
| `currentStep` | `string` | ✅  | 현재 단계 (step의 key 값) |

### Step 타입 정의

```ts
type Step = {
  key: string          // 단계 고유 식별자
  label: string        // 단계 라벨
  description?: string // (선택) 단계 설명
}
```

### 사용 예

```vue
<script setup>
import TimelineStepper from '@/components/common/TimelineStepper.vue'

const steps = [
  { key: 'PENDING', label: '주문 접수' },
  { key: 'PICKING', label: '상품 피킹' },
  { key: 'PACKING', label: '포장' },
  { key: 'SHIPPED', label: '출고 완료' },
]

// 현재 단계: PICKING
const currentStep = 'PICKING'
</script>

<template>
  <TimelineStepper :steps="steps" :currentStep="currentStep" />
  <!-- 결과: 접수(완료) → 피킹(진행중) → 포장 → 출고완료 -->
</template>
```

---

## FileUpload

드래그앤드롭 + 클릭 파일 업로드.

### Props

| Prop       | 타입        | 기본값            | 설명          |
|------------|-----------|----------------|-------------|
| `accept`   | `string`  | `'.xlsx,.xls'` | 허용 파일 확장자   |
| `multiple` | `boolean` | `false`        | 다중 파일 선택 허용 |
| `disabled` | `boolean` | `false`        | 비활성화        |

### Emits

| 이벤트             | 인자               | 발생 시점    |
|-----------------|------------------|----------|
| `file-selected` | `File \| File[]` | 파일 선택 완료 |

### 사용 예

```vue
<script setup>
import { ref } from 'vue'
import FileUpload from '@/components/common/FileUpload.vue'
import { parseExcel } from '@/utils/excel'

const importedRows = ref([])

async function handleFileSelected(file) {
  try {
    const rows = await parseExcel(file)
    importedRows.value = rows
    console.log(`${rows.length}개 행 임포트됨`)
  } catch (err) {
    console.error('파일 파싱 실패:', err)
  }
}
</script>

<template>
  <FileUpload @file-selected="handleFileSelected" />
</template>
```

---

## ConfirmDialog

삭제/경고 확인 다이얼로그 (BaseModal 래퍼).

### Props

| Prop           | 타입        | 기본값     | 설명             |
|----------------|-----------|---------|----------------|
| `isOpen`       | `boolean` | — (필수)  | 표시 여부          |
| `title`        | `string`  | `'확인'`  | 제목             |
| `message`      | `string`  | — (필수)  | 확인 메시지         |
| `confirmLabel` | `string`  | `'확인'`  | confirm 버튼 텍스트 |
| `cancelLabel`  | `string`  | `'취소'`  | cancel 버튼 텍스트  |
| `danger`       | `boolean` | `false` | 위험 버튼 스타일 (빨강) |

### Emits

| 이벤트       | 발생 시점              |
|-----------|--------------------|
| `confirm` | confirm 버튼 클릭      |
| `cancel`  | cancel 버튼 또는 배경 클릭 |

### 사용 예

```vue
<script setup>
import { ref } from 'vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const showConfirm = ref(false)

async function handleDelete(orderId) {
  showConfirm.value = true
}

async function doDelete() {
  await api.deleteOrder(orderId)
  showConfirm.value = false
  // 목록 새로고침
}
</script>

<template>
  <button @click="handleDelete(order.id)">삭제</button>

  <ConfirmDialog
    :isOpen="showConfirm"
    title="주문 삭제"
    message="이 주문을 삭제하면 복구할 수 없습니다. 계속하시겠습니까?"
    confirmLabel="삭제"
    :danger="true"
    @confirm="doDelete"
    @cancel="showConfirm = false"
  />
</template>
```

---

## ToastMessage

우하단 고정 토스트 알림.

### Props

| Prop                | 타입                                            | 기본값      | 설명                          |
|---------------------|-----------------------------------------------|----------|-----------------------------|
| `visible` (v-model) | `boolean`                                     | — (필수)   | 표시 여부                       |
| `message`           | `string`                                      | — (필수)   | 메시지 텍스트                     |
| `type`              | `'success' \| 'error' \| 'info' \| 'warning'` | `'info'` | 토스트 타입                      |
| `duration`          | `number`                                      | `3500`   | 자동 닫힘 시간(ms). 0 = 자동 닫힘 안 함 |

### 사용 예

```vue
<script setup>
import { ref } from 'vue'
import ToastMessage from '@/components/common/ToastMessage.vue'

const showToast = ref(false)
const toastMsg = ref('')
const toastType = ref('info')

async function handleSave() {
  try {
    await api.saveData(data)
    toastMsg.value = '저장되었습니다'
    toastType.value = 'success'
  } catch (err) {
    toastMsg.value = '저장 실패: ' + err.message
    toastType.value = 'error'
  }
  showToast.value = true
}
</script>

<template>
  <button @click="handleSave">저장</button>

  <ToastMessage
    v-model:visible="showToast"
    :message="toastMsg"
    :type="toastType"
    :duration="3500"
  />
</template>
```

### 진행 중 상태 표시 (자동 닫힘 없음)

```vue
<script setup>
const showProcessing = ref(false)

async function handleLongOperation() {
  showProcessing.value = true  // 시작

  try {
    await api.longRunningOperation()
    // 성공 토스트
    showProcessing.value = false
  } catch {
    showProcessing.value = false
  }
}
</script>

<template>
  <ToastMessage
    v-model:visible="showProcessing"
    message="처리 중..."
    type="info"
    :duration="0"  <!-- 자동 닫힘 없음 -->
  />
</template>
```

---

## EmptyState

빈 상태 / 데이터 없음 표시.

### Props

| Prop          | 타입       | 설명             |
|---------------|----------|----------------|
| `title`       | `string` | 제목 (필수)        |
| `description` | `string` | 설명 (선택)        |
| `icon`        | `string` | 아이콘 emoji (선택) |

### Slots

| 슬롯       | 설명                     |
|----------|------------------------|
| `icon`   | 커스텀 아이콘 (prop icon 대신) |
| `action` | 액션 버튼 영역               |

### 사용 예

```vue
<script setup>
import EmptyState from '@/components/common/EmptyState.vue'

const hasOrders = ref(false)
</script>

<template>
  <div v-if="!hasOrders">
    <EmptyState
      title="주문이 없습니다"
      description="첫 주문을 등록해보세요."
      icon="📦"
    >
      <template #action>
        <button @click="navigateToRegister">주문 등록</button>
      </template>
    </EmptyState>
  </div>
</template>
```

---

## LoadingSpinner

CSS 스피너. 인라인 또는 전체 화면 모드.

### Props

| Prop         | 타입                     | 기본값                 | 설명            |
|--------------|------------------------|---------------------|---------------|
| `size`       | `'sm' \| 'md' \| 'lg'` | `'md'`              | 크기            |
| `fullscreen` | `boolean`              | `false`             | 전체 화면 오버레이    |
| `color`      | `string`               | `'--color-primary'` | CSS 변수 또는 색상값 |

### 사용 예

#### 인라인 스피너

```vue
<template>
  <!-- 작은 스피너 -->
  <LoadingSpinner size="sm" />

  <!-- 중간 스피너 (기본) -->
  <LoadingSpinner />

  <!-- 큰 스피너 -->
  <LoadingSpinner size="lg" />
</template>

<script setup>
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
</script>
```

#### 전체 화면 오버레이

```vue
<script setup>
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <div>
    <!-- 페이지 콘텐츠 -->
    <RouterView />

    <!-- 전역 로딩 오버레이 -->
    <LoadingSpinner v-if="ui.isLoading" fullscreen />
  </div>
</template>
```

---

## 모범 사례

### 1. 정렬 + 페이지네이션 테이블 구성

```vue
<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'

const currentPage = ref(1)
const sortBy = ref('id')
const sortOrder = ref('asc')
const rows = ref([])
const total = ref(0)
const isLoading = ref(false)

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: '이름', sortable: true },
  { key: 'createdAt', label: '생성일', sortable: true },
  { key: 'status', label: '상태' },
]

async function loadData() {
  isLoading.value = true
  try {
    const response = await api.getOrders({
      page: currentPage.value,
      pageSize: 20,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    })
    rows.value = response.data
    total.value = response.total
  } finally {
    isLoading.value = false
  }
}

function handleSort(key) {
  // 같은 컬럼으로 정렬 시 방향 토글
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
  loadData()
}

function handlePageChange(page) {
  currentPage.value = page
  loadData()
}

onMounted(() => loadData())
</script>

<template>
  <BaseTable
    :columns="columns"
    :rows="rows"
    :loading="isLoading"
    :pagination="{ page: currentPage, pageSize: 20, total }"
    @sort="handleSort"
    @page-change="handlePageChange"
  />
</template>
```

### 2. 모달 + 폼 조합

```vue
<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseForm from '@/components/common/BaseForm.vue'

const isOpen = ref(false)
const form = ref({})
const errors = ref({})

function openModal() {
  form.value = {}
  errors.value = {}
  isOpen.value = true
}

async function handleConfirm() {
  // 검증
  if (!form.value.name) {
    errors.value.name = '필수 입력'
    return
  }

  // 저장
  await api.save(form.value)
  isOpen.value = false
}
</script>

<template>
  <button @click="openModal">등록</button>

  <BaseModal title="등록" :isOpen="isOpen" @confirm="handleConfirm" @cancel="isOpen = false">
    <BaseForm label="이름" :error="errors.name" required>
      <input v-model="form.name" />
    </BaseForm>
  </BaseModal>
</template>
```

---

## 관련 문서

- [step-10-components-layout.md](./step-10-components-layout.md) — 레이아웃 컴포넌트
- [step-07-utils.md](./step-07-utils.md) — 유틸리티 함수들
