<script setup>
/**
 * UserList — 총괄관리자 소속 사용자 목록 페이지
 *
 * 레이아웃:
 *   역할 탭 + 검색 + 상태/소속 select
 *   BaseTable (클라이언트 사이드 필터링 + 페이지네이션)
 */
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getUserList, resetUserPassword, deactivateUser, reactivateUser, inviteAccount } from '@/api/member'
import { ROUTE_NAMES, ACCOUNT_STATUS, ROLES } from '@/constants'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import MasterListToolbar from '@/components/masterAdmin/MasterListToolbar.vue'
import MasterStatusTabs from '@/components/masterAdmin/MasterStatusTabs.vue'

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

const ROLE_LABELS = {
  [ROLES.WH_MANAGER]: '창고 관리자',
  [ROLES.WH_WORKER]: '창고 작업자',
  [ROLES.SELLER]: '셀러 담당자',
}

const STATUS_LABELS = {
  [ACCOUNT_STATUS.ACTIVE]: '정상',
  [ACCOUNT_STATUS.TEMP_PASSWORD]: '임시비밀번호',
  [ACCOUNT_STATUS.INACTIVE]: '비활성',
}

// ── 탭 정의 ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'ALL', label: '전체', color: null },
  {
    key: ROLES.WH_MANAGER,
    label: ROLE_LABELS[ROLES.WH_MANAGER],
    color: { bg: 'var(--blue-pale)', border: 'var(--blue)', text: 'var(--blue)' },
  },
  {
    key: ROLES.WH_WORKER,
    label: ROLE_LABELS[ROLES.WH_WORKER],
    color: { bg: 'var(--purple-pale)', border: 'var(--purple)', text: 'var(--purple)' },
  },
  {
    key: ROLES.SELLER,
    label: ROLE_LABELS[ROLES.SELLER],
    color: { bg: 'var(--gold-pale)', border: 'var(--gold)', text: '#92400E' },
  },
]

// ── 상태 ─────────────────────────────────────────────────────────────────────
const allUsers  = ref([])
const isLoading = ref(false)
const activeTab = ref('ALL')
const searchQ   = ref('')
const filterStatus = ref('')
const filterOrg  = ref('')
const page      = ref(1)
const PAGE_SIZE = 10

// ── 툴바 옵션 ─────────────────────────────────────────────────────────────────
const statusOptions = computed(() => [
  { label: STATUS_LABELS[ACCOUNT_STATUS.ACTIVE], value: ACCOUNT_STATUS.ACTIVE },
  { label: STATUS_LABELS[ACCOUNT_STATUS.TEMP_PASSWORD], value: ACCOUNT_STATUS.TEMP_PASSWORD },
  { label: STATUS_LABELS[ACCOUNT_STATUS.INACTIVE], value: ACCOUNT_STATUS.INACTIVE },
])

function userOrganization(user) {
  return user.warehouse || user.seller || ''
}

const organizationOptions = computed(() => [
  ...new Set(
    allUsers.value
      .map(userOrganization)
      .filter(Boolean),
  ),
])

const toolbarFilters = computed(() => [
  { key: 'status', value: filterStatus.value, placeholder: '전체 상태', options: statusOptions.value },
  { key: 'organization', value: filterOrg.value, placeholder: '소속 전체', options: organizationOptions.value },
])

// ── 탭 카운트 ─────────────────────────────────────────────────────────────────
const TAB_COUNT = computed(() => {
  const base = { ALL: allUsers.value.length }
  for (const tab of TABS) {
    if (tab.key !== 'ALL') {
      base[tab.key] = allUsers.value.filter(user => user.role === tab.key).length
    }
  }
  return base
})

