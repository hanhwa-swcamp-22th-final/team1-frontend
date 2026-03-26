<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDate, formatNumber } from '@/utils/format'
import { ROUTE_NAMES } from '@/constants'
import { createCompanyLog, createUser, getCompanies, getUsers, updateCompany, updateUser } from '@/api/member'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const ui = useUiStore()
const breadcrumb = [{ label: '플랫폼 관리' }, { label: '업체 관리' }, { label: '업체 목록' }]
const page = ref(1)
const PAGE_SIZE = 8
const sortState = reactive({ key: 'createdAt', direction: 'desc' })
const filters = reactive({ search: '', status: 'ALL' })
const companies = ref([])
const users = ref([])

const inviteModal = reactive({ open: false, company: null, name: '', email: '', error: '' })
const statusModal = reactive({ open: false, company: null, mode: 'INACTIVE' })

const columns = [
  { key: 'name', label: '업체명', sortable: true, align: 'center', width: '20%' },
  { key: 'tenantCode', label: '테넌트 코드', align: 'center', width: '15%' },
  { key: 'status', label: '상태', sortable: true, align: 'center', width: '10%' },
  { key: 'createdAt', label: '등록일', sortable: true, align: 'center', width: '12%' },
  { key: 'warehouseCount', label: '소속 창고 수', align: 'center', width: '10%' },
  { key: 'sellerCount', label: '등록 셀러 회사 수', align: 'center', width: '12%' },
  { key: 'userCount', label: '총 사용자 수', align: 'center', width: '10%' },
  { key: 'actions', label: '관리', align: 'center', width: '18%' },
]

async function fetchAll() {
  ui.setLoading(true)
  try {
    const [companyRes, userRes] = await Promise.all([getCompanies(), getUsers()])
    companies.value = companyRes.data
    users.value = userRes.data
  } finally {
    ui.setLoading(false)
  }
}

onMounted(fetchAll)
watch(() => [filters.search, filters.status], () => {
  page.value = 1
})

const summaryCards = computed(() => [
  { label: '등록 업체 수', value: companies.value.length, sub: '전체 3PL 테넌트' },
  { label: '설정중', value: companies.value.filter((item) => item.status === 'SETTING').length, sub: '최초 비밀번호 설정 대기' },
  { label: '활성', value: companies.value.filter((item) => item.status === 'ACTIVE').length, sub: '로그인 허용 상태' },
  { label: '비활성', value: companies.value.filter((item) => item.status === 'INACTIVE').length, sub: '접근 차단 상태' },
])

const filteredRows = computed(() => {
  const query = filters.search.trim().toLowerCase()
  return companies.value.filter((company) => {
    const statusOk = filters.status === 'ALL' || company.status === filters.status
    const searchOk = !query || [company.name, company.tenantCode, formatDate(company.createdAt)].join(' ').toLowerCase().includes(query)
    return statusOk && searchOk
  })
})

const sortedRows = computed(() => {
  const rows = [...filteredRows.value]
  const { key, direction } = sortState
  rows.sort((a, b) => {
    let left = a[key]
    let right = b[key]
    if (key === 'createdAt') {
      left = new Date(left).getTime()
      right = new Date(right).getTime()
    }
    if (typeof left === 'string') left = left.toLowerCase()
    if (typeof right === 'string') right = right.toLowerCase()
    if (left < right) return direction === 'asc' ? -1 : 1
    if (left > right) return direction === 'asc' ? 1 : -1
    return 0
  })
  return rows
})

const paginatedRows = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return sortedRows.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({ page: page.value, pageSize: PAGE_SIZE, total: sortedRows.value.length }))

function onSort(key) {
  if (sortState.key === key) sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
  else {
    sortState.key = key
    sortState.direction = key === 'createdAt' ? 'desc' : 'asc'
  }
}

function statusLabel(status) {
  return { ACTIVE: '활성', SETTING: '설정중', INACTIVE: '비활성' }[status] ?? status
}
function statusClass(status) {
  return {
    ACTIVE: 'chip chip--green',
    SETTING: 'chip chip--amber',
    INACTIVE: 'chip chip--red',
  }[status] ?? 'chip'
}

function openInvite(company) {
  inviteModal.open = true
  inviteModal.company = company
  inviteModal.name = ''
  inviteModal.email = ''
  inviteModal.error = ''
}

