<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import CreateWorkerModal from '@/components/whManager/CreateWorkerModal.vue'
import EditWorkerModal from '@/components/whManager/EditWorkerModal.vue'
import DeactivateWorkerModal from '@/components/whManager/DeactivateWorkerModal.vue'
import { getWhmWorkerAccounts, createWhmWorkerAccount, updateWhmWorkerAccount } from '@/api/wh-manager'
import { ACCOUNT_STATUS, WORKER_PRESENCE_STATUS } from '@/constants'

// ── 데이터
const workers = ref([])
const loading = ref(false)

// ── 필터
const searchText         = ref('')
const filterAccountStatus = ref('')
const filterZone         = ref('')

// ── 페이지네이션
const currentPage = ref(1)
const PAGE_SIZE   = 8

// ── 모달
const showCreateModal     = ref(false)
const showEditModal       = ref(false)
const showDeactivateModal = ref(false)
const targetWorker        = ref(null)

// ── 토스트
const toast = ref({ visible: false, message: '', type: 'success' })
function showToast(message, type = 'success') {
  toast.value = { visible: true, message, type }
}

// ── 데이터 로드
async function fetchWorkers() {
  loading.value = true
  try {
    const { data } = await getWhmWorkerAccounts()
    workers.value = data
  } catch (e) {
    console.error('작업자 목록 로드 실패:', e)
    showToast('목록을 불러오지 못했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchWorkers)

watch([searchText, filterAccountStatus, filterZone], () => {
  currentPage.value = 1
})

// ── KPI
const kpiTotal    = computed(() => workers.value.length)
const kpiActive   = computed(() => workers.value.filter(w => w.accountStatus === ACCOUNT_STATUS.ACTIVE).length)
const kpiInactive = computed(() => workers.value.filter(w => w.accountStatus === ACCOUNT_STATUS.INACTIVE).length)
const kpiWorking  = computed(() => workers.value.filter(w =>
  w.presenceStatus === WORKER_PRESENCE_STATUS.PICKING ||
  w.presenceStatus === WORKER_PRESENCE_STATUS.PUTAWAY,
).length)

// ── 클라이언트 필터링
const filtered = computed(() => {
  let list = workers.value
  if (filterAccountStatus.value) list = list.filter(w => w.accountStatus === filterAccountStatus.value)
  if (filterZone.value)          list = list.filter(w => w.zones?.includes(filterZone.value))
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.id.toLowerCase().includes(q),
    )
  }
  return list
})

// ── 페이지네이션
const paged = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({
  page:     currentPage.value,
  pageSize: PAGE_SIZE,
  total:    filtered.value.length,
}))

// ── 계정 생성
async function handleCreate(payload) {
  try {
    const { data } = await createWhmWorkerAccount(payload)
    workers.value.push(data)
    showCreateModal.value = false
    showToast(`${payload.name} 작업자 계정이 생성되었습니다.`)
  } catch (e) {
    showToast('계정 생성 중 오류가 발생했습니다.', 'error')
  }
}

// ── 계정 수정
function openEditModal(worker) {
  targetWorker.value = worker
  showEditModal.value = true
}

async function handleEdit(payload) {
  try {
    await updateWhmWorkerAccount(payload.workerId, {
      name:          payload.name,
      accountStatus: payload.accountStatus,
      email:         payload.email,
      zones:         payload.zones,
      memo:          payload.memo,
    })
    workers.value = workers.value.map(w =>
      w.id === payload.workerId ? { ...w, ...payload, id: w.id } : w,
    )
    showEditModal.value = false
    showToast('작업자 정보가 저장되었습니다.')
  } catch (e) {
    showToast('저장 중 오류가 발생했습니다.', 'error')
  }
}

// ── 비밀번호 초기화
async function handleResetPassword(payload) {
  try {
    await updateWhmWorkerAccount(payload.workerId, { accountStatus: ACCOUNT_STATUS.TEMP_PASSWORD })
    workers.value = workers.value.map(w =>
      w.id === payload.workerId ? { ...w, accountStatus: ACCOUNT_STATUS.TEMP_PASSWORD } : w,
    )
    showEditModal.value = false
    showToast('임시 비밀번호가 재발급되었습니다.', 'warning')
  } catch (e) {
    showToast('비밀번호 초기화 중 오류가 발생했습니다.', 'error')
  }
}

// ── 비활성화
function openDeactivateModal(worker) {
  targetWorker.value = worker
  showDeactivateModal.value = true
}

