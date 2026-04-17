<script setup>
/**
 * AccountInvite — 총괄관리자 통합 계정 발급 페이지
 *
 * 3개 사이드바 메뉴가 동일 컴포넌트를 사용:
 *   master-account-invite  → SELLER    (셀러 담당자 계정 발급)
 *   master-account-manager → WH_MANAGER (창고 관리자 계정 발급)
 *   master-account-worker  → WH_WORKER  (창고 작업자 계정 발급)
 *
 * 진입 시 현재 라우트명을 기반으로 역할을 자동 선택.
 * 역할에 따라 소속 조직 셀렉트 목록을 셀러사/창고로 전환.
 */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import { inviteAccount, getSellerList } from '@/api/member'
import { getWarehouseList } from '@/api/wms'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'

const ui = useUiStore()

// ── 역할 정의 ─────────────────────────────────────────────────────────────────
const ROLES = [
  {
    value: 'SELLER',
    label: 'SELLER',
    icon: 'SE',
    desc: '셀러사 전용 계정\n(주문/재고 관리)',
  },
  {
    value: 'WH_MANAGER',
    label: 'WH_MANAGER',
    icon: 'WM',
    desc: '창고 관리자 계정\n(작업 지시 및 관리)',
  },
  {
    value: 'WH_WORKER',
    label: 'WH_WORKER',
    icon: 'WW',
    desc: '창고 작업자 계정\n(하역/검수/적재)',
  },
]

const selectedRole = ref('SELLER')

// ── 폼 ───────────────────────────────────────────────────────────────────────
const form = reactive({
  organizationId: '',
  name:           '',
  email:          '',
  employeeNumber: '',
})

const errors = reactive({
  organizationId: '',
  name:           '',
  email:          '',
  employeeNumber: '',
})

const submitError = ref('')
// 저장 완료 배너 대신 공통 ToastMessage 표시 상태를 사용한다.
const submitSuccess = ref(false)
const organizationLoadError = ref('')

// ── 조직 목록 ─────────────────────────────────────────────────────────────────
const sellers    = ref([])
const warehouses = ref([])

async function loadOrganizations() {
  organizationLoadError.value = ''

  const [sellerResult, warehouseResult] = await Promise.allSettled([
    getSellerList(),
    getWarehouseList(),
  ])

  if (sellerResult.status === 'fulfilled') {
    sellers.value = sellerResult.value.data.data ?? []
  } else {
    sellers.value = []
    organizationLoadError.value = '조직 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    console.error('[AccountInvite] load seller organizations error:', sellerResult.reason)
  }

  if (warehouseResult.status === 'fulfilled') {
    warehouses.value = warehouseResult.value.data.data ?? []
  } else {
    warehouses.value = []
    organizationLoadError.value = '조직 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    console.error('[AccountInvite] load warehouse organizations error:', warehouseResult.reason)
  }
}

const orgOptions = computed(() => {
  if (selectedRole.value === 'SELLER') {
    return sellers.value.map(s => ({ id: s.id, label: `${s.brandNameKo} (${s.customerCode})` }))
  }
  return warehouses.value.map(w => ({ id: w.id, label: w.name }))
})

const selectedWarehouse = computed(() => {
  if (selectedRole.value !== 'WH_WORKER') return null
  return warehouses.value.find((warehouse) => warehouse.id === form.organizationId) ?? null
})

function extractWorkerCodePrefix(warehouse) {
  const code = String(warehouse?.code ?? '').trim().toUpperCase()
  const name = String(warehouse?.name ?? '').trim().toUpperCase()

  const codeMatch = code.match(/^WH-([A-Z0-9]+)-/)
  if (codeMatch) {
    return `${codeMatch[1]}-`
  }

  const nameMatch = name.match(/^([A-Z0-9]+)(?:[\s_-]|$)/)
  if (nameMatch) {
    return `${nameMatch[1]}-`
  }

  return ''
}

const workerCodePrefix = computed(() => extractWorkerCodePrefix(selectedWarehouse.value))

const issuedWorkerCode = computed(() => {
  if (selectedRole.value !== 'WH_WORKER') return ''
  const suffix = String(form.employeeNumber ?? '').trim().toUpperCase()
  if (!suffix) return workerCodePrefix.value
  return `${workerCodePrefix.value}${suffix}`
})