async function submitInvite() {
  if (!inviteModal.name.trim() || !inviteModal.email.trim()) {
    inviteModal.error = '이름과 이메일을 입력해주세요.'
    return
  }
  const nextId = Math.max(0, ...users.value.map((item) => Number(item.id) || 0)) + 1
  const payload = {
    id: nextId,
    companyId: inviteModal.company.id,
    name: inviteModal.name.trim(),
    email: inviteModal.email.trim(),
    role: 'MASTER_ADMIN',
    organization: inviteModal.company.name,
    warehouse: '-',
    status: 'INVITE_PENDING',
    registeredAt: new Date().toISOString(),
    lastLoginAt: null,
    wasActiveBeforeCompanyInactivation: false,
  }
  ui.setLoading(true)
  try {
    await createUser(payload)
    await updateCompany(inviteModal.company.id, { userCount: Number(inviteModal.company.userCount || 0) + 1 })
    await createCompanyLog({ id: Date.now(), companyId: inviteModal.company.id, at: new Date().toISOString(), actor: 'sys.admin@conk.com', action: '총괄 관리자 추가 발급' })
    inviteModal.open = false
    await fetchAll()
  } finally {
    ui.setLoading(false)
  }
}

function openStatusModal(company, mode) {
  statusModal.open = true
  statusModal.company = company
  statusModal.mode = mode
}

async function confirmStatusChange() {
  const company = statusModal.company
  const mode = statusModal.mode
  ui.setLoading(true)
  try {
    await updateCompany(company.id, { status: mode })
    const relatedUsers = users.value.filter((item) => item.companyId === company.id)
    await Promise.all(
      relatedUsers.map((user) => {
        if (mode === 'INACTIVE') {
          return updateUser(user.id, {
            status: 'INACTIVE',
            wasActiveBeforeCompanyInactivation: user.status === 'ACTIVE' || user.status === 'LOCKED',
          })
        }
        if (mode === 'ACTIVE') {
          const nextStatus = user.wasActiveBeforeCompanyInactivation ? 'ACTIVE' : user.status
          return updateUser(user.id, { status: nextStatus })
        }
        return Promise.resolve()
      })
    )
    await createCompanyLog({
      id: Date.now(),
      companyId: company.id,
      at: new Date().toISOString(),
      actor: 'sys.admin@conk.com',
      action: mode === 'INACTIVE' ? '업체 비활성화' : '업체 재활성화',
    })
    statusModal.open = false
    await fetchAll()
  } finally {
    ui.setLoading(false)
  }
}

