<script setup>
/**
 * UserList — 총괄관리자 소속 사용자 목록 페이지
 *
 * 레이아웃:
 *   상태 필터 탭 + 검색 + 창고 select
 *   BaseTable (클라이언트 사이드 필터링 + 페이지네이션)
 *
 * 탭 색상:
 *   탭 클릭 시 상태에 맞는 색상으로 변경 (AsnList.vue 패턴 동일)
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getUserList, resetUserPassword, deactivateUser, reactivateUser } from '@/api/member'
import { ROUTE_NAMES, ACCOUNT_STATUS } from '@/constants'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'

const breadcrumb = [{ label: '사용자 관리' }, { label: '소속 사용자 목록' }]
const router = useRouter()

// ── BaseTable 컬럼 정의 ───────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'user',      label: '사용자',            width: '180px' },
  { key: 'role',      label: '역할',              width: '120px' },
  { key: 'org',       label: '소속(창고/셀러사)', width: '200px' },
  { key: 'contact',   label: '이메일 / 작업자 코드', width: '200px' },
  { key: 'createdAt', label: '등록일',             width: '100px' },
  { key: 'lastLogin', label: '마지막 로그인',       width: '110px' },
  { key: 'status',    label: '상태',               width: '120px' },
  { key: 'actions',   label: '액션',               width: '180px' },
]

// ── 탭 정의 ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'ALL',        label: '전체',         color: null },
  { key: 'WH_MANAGER', label: 'WH_MANAGER',  color: { bg: 'var(--blue-pale)',   border: 'var(--blue)',   text: 'var(--blue)'   } },
  { key: 'WH_WORKER',  label: 'WH_WORKER',   color: { bg: 'var(--purple-pale)', border: 'var(--purple)', text: 'var(--purple)' } },
  { key: 'SELLER',     label: 'SELLER',       color: { bg: 'var(--gold-pale)',   border: 'var(--gold)',   text: '#92400E'       } },
  { key: 'TEMP',       label: '임시비밀번호', color: { bg: 'var(--amber-pale)',  border: 'var(--amber)',  text: '#b45309'       } },
  { key: 'INACTIVE',   label: '비활성',       color: { bg: 'var(--border)',      border: 'var(--t4)',     text: 'var(--t3)'     } },
]

// ── 상태 ─────────────────────────────────────────────────────────────────────
const allUsers  = ref([])
const isLoading = ref(false)
const activeTab = ref('ALL')
const searchQ   = ref('')
const filterWh  = ref('')
const page      = ref(1)
const PAGE_SIZE = 10

// ── 창고 목록 (동적 셀렉트) ───────────────────────────────────────────────────
const warehouseOptions = computed(() => [
  ...new Set(
    allUsers.value
      .filter(u => u.warehouse)
      .map(u => u.warehouse)
  ),
])

// ── 탭 카운트 ─────────────────────────────────────────────────────────────────
const TAB_COUNT = computed(() => {
  const base = { ALL: allUsers.value.length }
  base['WH_MANAGER'] = allUsers.value.filter(u => u.role === 'WH_MANAGER').length
  base['WH_WORKER']  = allUsers.value.filter(u => u.role === 'WH_WORKER').length
  base['SELLER']     = allUsers.value.filter(u => u.role === 'SELLER').length
  base['TEMP']       = allUsers.value.filter(u => u.accountStatus === ACCOUNT_STATUS.TEMP_PASSWORD).length
  base['INACTIVE']   = allUsers.value.filter(u => u.accountStatus === ACCOUNT_STATUS.INACTIVE).length
  return base
})

// ── 탭 색상 ──────────────────────────────────────────────────────────────────
function tabActiveStyle(tab) {
  if (activeTab.value !== tab.key) return {}
  if (!tab.color) return { background: 'rgba(245,166,35,0.12)', borderColor: 'var(--gold)', color: 'var(--gold)' }
  return { background: tab.color.bg, borderColor: tab.color.border, color: tab.color.text }
}

function tabCountStyle(tab) {
  if (activeTab.value !== tab.key) return {}
  if (!tab.color) return { background: 'var(--gold)', color: '#fff' }
  return { background: tab.color.border, color: '#fff' }
}

// ── 클라이언트 사이드 필터링 ──────────────────────────────────────────────────
const filteredUsers = computed(() => {
  return allUsers.value
    .filter(u => {
      if (activeTab.value === 'ALL')        return true
      if (activeTab.value === 'TEMP')       return u.accountStatus === ACCOUNT_STATUS.TEMP_PASSWORD
      if (activeTab.value === 'INACTIVE')   return u.accountStatus === ACCOUNT_STATUS.INACTIVE
      return u.role === activeTab.value
    })
    .filter(u => !filterWh.value || u.warehouse === filterWh.value)
    .filter(u => {
      if (!searchQ.value) return true
      const q = searchQ.value.toLowerCase()
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.workerCode?.toLowerCase().includes(q)
      )
    })
})

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredUsers.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({
  page: page.value,
  pageSize: PAGE_SIZE,
  total: filteredUsers.value.length,
}))

watch([activeTab, searchQ, filterWh], () => { page.value = 1 })

// ── 데이터 로드 ───────────────────────────────────────────────────────────────
async function fetchAll() {
  isLoading.value = true
  try {
    const res = await getUserList()
    allUsers.value = res.data.data
  } catch (e) {
    console.error('[UserList] fetch error:', e)
  } finally {
    isLoading.value = false
  }
}

// ── 액션 ─────────────────────────────────────────────────────────────────────
async function handleResetPassword(userId) {
  try {
    await resetUserPassword(userId)
    await fetchAll()
  } catch (e) {
    console.error('[UserList] resetPassword error:', e)
  }
}

async function handleDeactivate(userId) {
  try {
    await deactivateUser(userId)
    await fetchAll()
  } catch (e) {
    console.error('[UserList] deactivate error:', e)
  }
}

async function handleReactivate(userId) {
  try {
    await reactivateUser(userId)
    await fetchAll()
  } catch (e) {
    console.error('[UserList] reactivate error:', e)
  }
}

onMounted(fetchAll)

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────
function userInitials(name) {
  return (name || '').slice(0, 2).toUpperCase()
}

function roleBadgeClass(role) {
  if (role === 'WH_MANAGER') return 'role-manager'
  if (role === 'WH_WORKER')  return 'role-worker'
  if (role === 'SELLER')     return 'role-seller'
  return ''
}

function statusBadgeClass(status) {
  if (status === ACCOUNT_STATUS.ACTIVE)        return 'status-active'
  if (status === ACCOUNT_STATUS.TEMP_PASSWORD) return 'status-temp'
  if (status === ACCOUNT_STATUS.INACTIVE)      return 'status-inactive'
  return ''
}

function statusLabel(status) {
  if (status === ACCOUNT_STATUS.ACTIVE)        return '활성'
  if (status === ACCOUNT_STATUS.TEMP_PASSWORD) return '임시비밀번호'
  if (status === ACCOUNT_STATUS.INACTIVE)      return '비활성'
  return status
}

function isWorker(user) { return user.role === 'WH_WORKER' }
function isInactive(user) { return user.accountStatus === ACCOUNT_STATUS.INACTIVE }
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="소속 사용자 목록" :loading="isLoading">
    <template #header-action>
      <button
        class="ui-btn ui-btn--gold"
        @click="router.push({ name: ROUTE_NAMES.MASTER_ACCOUNT_INVITE })"
      >
        + 신규 계정 초대
      </button>
    </template>

    <!-- ── 툴바 ── -->
    <div class="toolbar">
      <!-- 탭 필터 -->
      <div class="filter-tabs">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          class="filter-tab"
          :class="{ active: activeTab === tab.key }"
          :style="tabActiveStyle(tab)"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span class="filter-count" :style="tabCountStyle(tab)">{{ TAB_COUNT[tab.key] ?? 0 }}</span>
        </button>
      </div>

      <!-- 검색 + 창고 필터 -->
      <div class="toolbar-right">
        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#B0B8CC" stroke-width="1.6">
            <circle cx="6" cy="6" r="4.5"/>
            <path d="M10 10l2.5 2.5" stroke-linecap="round"/>
          </svg>
          <input
            v-model="searchQ"
            class="search-input"
            type="text"
            placeholder="이름, 이메일, 작업자 코드 검색"
          />
        </div>
        <select v-model="filterWh" class="select-filter">
          <option value="">창고 전체</option>
          <option v-for="wh in warehouseOptions" :key="wh" :value="wh">{{ wh }}</option>
        </select>
      </div>
    </div>

    <!-- ── 데이터 테이블 ── -->
    <BaseTable
      :columns="COLUMNS"
      :rows="paginatedUsers"
      :loading="isLoading"
      :pagination="pagination"
      row-key="id"
      @page-change="page = $event"
    >
      <!-- 사용자: 아바타 + 이름 + 코드 -->
      <template #cell-user="{ row }">
        <div class="user-name-cell" :class="{ 'user-inactive': isInactive(row) }">
          <div class="user-avatar" :class="{ 'avatar-inactive': isInactive(row) }">
            {{ userInitials(row.name) }}
          </div>
          <div>
            <div class="user-name">{{ row.name }}</div>
            <div v-if="row.workerCode" class="user-code">{{ row.workerCode }}</div>
          </div>
        </div>
      </template>

      <!-- 역할 배지 -->
      <template #cell-role="{ value }">
        <span class="role-badge" :class="roleBadgeClass(value)">{{ value }}</span>
      </template>

      <!-- 소속 -->
      <template #cell-org="{ row }">
        <span class="cell-org">{{ row.warehouse || row.seller || '-' }}</span>
      </template>

      <!-- 이메일 / 작업자 코드 -->
      <template #cell-contact="{ row }">
        <span v-if="row.email" class="contact-email">{{ row.email }}</span>
        <span v-else class="no-contact">미등록 (이메일 없음)</span>
      </template>

      <!-- 등록일 -->
      <template #cell-createdAt="{ value }">
        <span class="date-normal">{{ value }}</span>
      </template>

      <!-- 마지막 로그인 -->
      <template #cell-lastLogin="{ value }">
        <span class="date-normal">{{ value }}</span>
      </template>

      <!-- 상태 -->
      <template #cell-status="{ row }">
        <span class="status-badge" :class="statusBadgeClass(row.accountStatus)">
          <span class="status-dot"></span>
          {{ statusLabel(row.accountStatus) }}
        </span>
      </template>

      <!-- 액션 버튼 -->
      <template #cell-actions="{ row }">
        <div class="action-btn-group">
          <!-- 비활성 상태: 재활성화만 -->
          <template v-if="isInactive(row)">
            <button class="action-btn action-btn--ghost" @click="handleReactivate(row.id)">
              재활성화
            </button>
          </template>

          <!-- 활성/임시비밀번호 상태 -->
          <template v-else>
            <!-- 작업자: PW 초기화 / 그 외: 초대 재발송 -->
            <button
              class="action-btn action-btn--ghost"
              @click="isWorker(row) ? handleResetPassword(row.id) : handleResetPassword(row.id)"
            >
              {{ isWorker(row) ? 'PW 초기화' : '초대 재발송' }}
            </button>
            <button class="action-btn action-btn--danger" @click="handleDeactivate(row.id)">
              비활성화
            </button>
          </template>
        </div>
      </template>
    </BaseTable>
  </AppLayout>
</template>

<style scoped>
/* ── 헤더 버튼 ── */
.ui-btn--gold {
  background: var(--gold);
  border: none;
  color: var(--t1);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(245,166,35,0.3);
}

