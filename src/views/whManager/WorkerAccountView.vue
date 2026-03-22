<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import CreateWorkerModal from '@/components/whManager/CreateWorkerModal.vue'
import EditWorkerModal from '@/components/whManager/EditWorkerModal.vue'
import DeactivateWorkerModal from '@/components/whManager/DeactivateWorkerModal.vue'
import {
  getWhmWorkerAccounts,
  createWhmWorkerAccount,
  updateWhmWorkerAccount,
  getWhmBinFixedAssignments,
  updateBinFixedAssignment,
} from '@/api/wh-manager'
import { ACCOUNT_STATUS, WORKER_STATUS, WORKER_PRESENCE_STATUS } from '@/constants'

// ── 탭
const activeTab = ref('accounts')
const TABS = [
  { id: 'accounts', label: '작업자 계정 목록' },
  { id: 'bin',      label: 'Bin 배정 설정'    },
]

// ── 계정 탭 데이터
const workers = ref([])
const loading = ref(false)

// ── 계정 탭 필터
const searchText          = ref('')
const filterAccountStatus = ref('')

// ── 계정 탭 페이지네이션
const currentPage = ref(1)
const PAGE_SIZE   = 8

// ── 계정 탭 모달
const showCreateModal     = ref(false)
const showEditModal       = ref(false)
const showDeactivateModal = ref(false)
const targetWorker        = ref(null)

// ── Bin 배정 탭 데이터
const binFixed    = ref([])
const binLoading  = ref(false)
const editedBins  = ref({})   // { [binId]: { workerId, taskType, fallbackWorkerId, memo } }

// ── 토스트
const toast = ref({ visible: false, message: '', type: 'success' })
function showToast(message, type = 'success') {
  toast.value = { visible: true, message, type }
}