const selectedCompanyUsers = computed(() => users.value.filter((item) => item.companyId === statusModal.company?.id))
const activeMasterAdminCount = computed(() => users.value.filter((item) => item.companyId === inviteModal.company?.id && item.role === 'MASTER_ADMIN' && item.status === 'ACTIVE').length)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="업체 목록">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost" type="button" @click="router.push({ name: ROUTE_NAMES.SYS_USER_ACCOUNT_LIST })">전체 사용자</button>
      <button class="ui-btn ui-btn--gold" type="button" @click="router.push({ name: ROUTE_NAMES.SYS_COMPANY_REGISTER })">3PL 업체 등록</button>
    </template>

    <LoadingSpinner v-if="ui.isLoading" fullscreen />

    <div class="page-grid">
      <section class="summary-row">
        <article v-for="card in summaryCards" :key="card.label" class="summary-card">
          <p class="summary-label">{{ card.label }}</p>
          <strong class="summary-value">{{ formatNumber(card.value) }}</strong>
          <p class="summary-sub">{{ card.sub }}</p>
        </article>
      </section>

      <section class="panel">
        <div class="filter-row">
          <BaseForm label="검색">
            <input v-model="filters.search" type="text" placeholder="업체명 / 테넌트 코드 / 등록일 검색" />
          </BaseForm>
          <BaseForm label="상태">
            <select v-model="filters.status">
              <option value="ALL">전체</option>
              <option value="SETTING">설정중</option>
              <option value="ACTIVE">활성</option>
              <option value="INACTIVE">비활성</option>
            </select>
          </BaseForm>
        </div>

        <BaseTable :columns="columns" :pagination="pagination" :rows="paginatedRows" @page-change="page = $event" @sort="onSort">
          <template #cell-status="{ value }">
            <span :class="statusClass(value)">{{ statusLabel(value) }}</span>
          </template>
          <template #cell-createdAt="{ value }">{{ formatDate(value) }}</template>
          <template #cell-name="{ value }">
            <div class="cell-center">{{ value }}</div>
          </template>
          <template #cell-tenantCode="{ value }">
            <div class="cell-center">{{ value }}</div>
          </template>
          <template #cell-warehouseCount="{ value }">
            <div class="cell-center">{{ value }}</div>
          </template>
          <template #cell-sellerCount="{ value }">
            <div class="cell-center">{{ value }}</div>
          </template>
          <template #cell-userCount="{ value }">
            <div class="cell-center">{{ value }}</div>
          </template>
          <template #cell-actions="{ row }">
            <div class="action-row">
              <button class="ui-btn ui-btn--ghost btn-sm" type="button" @click="router.push({ name: ROUTE_NAMES.SYS_COMPANY_DETAIL, params: { id: row.id } })">상세</button>
              <button class="ui-btn ui-btn--ghost btn-sm" type="button" @click="openInvite(row)">관리자 발급</button>
              <button
                class="ui-btn btn-sm"
                :class="row.status === 'INACTIVE' ? 'ui-btn--gold' : 'ui-btn--danger'"
                type="button"
                @click="openStatusModal(row, row.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE')"
              >
                {{ row.status === 'INACTIVE' ? '재활성화' : '비활성화' }}
              </button>
            </div>
          </template>
        </BaseTable>
      </section>
    </div>

    <BaseModal :is-open="inviteModal.open" title="총괄 관리자 추가 발급" width="520px" @cancel="inviteModal.open = false" @confirm="submitInvite">
      <div class="modal-grid">
        <BaseForm label="대상 업체">
          <input :value="inviteModal.company?.name || ''" disabled type="text" />
        </BaseForm>
        <BaseForm label="이름" required>
          <input v-model="inviteModal.name" type="text" placeholder="이름 입력" />
        </BaseForm>
        <BaseForm label="이메일" required :error="inviteModal.error">
          <input v-model="inviteModal.email" type="email" placeholder="이메일 입력" />
        </BaseForm>
        <div class="guide-box">
          <p>추가 발급 후 초대 메일이 발송되고, 수신자가 최초 비밀번호 설정을 완료하면 계정이 활성화됩니다.</p>
          <p>현재 활성 총괄 관리자 수: <strong>{{ activeMasterAdminCount }}</strong></p>
        </div>
      </div>
    </BaseModal>

    <BaseModal
      :is-open="statusModal.open"
      :title="statusModal.mode === 'INACTIVE' ? '업체 비활성화' : '업체 재활성화'"
      width="560px"
      @cancel="statusModal.open = false"
      @confirm="confirmStatusChange"
    >
      <div class="modal-grid">
        <p class="warning-text">
          <strong>{{ statusModal.company?.name }}</strong>
          업체를 {{ statusModal.mode === 'INACTIVE' ? '비활성화' : '재활성화' }}합니다.
        </p>
        <p v-if="statusModal.mode === 'INACTIVE'" class="warning-detail">
          영향 범위: 하위 계정 <strong>{{ selectedCompanyUsers.length }}</strong>개가 즉시 차단됩니다. 기존 재고와 주문 이력은 삭제되지 않습니다.
        </p>
        <p v-else class="warning-detail">
          재활성화 시 비활성화 전 활성 상태였던 계정만 자동 복원됩니다. 개별적으로 비활성화한 계정은 그대로 유지됩니다.
        </p>
      </div>
    </BaseModal>
  </AppLayout>
</template>

<style scoped>
.page-grid { display: grid; gap: 20px; }
.summary-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.summary-card, .panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
.summary-card { padding: 18px; }
.summary-label { color: var(--t3); font-size: var(--font-size-sm); }
.summary-value { display:block; margin-top: 8px; font-size: 28px; color: var(--t1); }
.summary-sub { margin-top: 6px; color: var(--t4); font-size: var(--font-size-xs); }
.panel { padding: 20px; }

:deep(.base-table th),
:deep(.base-table td) {
  vertical-align: middle;
}

:deep(.base-table thead th),
:deep(.base-table tbody td) {
  text-align: center !important;
}

.filter-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px; }
.action-row { display:flex; justify-content:center; align-items:center; gap: 6px; flex-wrap: nowrap; white-space: nowrap; }
.btn-sm { min-width: 64px; padding: 7px 8px; font-size: 11px; line-height: 1; white-space: nowrap; }
.cell-center { display:flex; justify-content:center; align-items:center; width:100%; text-align:center; }
.chip { display:inline-flex; padding:4px 10px; border-radius:999px; font-size: var(--font-size-xs); font-weight: 700; }
.chip--green { background: var(--green-pale); color: var(--green); }
.chip--amber { background: var(--amber-pale); color: #b45309; }
.chip--red { background: var(--red-pale); color: var(--red); }
.modal-grid { display:grid; gap: 14px; }
.guide-box, .warning-detail { padding: 12px 14px; background: var(--surface-2); border-radius: var(--radius-md); color: var(--t2); }
.warning-text { color: var(--t1); }
@media (max-width: 1200px) {
  .summary-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