async function handleDeactivate(payload) {
  try {
    await updateWhmWorkerAccount(payload.workerId, {
      accountStatus:  ACCOUNT_STATUS.INACTIVE,
      presenceStatus: WORKER_PRESENCE_STATUS.OFFLINE,
    })
    workers.value = workers.value.map(w =>
      w.id === payload.workerId
        ? { ...w, accountStatus: ACCOUNT_STATUS.INACTIVE, presenceStatus: WORKER_PRESENCE_STATUS.OFFLINE }
        : w,
    )
    showDeactivateModal.value = false
    showToast('작업자가 비활성화되었습니다.', 'warning')
  } catch (e) {
    showToast('비활성화 중 오류가 발생했습니다.', 'error')
  }
}

// ── 컬럼 정의
const columns = [
  { key: 'id',            label: '작업자 코드', width: '130px' },
  { key: 'name',          label: '이름',        width: '100px' },
  { key: 'zones',         label: '담당 구역',   width: '120px' },
  { key: 'presenceStatus', label: '현재 상태',  width: '150px', align: 'center' },
  { key: 'accountStatus', label: '계정 상태',   width: '110px', align: 'center' },
  { key: 'lastWorkAt',    label: '마지막 작업', width: '150px' },
  { key: 'registeredAt',  label: '등록일',      width: '110px' },
  { key: 'actions',       label: '작업',        width: '130px', align: 'center' },
]

const breadcrumb = [
  { label: 'CONK' },
  { label: '사용자 관리' },
  { label: '작업자 계정' },
]
</script>

<template>
  <AppLayout title="작업자 계정 관리" :breadcrumb="breadcrumb" :loading="loading">

    <!-- ── 상단 액션 ───────────────────────────────── -->
    <template #header-action>
      <button class="ui-btn ui-btn--primary" @click="showCreateModal = true">
        <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
          <path d="M6.5 2v9M2 6.5h9" stroke-linecap="round"/>
        </svg>
        작업자 추가
      </button>
    </template>

    <!-- ── KPI 카드 ────────────────────────────────── -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">전체 작업자</div>
        <div class="kpi-value">{{ kpiTotal }}</div>
        <div class="kpi-sub">등록된 작업자</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">현재 활성</div>
        <div class="kpi-value kpi-value--green">{{ kpiActive }}</div>
        <div class="kpi-sub">로그인 가능</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">비활성</div>
        <div class="kpi-value kpi-value--muted">{{ kpiInactive }}</div>
        <div class="kpi-sub">계정 정지 상태</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">현재 작업 중</div>
        <div class="kpi-value kpi-value--blue">{{ kpiWorking }}</div>
        <div class="kpi-sub">피킹 / Put-away</div>
      </div>
    </div>

    <!-- ── 목록 카드 ───────────────────────────────── -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">작업자 목록</span>
      </div>

      <!-- 필터 바 -->
      <div class="filter-bar">
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="6.5" cy="6.5" r="4"/>
            <path d="M10 10l3 3" stroke-linecap="round"/>
          </svg>
          <input
            v-model="searchText"
            class="search-input"
            type="text"
            placeholder="이름, 작업자 코드 검색..."
          />
        </div>
        <select v-model="filterAccountStatus" class="select-filter">
          <option value="">전체 상태</option>
          <option :value="ACCOUNT_STATUS.ACTIVE">활성</option>
          <option :value="ACCOUNT_STATUS.TEMP_PASSWORD">임시비밀번호</option>
          <option :value="ACCOUNT_STATUS.INACTIVE">비활성</option>
        </select>
        <select v-model="filterZone" class="select-filter">
          <option value="">전체 구역</option>
          <option value="A">A 구역</option>
          <option value="B">B 구역</option>
          <option value="C">C 구역</option>
          <option value="D">D 구역</option>
        </select>
      </div>

      <!-- 테이블 -->
      <BaseTable
        :columns="columns"
        :rows="paged"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @page-change="p => currentPage = p"
      >
        <!-- 작업자 코드 -->
        <template #cell-id="{ row }">
          <span class="mono">{{ row.id }}</span>
        </template>

        <!-- 이름 -->
        <template #cell-name="{ row }">
          <span class="worker-name">{{ row.name }}</span>
        </template>

        <!-- 담당 구역 -->
        <template #cell-zones="{ row }">
          <div class="zone-list">
            <span v-for="z in (row.zones ?? [])" :key="z" class="zone-tag">{{ z }}</span>
            <span v-if="!row.zones?.length" class="text-muted">—</span>
          </div>
        </template>

        <!-- 현재 상태 -->
        <template #cell-presenceStatus="{ row }">
          <StatusBadge :status="row.presenceStatus" type="workerPresence" />
        </template>

        <!-- 계정 상태 -->
        <template #cell-accountStatus="{ row }">
          <StatusBadge :status="row.accountStatus" type="account" />
        </template>

        <!-- 마지막 작업 -->
        <template #cell-lastWorkAt="{ row }">
          <span class="text-muted">{{ row.lastWorkAt ? row.lastWorkAt.replace('T', ' ').slice(0, 16) : '—' }}</span>
        </template>

        <!-- 등록일 -->
        <template #cell-registeredAt="{ row }">
          <span class="text-muted">{{ row.registeredAt }}</span>
        </template>

        <!-- 작업 버튼 -->
        <template #cell-actions="{ row }">
          <div class="action-row">
            <button class="ui-btn ui-btn--ghost ui-btn--sm" @click="openEditModal(row)">편집</button>
            <button
              v-if="row.accountStatus !== ACCOUNT_STATUS.INACTIVE"
              class="ui-btn ui-btn--ghost ui-btn--sm"
              @click="openDeactivateModal(row)"
            >
              비활성화
            </button>
            <button
              v-else
              class="ui-btn ui-btn--ghost ui-btn--sm"
              @click="openEditModal(row)"
            >
              활성화
            </button>
          </div>
        </template>
      </BaseTable>
    </div>

    <!-- ── 모달 ──────────────────────────────────── -->
    <CreateWorkerModal
      :isOpen="showCreateModal"
      @confirm="handleCreate"
      @cancel="showCreateModal = false"
    />

    <EditWorkerModal
      :isOpen="showEditModal"
      :worker="targetWorker"
      @confirm="handleEdit"
      @reset-password="handleResetPassword"
      @cancel="showEditModal = false"
    />

    <DeactivateWorkerModal
      :isOpen="showDeactivateModal"
      :worker="targetWorker"
      @confirm="handleDeactivate"
      @cancel="showDeactivateModal = false"
    />

    <!-- ── 토스트 ─────────────────────────────────── -->
    <ToastMessage
      v-model:visible="toast.visible"
      :message="toast.message"
      :type="toast.type"
    />
  </AppLayout>