/* ── 툴바 ── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 8px 14px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-family: 'Barlow', sans-serif;
  font-weight: 500;
  font-size: 12px;
  color: var(--t2);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--ease-fast), border-color var(--ease-fast), color var(--ease-fast);
}

.filter-tab.active { font-weight: 700; }

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  padding: 0 4px;
  margin-left: 5px;
  background: var(--border);
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  color: var(--t2);
  transition: background var(--ease-fast), color var(--ease-fast);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  width: 280px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  transition: border-color var(--ease-fast);
}
.search-box:focus-within { border-color: var(--blue); }

.search-input {
  border: none;
  outline: none;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--t1);
  background: transparent;
  flex: 1;
}
.search-input::placeholder { color: var(--t4); }

.select-filter {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  color: var(--t2);
  outline: none;
  cursor: pointer;
}
.select-filter:focus { border-color: var(--blue); }

/* ── 셀 스타일 ── */
.user-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-inactive { opacity: 0.55; }

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 12px;
  color: var(--t2);
  flex-shrink: 0;
}

.user-name {
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: var(--t1);
}

.user-code {
  font-family: 'IBM Plex Sans', monospace;
  font-size: 11px;
  color: var(--t3);
  margin-top: 1px;
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
}

.role-manager { background: var(--blue-pale);   color: var(--blue); }
.role-worker  { background: var(--purple-pale); color: var(--purple); }
.role-seller  { background: var(--gold-pale);   color: #92400E; }

.cell-org {
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  color: var(--t2);
}

.contact-email {
  font-family: 'IBM Plex Sans', monospace;
  font-size: 12px;
  color: var(--t2);
  white-space: nowrap;
}

.no-contact {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: var(--t4);
  font-style: italic;
}

.date-normal {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--t3);
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.status-active   { background: var(--green-pale); color: var(--green); }
.status-temp     { background: var(--amber-pale); color: #92400E; }
.status-inactive { background: var(--border);     color: var(--t3); }

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

/* ── 액션 버튼 ── */
.action-btn-group {
  display: flex;
  gap: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  height: 26px;
  border-radius: 3px;
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.action-btn--ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--t2);
}
.action-btn--ghost:hover { border-color: var(--t3); background: var(--surface-2); }

.action-btn--danger {
  background: transparent;
  border: 1px solid var(--red);
  color: var(--red);
}
.action-btn--danger:hover { background: var(--red-pale); }
</style>