const orgPlaceholder = computed(() =>
  selectedRole.value === 'SELLER' ? '셀러사 선택' : '창고 선택'
)

const organizationEmptyMessage = computed(() => {
  if (selectedRole.value === 'SELLER') {
    return '등록된 셀러사가 없습니다. 셀러 등록 후 계정을 발급해주세요.'
  }
  return '등록된 창고가 없습니다. 창고 등록 후 계정을 발급해주세요.'
})

// 역할 변경 시 조직 선택 및 에러 초기화
watch(selectedRole, () => { 
  form.organizationId = ''
  form.email = ''
  form.employeeNumber = ''
  Object.keys(errors).forEach(k => (errors[k] = ''))
})

watch(() => form.organizationId, () => {
  if (selectedRole.value !== 'WH_WORKER') return
  errors.employeeNumber = ''
})

watch(() => form.employeeNumber, (value) => {
  if (selectedRole.value !== 'WH_WORKER') return

  const prefix = workerCodePrefix.value
  let normalized = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '')

  if (prefix && normalized.startsWith(prefix)) {
    normalized = normalized.slice(prefix.length)
  }

  if (normalized !== value) {
    form.employeeNumber = normalized
  }
})

// ── 페이지 타이틀 / 브레드크럼 ────────────────────────────────────────────────
const pageTitle = computed(() => {
  if (selectedRole.value === 'WH_MANAGER') return '창고 관리자 계정 발급'
  if (selectedRole.value === 'WH_WORKER')  return '창고 작업자 계정 발급'
  return '셀러 담당자 계정 발급'
})

const breadcrumb = computed(() => [
  { label: '계정 발급' },
  { label: pageTitle.value },
])

// ── 유효성 검사 ───────────────────────────────────────────────────────────────
function validate() {
  errors.organizationId = form.organizationId ? '' : '소속 조직을 선택해주세요.'
  errors.name           = form.name.trim()    ? '' : '이름을 입력해주세요.'
  
  if (selectedRole.value === 'WH_WORKER') {
    errors.email = ''
    if (!form.organizationId) {
      errors.employeeNumber = '창고를 먼저 선택해주세요.'
    } else {
      errors.employeeNumber = form.employeeNumber.trim() ? '' : '사번을 입력해주세요.'
    }
  } else {
    errors.employeeNumber = ''
    errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? '' : '유효한 이메일 주소를 입력해주세요.'
  }

  return !Object.values(errors).some(Boolean)
}

function resetForm() {
  form.organizationId = ''
  form.name           = ''
  form.email          = ''
  form.employeeNumber = ''
  Object.keys(errors).forEach(k => (errors[k] = ''))
  submitError.value   = ''
}

