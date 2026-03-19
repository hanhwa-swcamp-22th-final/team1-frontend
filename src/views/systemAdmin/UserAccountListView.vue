<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const breadcrumb = [{ label: '사용자 관리' }, { label: '계정 관리' }, { label: '전체 사용자 목록' }]
const page = ref(1)
const PAGE_SIZE = 8

const users = ref([
  { id: 1, name: 'Sarah Park', email: 'sarah.park@fastship.us', role: 'MASTER_ADMIN', company: 'FASTSHIP LOGISTICS', warehouse: '-', createdAt: '2026-03-12', lastLogin: '2026-03-13 09:18', status: '활성' },
  { id: 2, name: 'Daniel Kim', email: 'daniel@fastship.us', role: 'MASTER_ADMIN', company: 'FASTSHIP LOGISTICS', warehouse: '-', createdAt: '2026-03-12', lastLogin: '-', status: '초대대기' },
  { id: 3, name: 'John Miller', email: 'john@westbridgeops.com', role: 'MASTER_ADMIN', company: 'WEST BRIDGE OPS', warehouse: '-', createdAt: '2025-11-07', lastLogin: '2026-03-08 13:44', status: '비활성' },
  { id: 4, name: 'Amy Song', email: 'amy.song@fastship.us', role: 'WH_MANAGER', company: 'FASTSHIP LOGISTICS', warehouse: 'Ontario Overflow', createdAt: '2026-01-04', lastLogin: '2026-03-13 08:01', status: '활성' },
  { id: 5, name: 'Chris Lee', email: 'chris.lee@fastship.us', role: 'WH_WORKER', company: 'FASTSHIP LOGISTICS', warehouse: 'LA Main Hub', createdAt: '2026-02-01', lastLogin: '2026-03-12 19:30', status: '잠금' },
  { id: 6, name: 'Mia Han', email: 'mia@pacificroute.com', role: 'SELLER_MANAGER', company: 'PACIFIC ROUTE HUB', warehouse: 'Carson Sort Center', createdAt: '2026-02-14', lastLogin: '2026-03-11 11:10', status: '활성' },
  { id: 7, name: 'Ops Team', email: 'ops@novafullfill.kr', role: 'MASTER_ADMIN', company: 'NOVA FULFILL KOREA', warehouse: '-', createdAt: '2026-02-03', lastLogin: '-', status: '초대만료' },
  { id: 8, name: 'Leah Yun', email: 'leah@pacificroute.com', role: 'WH_MANAGER', company: 'PACIFIC ROUTE HUB', warehouse: 'Seattle Cross Dock', createdAt: '2026-01-21', lastLogin: '2026-03-12 07:10', status: '활성' },
])

const filters = reactive({ role: 'ALL', company: 'ALL', status: 'ALL', search: '' })
const actionModal = reactive({ open: false, mode: 'unlock', target: null })

const columns = [
  { key: 'name', label: '이름', width: '13%' },
  { key: 'email', label: '이메일', width: '21%' },
  { key: 'role', label: '역할', width: '12%' },
  { key: 'company', label: '소속 업체', width: '16%' },
  { key: 'warehouse', label: '소속 창고', width: '12%' },
  { key: 'createdAt', label: '등록일', width: '10%' },
  { key: 'lastLogin', label: '마지막 로그인', width: '12%' },
  { key: 'status', label: '계정 상태', width: '8%', align: 'center' },
  { key: 'actions', label: '관리', width: '14%', align: 'center' },
]

const roleOptions = computed(() => ['ALL', ...new Set(users.value.map((item) => item.role))])
const companyOptions = computed(() => ['ALL', ...new Set(users.value.map((item) => item.company))])
const statusOptions = ['ALL', '활성', '비활성', '잠금', '초대대기', '초대만료']