// ── 계정 탭: 데이터 로드
async function fetchWorkers() {
  loading.value = true
  try {
    const { data } = await getWhmWorkerAccounts()
    workers.value = data
  } catch {
    showToast('목록을 불러오지 못했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

// ── Bin 탭: 데이터 로드 (작업자 목록도 같이 가져와야 select 옵션 구성 가능)
async function fetchBinTab() {
  binLoading.value = true
  try {
    const [binRes, workerRes] = await Promise.all([
      getWhmBinFixedAssignments(),
      getWhmWorkerAccounts(),
    ])
    binFixed.value  = binRes.data
    workers.value   = workerRes.data
    // 편집 상태 초기화
    editedBins.value = {}
    binRes.data.forEach(b => {
      editedBins.value[b.id] = {
        workerId:         b.workerId ?? '',
        taskType:         b.taskType ?? '',
        fallbackWorkerId: b.fallbackWorkerId ?? '',
        memo:             b.memo ?? '',
      }
    })
  } catch {
    showToast('Bin 배정 정보를 불러오지 못했습니다.', 'error')
  } finally {
    binLoading.value = false
  }
}

async function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'accounts' && !workers.value.length) fetchWorkers()
  if (tab === 'bin') fetchBinTab()
}

onMounted(fetchWorkers)

watch([searchText, filterAccountStatus], () => {
  currentPage.value = 1
})

// ── 활성 작업자 목록 (Bin 배정 select 옵션용)
const activeWorkers = computed(() =>
  workers.value.filter(w => w.accountStatus === ACCOUNT_STATUS.ACTIVE)
)

// ── KPI
const kpiTotal    = computed(() => workers.value.length)
const kpiActive   = computed(() => workers.value.filter(w => w.accountStatus === ACCOUNT_STATUS.ACTIVE).length)
const kpiInactive = computed(() => workers.value.filter(w => w.accountStatus === ACCOUNT_STATUS.INACTIVE).length)

// ── 클라이언트 필터링
const filtered = computed(() => {
  let list = workers.value
  if (filterAccountStatus.value) list = list.filter(w => w.accountStatus === filterAccountStatus.value)
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
    showToast('비활성화 중 오류가 발생했습니다.', 'error')
  }
}

// ── Bin 배정 저장
async function saveBin(bin) {
  const edited = editedBins.value[bin.id]
  if (!edited) return
  const selectedWorker = workers.value.find(w => w.id === edited.workerId)
  const fallbackWorker = workers.value.find(w => w.id === edited.fallbackWorkerId)
  try {
    await updateBinFixedAssignment(bin.id, {
      workerId:           edited.workerId,
      workerName:         selectedWorker?.name ?? '',
      taskType:           edited.taskType,
      fallbackWorkerId:   edited.fallbackWorkerId,
      fallbackWorkerName: fallbackWorker?.name ?? '',
      memo:               edited.memo,
    })
    // 로컬 데이터 반영
    binFixed.value = binFixed.value.map(b =>
      b.id === bin.id
        ? {
            ...b,
            workerId:           edited.workerId,
            workerName:         selectedWorker?.name ?? b.workerName,
            taskType:           edited.taskType,
            fallbackWorkerId:   edited.fallbackWorkerId,
            fallbackWorkerName: fallbackWorker?.name ?? '',
            memo:               edited.memo,
          }
        : b
    )
    showToast(`Bin ${bin.bin} 배정이 저장되었습니다.`)
  } catch {
    showToast('저장 중 오류가 발생했습니다.', 'error')
  }
}

// ── 컬럼 정의
const columns = [
  { key: 'id',            label: '작업자 코드', width: '130px' },
  { key: 'name',          label: '이름',        width: '100px' },
  { key: 'accountStatus', label: '계정 상태',   width: '110px', align: 'center' },
  { key: 'registeredAt',  label: '등록일',      width: '110px' },
  { key: 'actions',       label: '관리',        width: '130px', align: 'center' },
]

const breadcrumb = [
  { label: 'CONK' },
  { label: '사용자 관리' },
  { label: '작업자 계정 관리' },
]
</script>

<template>
  <AppLayout title="작업자 계정 관리" :breadcrumb="breadcrumb" :loading="loading || binLoading">

    <template #header-action>
      <button
        v-if="activeTab === 'accounts'"
        class="ui-btn ui-btn--primary"
        @click="showCreateModal = true"
      >
        <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
          <path d="M6.5 2v9M2 6.5h9" stroke-linecap="round"/>
        </svg>
        작업자 추가
      </button>
    </template>

    <!-- ── 탭 바 ── -->
    <div class="tab-bar">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        class="tab-item"
        :class="{ active: activeTab === tab.id }"
        @click="switchTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ══════════════════════════════════
         탭: 작업자 계정 목록
    ═══════════════════════════════════ -->
    <div v-show="activeTab === 'accounts'">
      <!-- KPI 카드 -->
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
      </div>

      <!-- 목록 카드 -->
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
          <template #cell-id="{ row }">
            <span class="mono">{{ row.id }}</span>
          </template>

          <template #cell-name="{ row }">
            <span class="worker-name">{{ row.name }}</span>
          </template>

          <template #cell-accountStatus="{ row }">
            <StatusBadge :status="row.accountStatus" type="account" />
          </template>

          <template #cell-registeredAt="{ row }">
            <span class="text-muted">{{ row.registeredAt }}</span>
          </template>

          <template #cell-actions="{ row }">
            <div class="action-row">
              <button class="ui-btn ui-btn--ghost ui-btn--sm" @click="openEditModal(row)">상세</button>
              <button
                v-if="row.accountStatus !== ACCOUNT_STATUS.INACTIVE"
                class="ui-btn ui-btn--ghost ui-btn--sm"
                @click="openDeactivateModal(row)"
              >비활성화</button>
              <button
                v-else
                class="ui-btn ui-btn--ghost ui-btn--sm"
                @click="openEditModal(row)"
              >활성화</button>
            </div>
          </template>
        </BaseTable>
      </div>
    </div>

    <!-- ══════════════════════════════════
         탭: Bin 배정 설정
    ═══════════════════════════════════ -->
    <div v-show="activeTab === 'bin'">
      <!-- 안내 배너 -->
      <div class="info-banner">
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="flex-shrink:0">
          <circle cx="7" cy="7" r="5.5"/><path d="M7 5v4M7 3.5v.5" stroke-linecap="round"/>
        </svg>
        <p>
          각 Bin에 담당 작업자를 고정 배정합니다.
          ASN 입고 시 해당 Bin의 작업자에게 <strong>검수&amp;적재</strong> 작업이,
          출고 지시 시 <strong>피킹&amp;패킹</strong> 작업이 자동으로 배정됩니다.
          작업자를 비활성화하면 해당 Bin의 배정이 해제되니 반드시 재배정하세요.
        </p>
      </div>

      <!-- Bin 배정 테이블 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Bin-작업자 고정 배정 현황</span>
        </div>
        <div class="table-wrap">
          <table class="bin-table">
            <thead>
              <tr>
                <th>Bin 위치</th>
                <th>담당 작업자</th>
                <th>작업 유형</th>
                <th>Fallback 작업자</th>
                <th>메모</th>
                <th>저장</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="binLoading">
                <td colspan="6" class="empty-cell">불러오는 중...</td>
              </tr>
              <tr v-else-if="!binFixed.length">
                <td colspan="6" class="empty-cell">배정된 Bin이 없습니다.</td>
              </tr>
              <template v-else>
                <tr
                  v-for="bin in binFixed"
                  :key="bin.id"
                  :class="{ 'row--warn': !editedBins[bin.id]?.workerId }"
                >
                  <td><span class="bin-tag">{{ bin.bin }}</span></td>
                  <td>
                    <select
                      v-model="editedBins[bin.id].workerId"
                      class="cell-select"
                      :class="{ 'cell-select--warn': !editedBins[bin.id]?.workerId }"
                    >
                      <option value="">— 미배정 —</option>
                      <option
                        v-for="w in activeWorkers"
                        :key="w.id"
                        :value="w.id"
                      >{{ w.name }} ({{ w.id }})</option>
                    </select>
                  </td>
                  <td>
                    <select v-model="editedBins[bin.id].taskType" class="cell-select">
                      <option value="">— 선택 —</option>
                      <option :value="WORKER_STATUS.INSPECTION_LOADING">검수&amp;적재</option>
                      <option :value="WORKER_STATUS.PICKING_PACKING">피킹&amp;패킹</option>
                    </select>
                  </td>
                  <td>
                    <select v-model="editedBins[bin.id].fallbackWorkerId" class="cell-select">
                      <option value="">— 없음 —</option>
                      <option
                        v-for="w in activeWorkers"
                        :key="w.id"
                        :value="w.id"
                        :disabled="w.id === editedBins[bin.id]?.workerId"
                      >{{ w.name }}</option>
                    </select>
                  </td>
                  <td>
                    <input
                      v-model="editedBins[bin.id].memo"
                      class="cell-input"
                      type="text"
                      placeholder="메모 입력"
                    />
                  </td>
                  <td>
                    <button class="ui-btn ui-btn--primary ui-btn--sm" @click="saveBin(bin)">저장</button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── 모달 ── -->
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

    <ToastMessage
      v-model:visible="toast.visible"
      :message="toast.message"
      :type="toast.type"
    />
  </AppLayout>
</template>

<style scoped>
/* ── 탭 바 ── */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-4);
}

