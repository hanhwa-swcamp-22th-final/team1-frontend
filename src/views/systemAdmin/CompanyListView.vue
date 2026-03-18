<script setup>
import { computed, reactive, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseForm from '@/components/common/BaseForm.vue'

const breadcrumb = [{ label: 'CONK' }, { label: '시스템 관리자' }, { label: '업체 목록' }]

const summaryCards = [
  { label: '등록 업체 수', value: 48, sub: '활성 41개 · 온보딩 5개' },
  { label: '총괄 관리자 계정', value: 52, sub: '이번 주 신규 발급 6건' },
  { label: '활성 창고 연결', value: 13, sub: '국가별 연동 운영 중' },
  { label: '검토 필요 업체', value: 4, sub: '계약 만료 임박 · 정산 검토' },
]

const companies = ref([
  {
    id: 1,
    companyName: 'FASTSHIP LOGISTICS',
    tenantCode: 'US-3PL-001',
    country: '미국',
    status: '운영중',
    warehouseCount: 3,
    sellerCount: 14,
    masterAdminEmail: 'sarah.park@fastship.us',
    lastAccessAt: '2026-03-12 09:18',
    createdAt: '2024-08-12',
  },
  {
    id: 2,
    companyName: 'NOVA FULFILL KOREA',
    tenantCode: 'KR-3PL-007',
    country: '한국',
    status: '온보딩',
    warehouseCount: 2,
    sellerCount: 6,
    masterAdminEmail: 'ops@novafulfill.kr',
    lastAccessAt: '2026-03-11 18:05',
    createdAt: '2026-02-03',
  },
  {
    id: 3,
    companyName: 'EAST GATE SUPPLY',
    tenantCode: 'JP-3PL-004',
    country: '일본',
    status: '운영중',
    warehouseCount: 1,
    sellerCount: 9,
    masterAdminEmail: 'hiro.tanaka@eastgate.jp',
    lastAccessAt: '2026-03-10 16:22',
    createdAt: '2025-05-19',
  },
  {
    id: 4,
    companyName: 'WEST BRIDGE OPS',
    tenantCode: 'US-3PL-010',
    country: '미국',
    status: '일시정지',
    warehouseCount: 1,
    sellerCount: 4,
    masterAdminEmail: 'admin@westbridgeops.com',
    lastAccessAt: '2026-03-08 13:44',
    createdAt: '2025-11-07',
  },
  {
    id: 5,
    companyName: 'PACIFIC ROUTE HUB',
    tenantCode: 'US-3PL-012',
    country: '미국',
    status: '운영중',
    warehouseCount: 2,
    sellerCount: 12,
    masterAdminEmail: 'mike.choi@pacificroute.com',
    lastAccessAt: '2026-03-12 07:54',
    createdAt: '2025-02-28',
  },
  {
    id: 6,
    companyName: 'NORTH LINK 3PL',
    tenantCode: 'CA-3PL-003',
    country: '캐나다',
    status: '운영중',
    warehouseCount: 2,
    sellerCount: 10,
    masterAdminEmail: 'help@northlink.ca',
    lastAccessAt: '2026-03-09 10:42',
    createdAt: '2025-09-21',
  },
  {
    id: 7,
    companyName: 'GLOBAL STAGING LAB',
    tenantCode: 'US-3PL-014',
    country: '미국',
    status: '온보딩',
    warehouseCount: 1,
    sellerCount: 2,
    masterAdminEmail: 'setup@globalstaging.com',
    lastAccessAt: '2026-03-12 11:27',
    createdAt: '2026-03-01',
  },
])

const filters = reactive({
  status: '전체',
  country: '전체',
  keyword: '',
  sortKey: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  pageSize: 5,
})

const issueModalOpen = ref(false)
const selectedCompany = ref(null)
const adminForm = reactive({ name: '', email: '' })
const adminErrors = reactive({ name: '', email: '' })

const statusOptions = ['전체', '운영중', '온보딩', '일시정지']
const countryOptions = ['전체', '미국', '한국', '일본', '캐나다']

const columns = [
  { key: 'company', label: '업체명', width: '18%' },
  { key: 'country', label: '본사 국가', width: '10%' },
  { key: 'status', label: '상태', width: '10%' },
  { key: 'warehouseCount', label: '계약 창고 수', width: '10%', align: 'center' },
  { key: 'sellerCount', label: '활성 셀러 수', width: '10%', align: 'center' },
  { key: 'masterAdminEmail', label: '총괄 관리자', width: '18%' },
  { key: 'lastAccessAt', label: '최근 접속', width: '12%' },
  { key: 'createdAt', label: '등록일', width: '8%' },
  { key: 'actions', label: '관리', width: '14%', align: 'center' },
]

function statusClass(status) {
  return {
    'badge-green': status === '운영중',
    'badge-blue': status === '온보딩',
    'badge-amber': status === '일시정지',
  }
}

const filteredCompanies = computed(() => {
  let rows = [...companies.value]

  if (filters.status !== '전체') {
    rows = rows.filter(row => row.status === filters.status)
  }
  if (filters.country !== '전체') {
    rows = rows.filter(row => row.country === filters.country)
  }
  if (filters.keyword.trim()) {
    const keyword = filters.keyword.trim().toLowerCase()
    rows = rows.filter(row => {
      return [row.companyName, row.tenantCode, row.masterAdminEmail].some(value =>
        String(value).toLowerCase().includes(keyword),
      )
    })
  }

  rows.sort((a, b) => {
    const aValue = a[filters.sortKey]
    const bValue = b[filters.sortKey]
    const result = String(aValue).localeCompare(String(bValue), 'ko')
    return filters.sortOrder === 'asc' ? result : -result
  })

  return rows
})

const pagedCompanies = computed(() => {
  const start = (filters.page - 1) * filters.pageSize
  return filteredCompanies.value.slice(start, start + filters.pageSize)
})

const pagination = computed(() => ({
  page: filters.page,
  pageSize: filters.pageSize,
  total: filteredCompanies.value.length,
}))

function setFilter(key, value) {
  filters[key] = value
  filters.page = 1
}

function onSort(key) {
  if (filters.sortKey === key) {
    filters.sortOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc'
  } else {
    filters.sortKey = key
    filters.sortOrder = 'asc'
  }
}

function openIssueModal(row) {
  selectedCompany.value = row
  adminForm.name = ''
  adminForm.email = ''
  adminErrors.name = ''
  adminErrors.email = ''
  issueModalOpen.value = true
}

function validateAdminForm() {
  adminErrors.name = adminForm.name.trim() ? '' : '이름을 입력해주세요.'
  adminErrors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminForm.email)
    ? ''
    : '올바른 이메일을 입력해주세요.'
  return !adminErrors.name && !adminErrors.email
}