const filteredUsers = computed(() => users.value.filter((item) => {
  const matchesRole = filters.role === 'ALL' || item.role === filters.role
  const matchesCompany = filters.company === 'ALL' || item.company === filters.company
  const matchesStatus = filters.status === 'ALL' || item.status === filters.status
  const q = filters.search.trim().toLowerCase()
  const matchesSearch = !q || [item.name, item.email, item.company, item.warehouse].join(' ').toLowerCase().includes(q)
  return matchesRole && matchesCompany && matchesStatus && matchesSearch
}))
const paginatedUsers = computed(() => filteredUsers.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
const pagination = computed(() => ({ page: page.value, pageSize: PAGE_SIZE, total: filteredUsers.value.length }))
watch(() => [filters.role, filters.company, filters.status, filters.search], () => { page.value = 1 })

function statusClass(status) {
  return {
    활성: 'chip chip--green', 비활성: 'chip chip--red', 잠금: 'chip chip--amber', 초대대기: 'chip chip--blue', 초대만료: 'chip chip--gray',
  }[status] ?? 'chip'
}
function openAction(mode, row) { actionModal.mode = mode; actionModal.target = row; actionModal.open = true }
function confirmAction() {
  if (!actionModal.target) return
  if (actionModal.mode === 'unlock') actionModal.target.status = '활성'
  if (actionModal.mode === 'reset' && actionModal.target.status === '초대만료') actionModal.target.status = '초대대기'
  actionModal.open = false
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="전체 사용자 목록">
    <div class="page-stack">
      <section class="filter-panel">
        <select v-model="filters.role"><option v-for="role in roleOptions" :key="role" :value="role">{{ role === 'ALL' ? '전체 역할' : role }}</option></select>
        <select v-model="filters.company"><option v-for="company in companyOptions" :key="company" :value="company">{{ company === 'ALL' ? '전체 업체' : company }}</option></select>
        <select v-model="filters.status"><option v-for="status in statusOptions" :key="status" :value="status">{{ status === 'ALL' ? '전체 상태' : status }}</option></select>
        <input v-model="filters.search" type="text" placeholder="이름, 이메일, 업체 검색" />
      </section>

      <section class="table-card">
        <BaseTable :columns="columns" :rows="paginatedUsers" :pagination="pagination" @page-change="page = $event">
          <template #cell-status="{ value }"><span :class="statusClass(value)">{{ value }}</span></template>
          <template #cell-actions="{ row }">
            <div class="action-buttons">
              <button v-if="row.status === '잠금'" class="link-btn" @click="openAction('unlock', row)">잠금 해제</button>
              <button class="link-btn" @click="openAction('reset', row)">비밀번호 초기화</button>
            </div>
          </template>
        </BaseTable>
      </section>
    </div>

    <BaseModal :open="actionModal.open" :title="actionModal.mode === 'unlock' ? '계정 잠금 해제' : '비밀번호 초기화'" @close="actionModal.open = false">
      <p class="modal-copy">
        <template v-if="actionModal.mode === 'unlock'">{{ actionModal.target?.name }} 계정의 잠금을 해제합니다.</template>
        <template v-else>{{ actionModal.target?.name }} 계정의 비밀번호를 초기화합니다. 초대 만료 계정은 초대대기로 변경됩니다.</template>
      </p>
      <template #footer>
        <button class="ui-btn ui-btn--ghost" @click="actionModal.open = false">취소</button>
        <button class="ui-btn ui-btn--primary" @click="confirmAction">확인</button>
      </template>
    </BaseModal>
  </AppLayout>
</template>

<style scoped>
.page-stack { display:flex; flex-direction:column; gap:20px; }
.filter-panel, .table-card { background: var(--surface); border:1px solid var(--border); border-radius: var(--radius-xl); padding:18px; box-shadow: var(--shadow-sm); }
.filter-panel { display:grid; grid-template-columns: repeat(4, 1fr); gap:14px; }
.action-buttons { display:flex; gap:8px; justify-content:center; }
.link-btn { border:0; background:transparent; color: var(--blue); font-weight:600; cursor:pointer; }
.chip { display:inline-flex; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; }
.chip--green { background: var(--green-pale); color: var(--green); }
.chip--red { background: var(--red-pale); color: var(--red); }
.chip--amber { background: var(--amber-pale); color: #b45309; }
.chip--blue { background: var(--blue-pale); color: var(--blue); }
.chip--gray { background: var(--surface-2); color: var(--t3); }
.modal-copy { margin:0; color: var(--t2); line-height:1.6; }
@media (max-width: 960px) { .filter-panel { grid-template-columns: 1fr; } }
</style>