// ── 클라이언트 사이드 필터링 ──────────────────────────────────────────────────
const filteredUsers = computed(() => {
  return allUsers.value
    .filter(user => activeTab.value === 'ALL' || user.role === activeTab.value)
    .filter(user => !filterStatus.value || user.accountStatus === filterStatus.value)
    .filter(user => !filterOrg.value || userOrganization(user) === filterOrg.value)
    .filter(u => {
      if (!searchQ.value) return true
      const q = searchQ.value.toLowerCase()
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.workerCode?.toLowerCase().includes(q) ||
        userOrganization(u).toLowerCase().includes(q)
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

watch([activeTab, searchQ, filterStatus, filterOrg], () => { page.value = 1 })

// ── 데이터 로드 ───────────────────────────────────────────────────────────────
async function fetchAll() {
  isLoading.value = true
  try {
    const res = await getUserList()
    allUsers.value = (res.data.data ?? []).map(user => ({
      ...user,
      status:    user.accountStatus,
      lastLogin: user.lastLoginAt,
    }))
  } catch (e) {
    console.error('[UserList] fetch error:', e)
  } finally {
    isLoading.value = false
  }
}

// ── 액션 ─────────────────────────────────────────────────────────────────────
function handleResetPassword(user) {
  openConfirm(
    'PW 초기화',
    `${user.name}의 비밀번호를 초기화하시겠습니까?`,
    true,
    async () => {
      try {
        await resetUserPassword(user.id)
        await fetchAll()
      } catch (e) {
        console.error('[UserList] resetPassword error:', e)
      }
    },
  )
}

async function handleResendInvite(row) {
  try {
    await inviteAccount({
      role:           row.role,
      organizationId: row.warehouseId ?? row.sellerId,
      name:           row.name,
      email:          row.email,
    })
  } catch (e) {
    console.error('[UserList] resendInvite error:', e)
  }
}

function handleDeactivate(user) {
  openConfirm(
    '계정 비활성화',
    `${user.name} 계정을 비활성화하시겠습니까?`,
    true,
    async () => {
      try {
        await deactivateUser(user.id)
        await fetchAll()
      } catch (e) {
        console.error('[UserList] deactivate error:', e)
      }
    },
  )
}

function handleReactivate(user) {
  openConfirm(
    '계정 재활성화',
    `${user.name} 계정을 다시 활성화하시겠습니까?`,
    false,
    async () => {
      try {
        await reactivateUser(user.id)
        await fetchAll()
      } catch (e) {
        console.error('[UserList] reactivate error:', e)
      }
    },
  )
}

onMounted(fetchAll)

// ── 확인 다이얼로그 ───────────────────────────────────────────────────────────
const confirmDialog = reactive({
  open: false, title: '', message: '', danger: false, action: null,
})

function openConfirm(title, message, danger, action) {
  Object.assign(confirmDialog, { open: true, title, message, danger, action })
}

async function onConfirmAction() {
  if (confirmDialog.action) await confirmDialog.action()
  confirmDialog.open = false
}

function onCancelConfirm() {
  confirmDialog.open = false
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────
function userInitials(name) {
  return (name || '').slice(0, 2).toUpperCase()
}

function roleBadgeClass(role) {
  if (role === ROLES.WH_MANAGER) return 'role-manager'
  if (role === ROLES.WH_WORKER)  return 'role-worker'
  if (role === ROLES.SELLER)     return 'role-seller'
  return ''
}

function handleToolbarFilter({ key, value }) {
  if (key === 'status') filterStatus.value = value
  if (key === 'organization') filterOrg.value = value
}

function roleLabel(role) {
  return ROLE_LABELS[role] ?? role
}

function isWorker(user) { return user.role === ROLES.WH_WORKER }
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
      <MasterStatusTabs
        :tabs="TABS"
        :active-key="activeTab"
        :counts="TAB_COUNT"
        @change="activeTab = $event"
      />

      <MasterListToolbar
        :search-value="searchQ"
        search-placeholder="이름, 이메일, 작업자 코드, 소속 검색"
        search-width="300px"
        :filters="toolbarFilters"
        @update:search-value="searchQ = $event"
        @update:filter="handleToolbarFilter"
      />
    </div>

    <!-- ── 확인 다이얼로그 ── -->
    <ConfirmDialog
      :is-open="confirmDialog.open"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :danger="confirmDialog.danger"
      @confirm="onConfirmAction"
      @cancel="onCancelConfirm"
    />

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
        <span class="role-badge" :class="roleBadgeClass(value)">{{ roleLabel(value) }}</span>
      </template>

      <!-- 소속 -->
      <template #cell-org="{ row }">
        <span class="cell-org">{{ userOrganization(row) || '-' }}</span>
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
        <StatusBadge :status="row.accountStatus" type="account" />
      </template>

      <!-- 액션 버튼 -->
      <template #cell-actions="{ row }">
        <div class="action-btn-group">
          <!-- 비활성 상태: 재활성화만 -->
          <template v-if="isInactive(row)">
            <button class="action-btn action-btn--ghost" @click="handleReactivate(row)">
              재활성화
            </button>
          </template>

          <!-- 활성/임시비밀번호 상태 -->
          <template v-else>
            <!-- 작업자: PW 초기화 / 그 외: 초대 재발송 -->
            <button
              class="action-btn action-btn--ghost"
              @click="isWorker(row) ? handleResetPassword(row) : handleResendInvite(row)"
            >
              {{ isWorker(row) ? 'PW 초기화' : '초대 재발송' }}
            </button>
            <button class="action-btn action-btn--danger" @click="handleDeactivate(row)">
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