</template>

<style scoped>
/* ── KPI 카드 ───────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.kpi-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.kpi-value {
  font-family: var(--font-condensed);
  font-size: 2rem;
  font-weight: 700;
  color: var(--t1);
  line-height: 1;
  margin-bottom: 4px;
}

.kpi-value--green { color: var(--green); }
.kpi-value--blue  { color: var(--blue);  }
.kpi-value--muted { color: var(--t3);   }

.kpi-sub {
  font-size: var(--font-size-xs);
  color: var(--t3);
}

/* ── 카드 ──────────────────────────────────────── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--t1);
}

/* ── 필터 바 ────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  width: 14px;
  height: 14px;
  color: var(--t3);
  pointer-events: none;
}

.search-input {
  height: 36px;
  padding: 0 12px 0 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
  width: 220px;
  outline: none;
  transition: border-color var(--ease-fast);
}

.search-input:focus { border-color: var(--blue); }

.select-filter {
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

/* ── 셀 헬퍼 ────────────────────────────────────── */
.mono         { font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--t2); }
.worker-name  { font-weight: 600; color: var(--t1); }
.text-muted   { color: var(--t3); font-size: var(--font-size-xs); }

.zone-list {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.zone-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--surface-2);
  border: 1px solid var(--border);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--t2);
}

.action-row {
  display: flex;
  gap: var(--space-1);
  justify-content: center;
}

/* ── 버튼 ──────────────────────────────────────── */
.ui-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  height: 36px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background var(--ease-fast), opacity var(--ease-fast);
}

.ui-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ui-btn--primary { background: var(--blue); color: #fff; }
.ui-btn--primary:not(:disabled):hover { opacity: 0.9; }
.ui-btn--ghost { border-color: var(--border); background: transparent; color: var(--t2); }
.ui-btn--ghost:not(:disabled):hover { background: var(--surface-2); color: var(--t1); }
.ui-btn--sm { height: 28px; font-size: var(--font-size-xs); }
</style>