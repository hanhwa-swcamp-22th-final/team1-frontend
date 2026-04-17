<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDate } from '@/utils/format'
import { getCompanies, getUsers, updateUser } from '@/api/member'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const breadcrumb = [{ label: '사용자 관리' }, { label: '계정 관리' }, { label: '전체 사용자 목록' }]
const companies = ref([])
const users = ref([])
const page = ref(1)
const PAGE_SIZE = 10
const filters = reactive({ role: 'ALL', companyId: 'ALL', status: 'ALL' })
const actionModal = reactive({ open: false, user: null })

const columns = [
  { key: 'name', label: '이름' },
  { key: 'email', label: '이메일' },
  { key: 'role', label: '역할', align: 'center' },
  { key: 'organization', label: '소속 업체/창고' },
  { key: 'registeredAt', label: '등록일', align: 'center' },
  { key: 'lastLoginAt', label: '마지막 로그인', align: 'center' },
  { key: 'status', label: '계정 상태', align: 'center' },
  { key: 'actions', label: '관리', align: 'center' },
]

async function fetchData() {
  ui.setLoading(true)
  try {
    const [companyRes, userRes] = await Promise.all([getCompanies(), getUsers()])
    companies.value = companyRes.data.data
    users.value = userRes.data.data
  } finally {
    ui.setLoading(false)
  }
}

onMounted(fetchData)

const filteredUsers = computed(() => users.value.filter((user) => {
  const roleOk = filters.role === 'ALL' || user.role === filters.role
  const companyOk = filters.companyId === 'ALL' || Number(filters.companyId) === Number(user.companyId)
  const statusOk = filters.status === 'ALL' || user.status === filters.status
  return roleOk && companyOk && statusOk
}))

const paginatedRows = computed(() => filteredUsers.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
const pagination = computed(() => ({ page: page.value, pageSize: PAGE_SIZE, total: filteredUsers.value.length }))

function statusText(status) {
  return { ACTIVE: '활성', INACTIVE: '비활성', TEMP_PASSWORD: '임시비밀번호' }[status] ?? status
}

function statusClass(status) {
  return {
    ACTIVE: 'chip chip--green',
    INACTIVE: 'chip chip--red',
    TEMP_PASSWORD: 'chip chip--amber',
  }[status] ?? 'chip'
}

function openAction(user) {
  actionModal.user = user
  actionModal.open = true
}

async function confirmAction() {
  if (!actionModal.user) return
  ui.setLoading(true)
  try {
    await updateUser(actionModal.user.id, { status: 'TEMP_PASSWORD' })
    actionModal.open = false
    await fetchData()
  } finally {
    ui.setLoading(false)
  }
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="전체 사용자 목록">
    <LoadingSpinner v-if="ui.isLoading" fullscreen />

    <div class="page-grid">
      <section class="section-card">
        <header class="section-head">
          <div>
            <h3 class="section-title">플랫폼 전체 사용자 조회</h3>
            <p class="section-sub">역할, 업체, 상태 조건으로 계정을 조회하고 비밀번호 초기화를 수행합니다.</p>
          </div>
        </header>

        <div class="filter-grid">
          <BaseForm label="역할">
            <select v-model="filters.role">
              <option value="ALL">전체</option>
              <option value="MASTER_ADMIN">총괄 관리자</option>
              <option value="WH_MANAGER">창고 관리자</option>
              <option value="SELLER_MANAGER">셀러 담당자</option>
            </select>
          </BaseForm>
          <BaseForm label="업체">
            <select v-model="filters.companyId">
              <option value="ALL">전체</option>
              <option v-for="company in companies" :key="company.id" :value="company.id">{{ company.name }}</option>
            </select>
          </BaseForm>
          <BaseForm label="상태">
            <select v-model="filters.status">
              <option value="ALL">전체</option>
              <option value="ACTIVE">활성</option>
              <option value="INACTIVE">비활성</option>
              <option value="TEMP_PASSWORD">임시비밀번호</option>
            </select>
          </BaseForm>
        </div>

        <BaseTable :columns="columns" :pagination="pagination" :rows="paginatedRows" @page-change="page = $event">
          <template #cell-organization="{ row }">{{ row.organization }} / {{ row.warehouse }}</template>
          <template #cell-registeredAt="{ value }">{{ formatDate(value) }}</template>
          <template #cell-lastLoginAt="{ value }">{{ formatDate(value, 'datetime') }}</template>
          <template #cell-status="{ value }"><span :class="statusClass(value)">{{ statusText(value) }}</span></template>
          <template #cell-actions="{ row }">
            <div class="action-row">
              <button class="ui-btn ui-btn--ghost btn-sm" type="button" @click="openAction(row)">비밀번호 초기화</button>
            </div>
          </template>
        </BaseTable>
      </section>
    </div>

    <BaseModal :is-open="actionModal.open" title="비밀번호 초기화" width="480px" @cancel="actionModal.open = false" @confirm="confirmAction">
      <p>
        <strong>{{ actionModal.user?.name }}</strong> 계정에 대해 비밀번호 초기화를 진행합니다.
      </p>
    </BaseModal>
  </AppLayout>
</template>

<style scoped>
.page-grid {
  display: grid;
  gap: var(--space-5);
}

.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.section-title {
  color: var(--t1);
  font-size: var(--font-size-xl);
  font-weight: 700;
}

.section-sub {
  margin-top: 4px;
  color: var(--t3);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.chip--green { background: var(--green-pale); color: var(--green); }
.chip--red { background: var(--red-pale); color: var(--red); }
.chip--amber { background: var(--amber-pale); color: #b45309; }

.action-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 7px 10px;
  font-size: var(--font-size-xs);
  min-width: 80px;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