function issueAdmin() {
  if (!validateAdminForm()) return
  issueModalOpen.value = false
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="업체 목록">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost">CSV 내보내기</button>
      <button class="ui-btn btn-gold">+ 업체 등록</button>
    </template>

    <section class="summary-grid">
      <article v-for="card in summaryCards" :key="card.label" class="summary-card">
        <p class="summary-label">{{ card.label }}</p>
        <strong class="summary-value">{{ card.value }}</strong>
        <p class="summary-sub">{{ card.sub }}</p>
      </article>
    </section>

    <section class="content-card">
      <div class="filter-bar">
        <div class="filter-group">
          <span class="filter-title">상태</span>
          <button
            v-for="status in statusOptions"
            :key="status"
            :class="['chip-btn', { active: filters.status === status }]"
            @click="setFilter('status', status)"
          >
            {{ status }}
          </button>
        </div>

        <div class="filter-group">
          <span class="filter-title">국가</span>
          <button
            v-for="country in countryOptions"
            :key="country"
            :class="['chip-btn', { active: filters.country === country }]"
            @click="setFilter('country', country)"
          >
            {{ country }}
          </button>
        </div>

        <div class="search-box">
          <input v-model="filters.keyword" placeholder="업체명 또는 총괄 관리자 검색" type="text" />
        </div>
      </div>

      <BaseTable
        :columns="columns"
        :pagination="pagination"
        :rows="pagedCompanies"
        row-key="id"
        @page-change="filters.page = $event"
        @sort="onSort"
      >
        <template #cell-company="{ row }">
          <div class="company-cell">
            <strong>{{ row.companyName }}</strong>
            <span>{{ row.tenantCode }}</span>
          </div>
        </template>

        <template #cell-country="{ value }">
          <span class="country-pill">{{ value }}</span>
        </template>

        <template #cell-status="{ value }">
          <span :class="['status-badge', statusClass(value)]">{{ value }}</span>
        </template>

        <template #cell-actions="{ row }">
          <div class="action-cell">
            <button class="mini-btn mini-btn--ghost">상세</button>
            <button class="mini-btn mini-btn--primary" @click="openIssueModal(row)">
              관리자 발급
            </button>
          </div>
        </template>
      </BaseTable>
    </section>

    <BaseModal
      :is-open="issueModalOpen"
      title="총괄 관리자 발급"
      width="560px"
      @cancel="issueModalOpen = false"
      @confirm="issueAdmin"
    >
      <div class="modal-summary">
        <p class="modal-guide">
          선택한 업체에 MASTER_ADMIN 계정을 추가 발급합니다. 최초 로그인 전까지 계정은 임시 상태로 유지됩니다.
        </p>
        <dl v-if="selectedCompany" class="summary-list">
          <div>
            <dt>업체명</dt>
            <dd>{{ selectedCompany.companyName }}</dd>
          </div>
          <div>
            <dt>테넌트 코드</dt>
            <dd>{{ selectedCompany.tenantCode }}</dd>
          </div>
        </dl>
      </div>

      <div class="form-grid">
        <BaseForm :error="adminErrors.name" label="이름" required>
          <input v-model="adminForm.name" placeholder="Daniel Kim" type="text" />
        </BaseForm>
        <BaseForm :error="adminErrors.email" label="이메일" required>
          <input v-model="adminForm.email" placeholder="daniel@example.com" type="email" />
        </BaseForm>
      </div>
    </BaseModal>
  </AppLayout>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card,
.content-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.summary-card {
  padding: 20px 22px;
}

.summary-label {
  margin: 0 0 10px;
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.summary-value {
  display: block;
  font-size: 32px;
  line-height: 1;
  color: var(--t1);
}

.summary-sub {
  margin: 10px 0 0;
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.content-card {
  padding: 16px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-title {
  font-size: var(--font-size-sm);
  color: var(--t3);
  min-width: 24px;
}

.chip-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--t3);
  font-weight: 600;
}

.chip-btn.active {
  background: var(--gold);
  color: #2a1a00;
  border-color: var(--gold);
}

.search-box {
  margin-left: auto;
  min-width: 300px;
}

.search-box input {
  width: 100%;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0 14px;
}

.company-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.company-cell strong {
  font-size: var(--font-size-sm);
}

.company-cell span {
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.country-pill {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.badge-green {
  background: var(--green-pale);
  color: var(--green);
}

.badge-blue {
  background: var(--blue-pale);
  color: var(--blue);
}

.badge-amber {
  background: var(--gold-pale);
  color: #b45309;
}

.action-cell {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.mini-btn {
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.mini-btn--ghost {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--t2);
}

.mini-btn--primary {
  border: 1px solid var(--gold);
  background: #fff8e6;
  color: #b45309;
}

.modal-summary {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.modal-guide {
  margin: 0;
  padding: 14px;
  border-radius: var(--radius-md);
  background: #f3f5ff;
  color: #4654c6;
  font-size: var(--font-size-sm);
}

.summary-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.summary-list div {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.summary-list dt {
  margin-bottom: 6px;
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.summary-list dd {
  margin: 0;
  font-weight: 700;
  color: var(--t1);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .form-grid,
  .summary-list {
    grid-template-columns: 1fr;
  }

  .search-box {
    min-width: 100%;
  }
}
</style>