.tab-item {
  padding: 10px 20px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--t3);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.tab-item:hover { color: var(--t2); }
.tab-item.active { color: var(--blue); border-bottom-color: var(--blue); font-weight: 700; }

/* ── KPI 카드 ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
.kpi-value--muted { color: var(--t3);   }

.kpi-sub {
  font-size: var(--font-size-xs);
  color: var(--t3);
}

/* ── 카드 ── */
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

/* ── 필터 바 ── */
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

/* ── 셀 헬퍼 ── */
.mono         { font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--t2); }
.worker-name  { font-weight: 600; color: var(--t1); }
.text-muted   { color: var(--t3); font-size: var(--font-size-xs); }

.action-row { display: flex; gap: var(--space-1); justify-content: center; }

/* ── 안내 배너 ── */
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: var(--blue-pale);
  color: var(--blue);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
}
.info-banner p { margin: 0; line-height: 1.6; }
.info-banner strong { font-weight: 700; }

/* ── Bin 배정 테이블 ── */
.table-wrap { overflow-x: auto; }

.bin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.bin-table th,
.bin-table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.bin-table th {
  background: var(--surface-2);
  color: var(--t3);
  font-weight: 600;
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.bin-table tbody tr:hover { background: var(--surface-2); }

.row--warn { background: rgba(245, 166, 35, 0.05); }

.bin-tag {
  display: inline-block;
  padding: 2px 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--t2);
}

.cell-select {
  width: 100%;
  min-width: 160px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
}
.cell-select--warn { border-color: var(--amber); }

.cell-input {
  width: 100%;
  min-width: 140px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
  outline: none;
}
.cell-input:focus { border-color: var(--blue); }

.empty-cell {
  text-align: center;
  color: var(--t3);
  padding: 40px !important;
}

/* ── 버튼 ── */
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