// ── 제출 ─────────────────────────────────────────────────────────────────────
async function submitForm() {
  submitError.value   = ''
  submitSuccess.value = false
  if (!validate()) return

  ui.setLoading(true)
  try {
    const payload = {
      role:           selectedRole.value,
      organizationId: form.organizationId,
      name:           form.name,
    }

    if (selectedRole.value === 'WH_WORKER') {
      payload.employeeNumber = issuedWorkerCode.value
    } else {
      payload.email = form.email
    }

    await inviteAccount(payload)
    submitSuccess.value = true
    resetForm()
  } catch (err) {
    const responseMessage = err.response?.data?.data?.message || err.response?.data?.message

    if (err.response?.status === 409) {
      submitError.value = responseMessage || '이미 사용 중인 이메일 또는 사번입니다.'
    } else if (err.response?.status === 400) {
      submitError.value = responseMessage || '선택한 소속 조직이 유효하지 않습니다.'
    } else if (err.response?.status === 403) {
      submitError.value = responseMessage || '현재 권한으로는 해당 계정을 발급할 수 없습니다.'
    } else {
      submitError.value = '초대 메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }
    console.error('[AccountInvite] submitForm error:', err)
  } finally {
    ui.setLoading(false)
  }
}

onMounted(loadOrganizations)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" :title="pageTitle" :loading="ui.isLoading">
    <!-- 공통 성공 토스트: 초대 메일 발송 성공 시 자동으로 닫힌다. -->
    <ToastMessage
      v-model:visible="submitSuccess"
      message="초대 메일이 성공적으로 발송되었습니다."
      type="success"
    />

    <div class="ai-page">

      <!-- ── 등록 폼 카드 ── -->
      <div class="form-card">
        <div class="form-card-header">
          <span class="form-card-title">신규 사용자 초대</span>
        </div>

        <div class="form-body">

          <!-- Step 1: 역할 선택 -->
          <div class="form-section">
            <div class="form-section-title">1. 역할(Role) 선택</div>
            <div class="role-radio-group">
              <label
                v-for="roleItem in ROLES"
                :key="roleItem.value"
                class="role-radio-item"
                @click="selectedRole = roleItem.value"
              >
                <div
                  class="role-card"
                  :class="{ 'role-card--selected': selectedRole === roleItem.value }"
                >
                  <span class="role-icon">{{ roleItem.icon }}</span>
                  <span class="role-name">{{ roleItem.label }}</span>
                  <span class="role-desc">{{ roleItem.desc }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Step 2: 소속 조직 매핑 -->
          <div class="form-section">
            <div class="form-section-title">2. 소속 조직 매핑</div>
            <p v-if="organizationLoadError" class="submit-error organization-error" role="alert">
              {{ organizationLoadError }}
            </p>
            <div class="form-row">
              <BaseForm label="셀러사 / 창고 선택" :error="errors.organizationId" required>
                <select v-model="form.organizationId">
                  <option value="">{{ orgPlaceholder }}</option>
                  <option
                    v-for="opt in orgOptions"
                    :key="opt.id"
                    :value="opt.id"
                  >{{ opt.label }}</option>
                </select>
              </BaseForm>
            </div>
            <p v-if="!orgOptions.length && !organizationLoadError" class="org-empty-message">
              {{ organizationEmptyMessage }}
            </p>
          </div>

          <!-- Step 3: 사용자 정보 입력 -->
          <div class="form-section">
            <div class="form-section-title">3. 사용자 정보 입력</div>
            <div class="form-row">
              <BaseForm label="이름" :error="errors.name" required>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="실명을 입력하세요"
                />
              </BaseForm>

              <BaseForm
                v-if="selectedRole !== 'WH_WORKER'"
                label="이메일 (ID)"
                :error="errors.email"
                hint="초대 메일을 받을 주소"
                required
              >
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="user@company.com"
                />
              </BaseForm>

              <BaseForm
                v-else
                label="사번 입력"
                :error="errors.employeeNumber"
                hint="창고 접두사를 제외한 사번만 입력하세요."
                required
              >
                <input
                  v-model="form.employeeNumber"
                  type="text"
                  :placeholder="workerCodePrefix ? `${workerCodePrefix} 뒤에 붙을 사번` : '먼저 창고를 선택하세요'"
                  :disabled="!workerCodePrefix"
                />
              </BaseForm>
            </div>

            <div v-if="selectedRole === 'WH_WORKER'" class="form-row">
              <BaseForm
                label="발급 사번 ID"
                hint="실제 로그인에 사용될 최종 작업자 ID입니다."
              >
                <input
                  :value="issuedWorkerCode || workerCodePrefix || '창고를 선택해주세요.'"
                  type="text"
                  readonly
                  class="readonly-worker-code"
                />
              </BaseForm>
            </div>
          </div>

        </div><!-- /form-body -->

        <!-- 폼 푸터 -->
        <div class="form-footer">
          <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>
          <div class="footer-actions">
            <button class="ui-btn ui-btn--ghost" type="button" @click="resetForm">초기화</button>
            <button class="ui-btn ui-btn--gold"  type="button" @click="submitForm">{{ selectedRole === 'WH_WORKER' ? '계정 발급' : '초대 메일 발송' }}</button>
          </div>
        </div>
      </div><!-- /form-card -->

      <!-- ── 가이드 패널 ── -->
      <div class="guide-panel">
        <div class="guide-card">
          <div class="guide-card-header">발급 프로세스 안내</div>
          <div class="guide-card-body">
            <p v-if="selectedRole !== 'WH_WORKER'" class="guide-desc">
              발급 버튼을 클릭하면 입력한 이메일로 <strong>임시 비밀번호</strong>와 접속 링크가 발송됩니다.
            </p>
            <p v-else class="guide-desc">
              작업자 계정은 사번을 ID로 하여 즉시 발급됩니다. 초기 비밀번호는 별도 가이드를 참고하세요.
            </p>
            <p class="guide-desc" style="margin-top:10px;">
              사용자는 최초 로그인 후 비밀번호를 변경해야 하며, 변경이 완료되면 계정이 최종 활성화됩니다.
            </p>
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-header">역할별 접근 범위</div>
          <div class="guide-card-body">
            <div class="role-desc-list">
              <div class="role-desc-item">
                <span class="role-badge role-badge--seller">SELLER</span>
                <span class="role-desc-text">주문 등록, 재고 조회, ASN 관리</span>
              </div>
              <div class="role-desc-item">
                <span class="role-badge role-badge--manager">WH_MANAGER</span>
                <span class="role-desc-text">창고 운영 전반, 작업 지시, 출고 확정</span>
              </div>
              <div class="role-desc-item">
                <span class="role-badge role-badge--worker">WH_WORKER</span>
                <span class="role-desc-text">하역·검수·피킹·패킹 현장 작업</span>
              </div>
            </div>
          </div>
        </div>
      </div><!-- /guide-panel -->

    </div>
  </AppLayout>
</template>

<style scoped>
.ai-page {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

/* ── 폼 카드 ── */
.form-card {
  flex: 1;
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.form-card-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}

.form-card-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--t1); }

/* ── 폼 본문 ── */
.form-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--t2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-row > :only-child { grid-column: 1 / -1; }

.readonly-worker-code {
  background: var(--surface-2);
  color: var(--t1);
  font-weight: 700;
  letter-spacing: 0.04em;
}

/* ── 역할 라디오 카드 ── */
.role-radio-group {
  display: flex;
  gap: 12px;
}

.role-radio-item {
  flex: 1;
  cursor: pointer;
}

.role-card {
  padding: 16px;
  border: 1.5px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
  user-select: none;
}

.role-card:hover { border-color: var(--border-dk, #C4CCE0); }

.role-card--selected {
  border-color: var(--gold);
  background: var(--gold-pale);
}

.role-icon {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: var(--t2);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 4px;
  width: 40px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.role-card--selected .role-icon {
  background: var(--gold);
  border-color: var(--gold);
  color: #fff;
}

.role-name {
  font-family: 'Barlow', sans-serif;
  font-weight: 700;
  font-size: 13px;
  color: var(--t1);
}

.role-desc {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: var(--t3);
  line-height: 1.5;
  white-space: pre-line;
}

/* ── 폼 푸터 ── */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: var(--surface-2);
  flex-wrap: wrap;
}

.submit-error { flex: 1; font-size: var(--font-size-xs); color: var(--red); }
.organization-error {
  margin: 0;
}
.org-empty-message {
  margin: -4px 0 0;
  font-size: var(--font-size-xs);
  color: var(--t3);
}
.footer-actions { display: flex; gap: 10px; }

.ui-btn--gold {
  background: var(--gold);
  border: none;
  color: var(--t1);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(245,166,35,0.3);
}

/* ── 가이드 패널 ── */
.guide-panel {
  width: 360px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guide-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.guide-card-header {
  padding: 14px 18px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  font-family: 'Barlow', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--t1);
}

.guide-card-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-desc { font-size: var(--font-size-sm); color: var(--t2); line-height: 1.6; }
.guide-desc strong { color: var(--t1); font-weight: 600; }

.role-desc-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-desc-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 3px;
  font-family: 'Barlow', sans-serif;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex-shrink: 0;
}

.role-badge--seller  { background: var(--gold-pale);   color: #92400E; }
.role-badge--manager { background: var(--blue-pale);   color: var(--blue); }
.role-badge--worker  { background: var(--purple-pale); color: var(--purple); }

.role-desc-text {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--t3);
  line-height: 1.5;
}
</style>
