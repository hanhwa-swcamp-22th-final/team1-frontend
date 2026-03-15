# 유틸리티 함수 레퍼런스

> **한 줄 요약**: 데이터 포맷팅, 입력값 검증, Excel 작업, 로컬스토리지 작업을 위한 헬퍼 함수 모음.

## 목차 (Table of Contents)
- [파일 구조](#파일-구조)
- [format.js](#formatjs)
- [validate.js](#validatejs)
- [excel.js](#exceljs)
- [storage.js](#storagejs)
- [사용 패턴](#사용-패턴)

---

## 파일 구조

```
src/utils/
├── format.js    ← 표시값 포맷 (날짜, 통화, 무게, 숫자)
├── validate.js  ← 입력값 유효성 검사 (이메일, 비밀번호, SKU)
├── excel.js     ← Excel 파싱/다운로드
└── storage.js   ← localStorage/sessionStorage 헬퍼
```

---

## format.js

### formatDate(date, pattern?)

날짜/시간을 지정된 패턴으로 포맷.

```js
import { formatDate } from '@/utils/format'
```

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `date` | `Date \| string \| number \| null` | — (필수) | ISO 문자열, Unix 타임스탬프, Date 객체 |
| `pattern` | `'date' \| 'datetime' \| 'time'` | `'date'` | 출력 형식 |

#### 사용 예

```js
formatDate('2026-03-15')                        // '2026-03-15'
formatDate('2026-03-15T09:30:00')               // '2026-03-15'
formatDate('2026-03-15T09:30:00', 'datetime')   // '2026-03-15 09:30'
formatDate('2026-03-15T09:30:00', 'time')       // '09:30'
formatDate(new Date('2026-03-15'))              // '2026-03-15'
formatDate(1647340800000)                       // '2026-03-15'
formatDate(null)                                // '-'
formatDate('invalid')                           // '-'
```

---

### formatCurrency(amount)

금액을 미국 달러 형식으로 포맷.

```js
import { formatCurrency } from '@/utils/format'
```

| 매개변수 | 타입 | 설명 |
|---|---|---|
| `amount` | `number \| null` | USD 단위 숫자 |

#### 사용 예

```js
formatCurrency(1234.56)     // '$1,234.56'
formatCurrency(1234567.89)  // '$1,234,567.89'
formatCurrency(0)           // '$0.00'
formatCurrency(0.99)        // '$0.99'
formatCurrency(null)        // '-'
```

#### 템플릿에서의 사용

```vue
<template>
  <p>가격: {{ formatCurrency(product.price) }}</p>
  <p>합계: {{ formatCurrency(total) }}</p>
</template>

<script setup>
import { formatCurrency } from '@/utils/format'
</script>
```

---

### formatWeight(grams)

무게를 g/kg으로 변환하여 포맷.

```js
import { formatWeight } from '@/utils/format'
```

| 매개변수 | 타입 | 설명 |
|---|---|---|
| `grams` | `number \| null` | 그램(g) 단위 |

#### 규칙
- 1000g 미만: `{n} g`
- 1000g 이상: `{n.00} kg` (소수점 2자리)

#### 사용 예

```js
formatWeight(500)      // '500 g'
formatWeight(999)      // '999 g'
formatWeight(1000)     // '1.00 kg'
formatWeight(1234)     // '1.23 kg'
formatWeight(5678)     // '5.68 kg'
formatWeight(null)     // '-'
```

---

### formatNumber(num)

숫자를 3자리마다 쉼표로 구분.

```js
import { formatNumber } from '@/utils/format'
```

| 매개변수 | 타입 | 설명 |
|---|---|---|
| `num` | `number \| null` | 정수 또는 소수 |

#### 사용 예

```js
formatNumber(1234567)      // '1,234,567'
formatNumber(100)          // '100'
formatNumber(0)            // '0'
formatNumber(1234.56)      // '1,234.56'  (소수점도 포함)
formatNumber(null)         // '-'
```

---

## validate.js

### validateEmail(email)

이메일 형식 유효성 검사.

```js
import { validateEmail } from '@/utils/validate'
```

| 매개변수 | 타입 | 설명 |
|---|---|---|
| `email` | `string` | 이메일 주소 |

**규칙**: 표준 이메일 정규식 (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)

#### 사용 예

```js
validateEmail('user@example.com')   // true
validateEmail('john.doe@company.co.kr')  // true
validateEmail('user@')              // false
validateEmail('user.example.com')   // false (@ 없음)
validateEmail('')                   // false
validateEmail('  ')                 // false
```

#### 폼 검증에서의 사용

```vue
<script setup>
import { validateEmail } from '@/utils/validate'

const email = ref('')
const emailError = ref('')

function checkEmail() {
  if (!validateEmail(email.value)) {
    emailError.value = '유효한 이메일을 입력하세요'
    return false
  }
  emailError.value = ''
  return true
}
</script>

<template>
  <BaseForm label="이메일" :error="emailError" required>
    <input v-model="email" type="email" @blur="checkEmail" />
  </BaseForm>
</template>
```

---

### validatePassword(password)

비밀번호 정책 검증.

```js
import { validatePassword } from '@/utils/validate'
```

| 매개변수 | 타입 | 설명 |
|---|---|---|
| `password` | `string` | 비밀번호 |

**규칙**:
- 최소 8자
- 소문자 포함 (a-z)
- 대문자 포함 (A-Z)
- 숫자 포함 (0-9)
- 특수문자 포함 (!@#$%^&* 등)

#### 사용 예

```js
validatePassword('Abcd1234!')     // true
validatePassword('password')      // false (대문자·숫자·특수문자 없음)
validatePassword('Password1')     // false (특수문자 없음)
validatePassword('Pass1!')        // false (8자 미만)
validatePassword('Abc1!')         // false (7자, 너무 짧음)
```

#### 폼 검증 시나리오

```vue
<script setup>
import { validatePassword } from '@/utils/validate'

const password = ref('')
const confirmPassword = ref('')
const errors = ref({})

function validateForm() {
  errors.value = {}

  if (!validatePassword(password.value)) {
    errors.value.password =
      '비밀번호는 8자 이상이며 대소문자, 숫자, 특수문자를 포함해야 합니다'
  }

  if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = '비밀번호가 일치하지 않습니다'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return

  await api.resetPassword({ password: password.value })
}
</script>
```

---

### validateSku(sku)

SKU(Stock Keeping Unit) 형식 검증.

```js
import { validateSku } from '@/utils/validate'
```

| 매개변수 | 타입 | 설명 |
|---|---|---|
| `sku` | `string` | SKU 코드 |

**규칙**:
- 길이: 4~32자
- 문자: 영문자(대소 구분 없음), 숫자, 하이픈(`-`)만 허용
- 공백·특수문자 불가

#### 사용 예

```js
validateSku('SKU-001')         // true
validateSku('PROD-A123-XL')    // true
validateSku('SKU-001-BLK')     // true
validateSku('AB')              // false (4자 미만)
validateSku('A')               // false (1자)
validateSku('SKU 001')         // false (공백)
validateSku('SKU@001')         // false (특수문자)
validateSku('SKU-0001-XXXXX-XXXXX-XXXXX')  // false (32자 초과)
```

#### 대량 업로드 검증 예

```vue
<script setup>
import { validateSku, parseExcel } from '@/utils'

const skuErrors = ref([])

async function handleExcelUpload(file) {
  const rows = await parseExcel(file)
  skuErrors.value = []

  rows.forEach((row, index) => {
    if (!validateSku(row.sku)) {
      skuErrors.value.push({
        row: index + 2,  // 헤더 포함
        sku: row.sku,
        message: 'SKU 형식이 유효하지 않습니다 (4~32자, 영문/숫자/하이픈만 허용)'
      })
    }
  })

  if (skuErrors.value.length > 0) {
    return false
  }

  // 검증 통과: 다음 단계 진행
  return true
}
</script>
```

---

## excel.js

### parseExcel(file)

Excel 파일을 JSON 배열로 파싱.

```js
import { parseExcel } from '@/utils/excel'
```

| 매개변수 | 타입 | 설명 |
|---|---|---|
| `file` | `File` | input[type="file"]에서 선택한 파일 |

**반환**: `Promise<Array<Object>>` — 첫 번째 시트의 행 배열 (헤더를 키로 변환)

#### 사용 예

```js
// 파일 선택
const file = event.target.files[0]

// 파싱
const rows = await parseExcel(file)

// 결과 구조
// [
//   { SKU: 'SKU-001', '수량': 100, '단가': 50.00 },
//   { SKU: 'SKU-002', '수량': 200, '단가': 75.50 },
// ]
```

#### 컴포넌트 예제

```vue
<script setup>
import { parseExcel } from '@/utils/excel'

const importedRows = ref([])

async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    importedRows.value = await parseExcel(file)
    console.log(`${importedRows.value.length}개 행 임포트됨`)
  } catch (err) {
    console.error('파일 파싱 실패:', err)
  }
}
</script>

<template>
  <input type="file" accept=".xlsx,.xls" @change="handleFileUpload" />
  <p>총 {{ importedRows.length }}개 행</p>
</template>
```

---

### downloadExcel(rows, filename?)

JSON 배열을 Excel 파일로 다운로드.

```js
import { downloadExcel } from '@/utils/excel'
```

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `rows` | `Array<Object>` | — (필수) | 행 배열 |
| `filename` | `string` | `'export'` | 다운로드 파일명 (`.xlsx` 자동 추가) |

#### 사용 예

```js
// 기본 사용
const orders = [
  { id: 'ORD-001', name: '철수', qty: 5 },
  { id: 'ORD-002', name: '영희', qty: 3 },
]
downloadExcel(orders)  // → 'export.xlsx' 다운로드

// 파일명 지정
downloadExcel(orders, '주문목록_2026-03-15')  // → '주문목록_2026-03-15.xlsx'

// 이미 .xlsx 확장자 포함 시 중복 추가 안 함
downloadExcel(orders, '주문목록.xlsx')  // → '주문목록.xlsx' (중복 X)
```

#### 내보내기 버튼 예제

```vue
<script setup>
import { downloadExcel } from '@/utils/excel'

const orders = ref([])

async function exportOrders() {
  // 데이터 조회
  const response = await api.getOrders()
  const exportData = response.data.map(order => ({
    '주문번호': order.id,
    '고객명': order.customerName,
    '수량': order.quantity,
    '총액': order.totalAmount,
    '상태': order.status,
    '주문일': formatDate(order.createdAt),
  }))

  // 다운로드
  downloadExcel(exportData, `주문목록_${formatDate(new Date())}`)
}
</script>

<template>
  <button @click="exportOrders">주문 목록 내보내기</button>
</template>
```

#### ⚠️ 성능 주의사항

- **파일 크기 문제**: 5MB 이상은 주의
- **행 수 제한**: 10만 행 초과 시 브라우저 메모리 부족 가능
- **대용량 처리**: 페이지네이션하여 나누어 다운로드 권장

```js
// ❌ 위험: 100만 행 일괄 다운로드
const allRows = await api.getAllRows()  // 메모리 부족
downloadExcel(allRows, 'huge-file')

// ✅ 안전: 페이지 단위로 나누어 다운로드
for (let page = 1; page <= totalPages; page++) {
  const pageRows = await api.getRowsByPage(page)
  downloadExcel(pageRows, `data-page-${page}`)
}
```

---

## storage.js

localStorage/sessionStorage 헬퍼 모듈.

```js
import { ls, ss } from '@/utils/storage'
```

### ls (localStorage)

| 메서드 | 설명 |
|---|---|
| `ls.set(key, value)` | 값 저장 (JSON 자동 직렬화) |
| `ls.get(key)` | 값 조회 (JSON 자동 역직렬화, 없으면 null) |
| `ls.remove(key)` | 값 삭제 |

```js
// 저장
ls.set('user-prefs', { theme: 'dark', language: 'ko' })

// 조회
const prefs = ls.get('user-prefs')  // { theme: 'dark', language: 'ko' }

// 삭제
ls.remove('user-prefs')
```

### ss (sessionStorage)

| 메서드 | 설명 |
|---|---|
| `ss.set(key, value)` | 값 저장 |
| `ss.get(key)` | 값 조회 |
| `ss.remove(key)` | 값 삭제 |

```js
// 임시 폼 데이터 저장 (탭 닫으면 자동 삭제)
ss.set('draft-form', { name: '홍길동', email: 'hong@example.com' })

// 탭 재로드 후 복원
const draft = ss.get('draft-form')
if (draft) {
  form.value = draft
}
```

### ls vs ss 비교

| 구분 | localStorage | sessionStorage |
|---|---|---|
| 저장 위치 | 브라우저 로컬 저장소 | 메모리 (탭별) |
| 유지 기간 | 브라우저 닫아도 유지 | 탭 닫으면 삭제 |
| 용도 | 사용자 설정, 환경 설정 | 임시 폼 데이터, 세션 정보 |
| 예시 | 테마, 언어, 사이드바 접힘 | 입력 중인 폼, 검색 필터 |

### ⚠️ Pinia persist와의 차이

```js
// ❌ 금지: Pinia persist 키를 직접 수정
ls.set('conk-auth', { ... })      // 직접 수정 금지
ls.set('conk-warehouse', { ... })  // 직접 수정 금지

// ✅ 올바른 방식: Pinia 스토어를 통해 수정
const auth = useAuthStore()
auth.setAuth({ ... })

const warehouse = useWarehouseStore()
warehouse.setWarehouse({ ... })
```

---

## 사용 패턴

### 폼 검증 + 제출 패턴

```vue
<script setup>
import { validateEmail, validatePassword } from '@/utils/validate'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const form = ref({ email: '', password: '' })
const errors = ref({})

function validateForm() {
  errors.value = {}

  if (!validateEmail(form.value.email)) {
    errors.value.email = '유효한 이메일을 입력하세요'
  }

  if (!validatePassword(form.value.password)) {
    errors.value.password = '올바른 비밀번호 형식이 아닙니다'
  }

  return Object.keys(errors.value).length === 0
}

async function submit() {
  if (!validateForm()) return

  const response = await api.login(form.value)
  auth.setAuth(response.data)
}
</script>

<template>
  <form @submit.prevent="submit">
    <BaseForm label="이메일" :error="errors.email" required>
      <input v-model="form.email" type="email" />
    </BaseForm>
    <BaseForm label="비밀번호" :error="errors.password" required>
      <input v-model="form.password" type="password" />
    </BaseForm>
    <button type="submit">로그인</button>
  </form>
</template>
```

### 날짜 + 통화 포맷 패턴

```vue
<script setup>
import { formatDate, formatCurrency } from '@/utils/format'

const orders = ref([])

onMounted(async () => {
  const response = await api.getOrders()
  orders.value = response.data
})
</script>

<template>
  <BaseTable :columns="[
    { key: 'id', label: '주문번호' },
    { key: 'createdAt', label: '주문일' },
    { key: 'totalAmount', label: '합계' },
    { key: 'status', label: '상태' },
  ]" :rows="orders">
    <template #cell-createdAt="{ value }">
      {{ formatDate(value, 'datetime') }}
    </template>
    <template #cell-totalAmount="{ value }">
      {{ formatCurrency(value) }}
    </template>
  </BaseTable>
</template>
```

### 대량 임포트 + 검증 패턴

```vue
<script setup>
import { parseExcel } from '@/utils/excel'
import { validateSku } from '@/utils/validate'

const importedRows = ref([])
const validationErrors = ref([])

async function handleFileUpload(file) {
  try {
    importedRows.value = await parseExcel(file)
    validationErrors.value = []

    // 각 행 검증
    importedRows.value.forEach((row, idx) => {
      if (!validateSku(row.sku)) {
        validationErrors.value.push({
          row: idx + 2,  // 헤더 포함
          message: `SKU 형식 오류: "${row.sku}"`
        })
      }
    })

    if (validationErrors.value.length === 0) {
      // 모든 행 검증 통과
      await api.importRows(importedRows.value)
      showToast('임포트 완료', 'success')
    }
  } catch (err) {
    console.error('파일 처리 실패:', err)
  }
}
</script>
```

---

## 관련 문서
- [step-06-stores.md](./step-06-stores.md) — localStorage를 통한 Pinia persist
- [step-09-components-common.md](./step-09-components-common.md) — BaseForm 컴포넌트
