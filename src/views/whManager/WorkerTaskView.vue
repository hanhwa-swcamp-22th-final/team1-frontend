<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'
import AssignTaskModal from '@/components/whManager/AssignTaskModal.vue'
import WorkerLogModal from '@/components/whManager/WorkerLogModal.vue'
import AsnDetailModal from '@/components/whManager/AsnDetailModal.vue'
import AsnMismatchModal from '@/components/whManager/AsnMismatchModal.vue'
import {
  getWhmWorkerAccounts,
  getWhmTasks,
  assignTask,
  getWhmInboundAsns,
  getWhmBinFixedAssignments,
  updateWorkerZones,
} from '@/api/wh-manager'
import {
  ACCOUNT_STATUS,
  TASK_STATUS,
  TASK_ASSIGN_TYPE,
  WORKER_STATUS,
  WORKER_PRESENCE_STATUS,
} from '@/constants'

// ── 탭 정의
const activeTab = ref('workers')
const TABS = [
  { id: 'workers',  label: '작업자 현황'   },
  { id: 'tasks',    label: '전체 작업 목록' },
  { id: 'bin',      label: 'Bin 사전 배정'  },
  { id: 'pending',  label: '입고 대기'      },
  { id: 'transit',  label: '운송 중'        },
  { id: 'received', label: '검수 완료'      },
  { id: 'mismatch', label: '수량 불일치'    },
]

// ── 데이터 상태
const loading     = ref(false)
const workers     = ref([])
const tasks       = ref([])
const binFixed    = ref([])
const inboundAsns = ref([])

// ── 모달 상태
const showAssignModal = ref(false)
const showWorkerLog   = ref(false)
const showAsnDetail   = ref(false)
const showAsnMismatch = ref(false)
const targetTask      = ref(null)
const targetWorker    = ref(null)
const targetAsn       = ref(null)

// ── Toast
const toast = ref({ show: false, msg: '', type: 'success' })
function showToast(msg, type = 'success') {
  toast.value = { show: true, msg, type }
}

// ─────────────────────────────────────────────
// 작업자 카드 헬퍼 (BIN 기반)
// ─────────────────────────────────────────────

/** 해당 작업자에게 고정 배정된 Bin 목록 */
function getWorkerBins(workerId) {
  return binFixed.value.filter(b => b.workerId === workerId)
}

/** 해당 작업자의 현재 작업 목록 */
function getWorkerTasks(workerId) {
  return tasks.value.filter(t => t.workerId === workerId)
}

/** 작업자 통계: 오늘 배정 건수 + 완료율 */
function getWorkerStats(workerId) {
  const wt    = getWorkerTasks(workerId)
  const total = wt.length
  const done  = wt.filter(t => t.status === TASK_STATUS.COMPLETED).length
  return { assigned: total, rate: total > 0 ? Math.round((done / total) * 100) : 0 }
}

/** IN_PROGRESS / PARTIAL_DONE 작업이 있으면 카드 강조 */
function isWorkerActive(workerId) {
  return getWorkerTasks(workerId).some(
    t => t.status === TASK_STATUS.IN_PROGRESS || t.status === TASK_STATUS.PARTIAL_DONE
  )
}

/** 작업 상태에 따른 타임라인 dot 색상 */
function taskDotColor(status) {
  const map = {
    [TASK_STATUS.IN_PROGRESS]:  'var(--amber)',
    [TASK_STATUS.PARTIAL_DONE]: 'var(--amber)',
    [TASK_STATUS.COMPLETED]:    'var(--green)',
    [TASK_STATUS.REVIEW_NEEDED]:'var(--red)',
    [TASK_STATUS.WAITING]:      'var(--border-1)',
  }
  return map[status] ?? 'var(--border-1)'
}

/** 작업 유형 한글 표시 */
function taskTypeLabel(type) {
  if (type === WORKER_STATUS.INSPECTION_LOADING) return '검수&적재'
  if (type === WORKER_STATUS.PICKING_PACKING)    return '피킹&패킹'
  return type ?? '-'
}

/** 작업 카드 아바타 색상 (index 순환) */
const AVATAR_COLORS = [
  { bg: 'var(--gold-pale)',   color: '#92400e'       },
  { bg: 'var(--blue-pale)',   color: 'var(--blue)'   },
  { bg: 'var(--green-pale)',  color: '#065f46'        },
  { bg: 'var(--purple-pale)', color: 'var(--purple)'  },
  { bg: 'var(--red-pale)',    color: 'var(--red)'     },
]
function avatarStyle(index) {
  const c = AVATAR_COLORS[index % AVATAR_COLORS.length]
  return { background: c.bg, color: c.color }
}

/** Zone 목록을 "A/B 존 전담" 형태로 표시 */
function zoneLabel(zones) {
  if (!zones?.length) return ''
  return zones.join('/') + ' 존 전담'
}

// ── 필터 (tasks 탭)
const filterWorker = ref('')
const filterType   = ref('')
const filterStatus = ref('')
const searchQuery  = ref('')

const TASK_STATUS_LABEL = {
  [TASK_STATUS.WAITING]:       '대기',
  [TASK_STATUS.IN_PROGRESS]:   '진행중',
  [TASK_STATUS.PARTIAL_DONE]:  '부분완료',
  [TASK_STATUS.COMPLETED]:     '완료',
  [TASK_STATUS.REVIEW_NEEDED]: '검토 필요',
}

const filteredTasks = computed(() => {
  let list = tasks.value
  if (filterWorker.value) list = list.filter(t => t.workerId === filterWorker.value)
  if (filterType.value)   list = list.filter(t => t.type    === filterType.value)
  if (filterStatus.value) list = list.filter(t => t.status  === filterStatus.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(t =>
      t.id.toLowerCase().includes(q) || (t.refDoc ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

// ── KPI (workers + tasks 데이터 기반)
const kpiActive       = computed(() => workers.value.filter(w => w.accountStatus === ACCOUNT_STATUS.ACTIVE).length)
const kpiAutoAssigned = computed(() => tasks.value.filter(t => t.assignType === TASK_ASSIGN_TYPE.AUTO).length)
const kpiReviewNeeded = computed(() => tasks.value.filter(t => t.status === TASK_STATUS.REVIEW_NEEDED).length)
const kpiCompleted    = computed(() => tasks.value.filter(t => t.status === TASK_STATUS.COMPLETED).length)
const kpiAutoRate     = computed(() => {
  if (!tasks.value.length) return '-'
  return Math.round((kpiAutoAssigned.value / tasks.value.length) * 100) + '%'
})

// ── 우선 검토 큐
const reviewNeededTasks = computed(() => tasks.value.filter(t => t.status === TASK_STATUS.REVIEW_NEEDED))

// ── Bin 탭 KPI
const kpiBinCount    = computed(() => binFixed.value.length)
const kpiBinReassign = computed(() =>
  binFixed.value.filter(b => {
    const w = workers.value.find(w => w.id === b.workerId)
    return w?.accountStatus === ACCOUNT_STATUS.INACTIVE
  }).length
)

// ── Zone 편집 상태
const editedZones = ref({})
const ZONES = ['A', 'B', 'C', 'D']

function toggleZone(workerId, zone) {
  const zones = editedZones.value[workerId] ?? []
  editedZones.value[workerId] = zones.includes(zone)
    ? zones.filter(z => z !== zone)
    : [...zones, zone]
}

async function saveWorkerZones(worker) {
  try {
    await updateWorkerZones(worker.id, editedZones.value[worker.id])
    showToast(`${worker.name} Zone 배정이 저장되었습니다.`)
  } catch {
    showToast('저장 중 오류가 발생했습니다.', 'error')
  }
}

// ── 브레드크럼
const breadcrumb = [{ label: 'CONK' }, { label: '사용자 관리' }, { label: '작업자 업무' }]

// ── 탭 전환 + 데이터 로드
async function switchTab(tab) {
  activeTab.value = tab
  await loadTabData(tab)
}

async function loadTabData(tab) {
  loading.value = true
  try {
    if (tab === 'workers') {
      // workers 탭은 카드에 Bin 표시가 필요하므로 3개 API 동시 호출
      const [wa, tk, bf] = await Promise.all([
        getWhmWorkerAccounts(),
        getWhmTasks(),
        getWhmBinFixedAssignments(),
      ])
      workers.value  = wa.data
      tasks.value    = tk.data
      binFixed.value = bf.data
    } else if (tab === 'tasks') {
      const [wa, tk] = await Promise.all([getWhmWorkerAccounts(), getWhmTasks()])
      workers.value = wa.data
      tasks.value   = tk.data
    } else if (tab === 'bin') {
      const [wa, bf, tk] = await Promise.all([
        getWhmWorkerAccounts(),
        getWhmBinFixedAssignments(),
        getWhmTasks(),
      ])
      workers.value  = wa.data
      binFixed.value = bf.data
      tasks.value    = tk.data
      editedZones.value = {}
      wa.data.forEach(w => { editedZones.value[w.id] = [...(w.zones ?? [])] })
    } else {
      const { data } = await getWhmInboundAsns({ inboundStatus: tab })
      inboundAsns.value = data
    }
  } catch {
    showToast('데이터를 불러오지 못했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

// ── 모달 핸들러
function openAssignModal(target, fromWorker = null) {
  targetTask.value   = target instanceof Object && 'id' in target && 'type' in target ? target : null
  targetWorker.value = fromWorker
  showAssignModal.value = true
}

async function handleAssignConfirm(payload) {
  try {
    await assignTask(payload.taskId, { workerId: payload.workerId, status: TASK_STATUS.WAITING })
    tasks.value = tasks.value.map(t =>
      t.id === payload.taskId
        ? { ...t, workerId: payload.workerId, status: TASK_STATUS.WAITING }
        : t
    )
    showAssignModal.value = false
    showToast('작업 배정이 완료되었습니다.')
  } catch {
    showToast('배정 중 오류가 발생했습니다.', 'error')
  }
}

function openWorkerLog(worker) {
  const wt   = getWorkerTasks(worker.id)
  const bins = getWorkerBins(worker.id)
  targetWorker.value = {
    ...worker,
    todayCompleted:  wt.filter(t => t.status === TASK_STATUS.COMPLETED).length,
    avgProcessTime:  '-',
    mismatchCount:   0,
    fixedBinCount:   bins.length,
    currentTasks: wt
      .filter(t => t.status !== TASK_STATUS.COMPLETED)
      .map(t => ({ id: t.id, refDoc: t.refDoc, type: taskTypeLabel(t.type), status: t.status })),
    recentTasks: wt
      .filter(t => t.status === TASK_STATUS.COMPLETED)
      .map(t => ({
        id: t.id, doneAt: t.completedAt ?? '-',
        type: taskTypeLabel(t.type), qty: '-', result: t.status,
      })),
  }
  showWorkerLog.value = true
}
function openAsnDetail(asn) {
  // AsnDetailModal은 status 필드를 사용하므로 inboundStatus를 status로 매핑
  targetAsn.value = { ...asn, status: asn.inboundStatus ?? asn.status }
  showAsnDetail.value = true
}
function openAsnMismatch(asn)  { targetAsn.value = asn;  showAsnMismatch.value = true }

onMounted(() => loadTabData('workers'))

// ── Tasks 탭 컬럼
const taskColumns = [
  { key: 'id',          label: '작업 ID',    sortable: true  },
  { key: 'type',        label: '유형'                        },
  { key: 'sellerCompany', label: '셀러사'                    },
  { key: 'refDoc',      label: '기준 문서'                   },
  { key: 'bins',        label: '담당 Bin'                    },
  { key: 'workerName',  label: '담당 작업자'                 },
  { key: 'status',      label: '상태'                        },
  { key: 'assignType',  label: '배정 방식'                   },
  { key: 'actions',     label: '작업',        width: '90px'  },
]

// ── Bin 고정 배정 컬럼
const binFixedColumns = [
  { key: 'bin',              label: 'Bin'        },
  { key: 'workerName',       label: '작업자'     },
  { key: 'taskType',         label: '작업유형'   },
  { key: 'latestRefDoc',     label: '최근 문서'  },
  { key: 'fallbackWorkerName', label: 'Fallback' },
  { key: 'memo',             label: '메모'       },
]
</script>

<template>
  <AppLayout title="작업자 업무 관리" :breadcrumb="breadcrumb" :loading="loading">
    <template #header-action>
      <button class="btn btn--primary" @click="openAssignModal(null)">
        <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
          <rect x="1" y="1" width="11" height="11" rx="1"/>
          <path d="M4 4h5M4 6.5h5M4 9h3" stroke-linecap="round"/>
        </svg>
        작업 배정
      </button>
    </template>

    <!-- ── 상단 KPI 4개 ── -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">활성 작업자</div>
        <div class="kpi-value">{{ kpiActive }}</div>
        <div class="kpi-sub">금일 출근 기준</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">자동 배정 완료</div>
        <div class="kpi-value kpi-blue">{{ kpiAutoAssigned }}</div>
        <div class="kpi-sub">Worker-Bin 규칙 반영</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">관리자 검토 필요</div>
        <div class="kpi-value kpi-amber">{{ kpiReviewNeeded }}</div>
        <div class="kpi-sub">수동 조정 대기</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">오늘 완료 작업</div>
        <div class="kpi-value kpi-green">{{ kpiCompleted }}</div>
        <div class="kpi-sub">검수·적재 / 피킹·패킹 합산</div>
      </div>
    </div>

    <!-- ── 안내 배너 ── -->
    <div class="info-banner">
      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="flex-shrink:0;">
        <circle cx="7" cy="7" r="5.5"/><path d="M7 5v4M7 3.5v.5" stroke-linecap="round"/>
      </svg>
      <p>작업자는 사전 배정된 <strong>Bin</strong> 범위 안에서 작업을 자동 수신합니다. 창고 관리자는 예외 건(검토 필요)만 수동 배정 및 재조정합니다.</p>
    </div>

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
        <span v-if="tab.id === 'mismatch' && kpiReviewNeeded > 0" class="tab-badge">
          {{ kpiReviewNeeded }}
        </span>
      </button>
    </div>

    <!-- ═══════════════════════════════════════
         탭: 작업자 현황
    ════════════════════════════════════════ -->
    <div v-show="activeTab === 'workers'" class="tab-panel panel-pad">
      <!-- 작업자 카드 그리드 -->
      <div class="worker-grid">
        <article
          v-for="(worker, idx) in workers"
          :key="worker.id"
          class="worker-card"
          :class="{ highlight: isWorkerActive(worker.id) }"
        >
          <!-- 헤더 -->
          <div class="worker-head">
            <div class="worker-avatar" :style="avatarStyle(idx)">{{ worker.name?.charAt(0) }}</div>
            <div class="worker-meta">
              <div class="worker-name">{{ worker.name }}</div>
              <div class="worker-code">{{ worker.id }} · {{ zoneLabel(worker.zones) }}</div>
            </div>
            <StatusBadge :status="worker.presenceStatus" type="workerPresence" />
          </div>

          <!-- 통계 2열 -->
          <div class="worker-stats">
            <div class="worker-stat">
              <div class="worker-stat-label">오늘 배정</div>
              <div class="worker-stat-value">{{ getWorkerStats(worker.id).assigned }}건</div>
            </div>
            <div class="worker-stat">
              <div class="worker-stat-label">완료율</div>
              <div class="worker-stat-value">{{ getWorkerStats(worker.id).rate }}%</div>
            </div>
          </div>

          <!-- 담당 Bin (Bin 단위 표시) -->
          <div>
            <div class="sub-title" style="margin-bottom:8px;">담당 Bin</div>
            <div class="bin-list">
              <span v-if="getWorkerBins(worker.id).length" v-for="b in getWorkerBins(worker.id)" :key="b.bin" class="location-tag">
                {{ b.bin }}
              </span>
              <span v-else class="location-tag location-tag--empty">미배정</span>
            </div>
          </div>

          <!-- 진행 중 작업 목록 -->
          <div v-if="getWorkerTasks(worker.id).length" class="task-list">
            <div v-for="t in getWorkerTasks(worker.id)" :key="t.id" class="task-entry">
              <div class="task-dot" :style="{ background: taskDotColor(t.status) }"></div>
              <div class="task-copy">
                <div class="task-title">{{ t.refDoc }} · {{ taskTypeLabel(t.type) }}</div>
                <div class="task-desc">Bin: {{ t.bins?.join(', ') || '미배정' }}</div>
              </div>
              <StatusBadge :status="t.status" type="taskStatus" />
            </div>
          </div>
          <p v-else class="task-empty">진행 중인 작업 없음</p>

          <!-- 액션 -->
          <div class="worker-actions">
            <button class="btn btn--assign btn--sm" @click="openAssignModal(null, worker)">
              <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.8" width="12" height="12">
                <rect x="1" y="1" width="11" height="11" rx="1.5"/>
                <path d="M4 4.5h5M4 7h3M9 9l1.5 1.5L13 8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              예외 작업 배정
            </button>
            <button class="btn btn--log btn--sm" @click="openWorkerLog(worker)">
              <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.8" width="12" height="12">
                <circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 4v3l2 1" stroke-linecap="round"/>
              </svg>
              작업 이력
            </button>
          </div>
        </article>
      </div>

      <!-- 하단: 검토 큐 + 운영 메모 (2fr/1fr) -->
      <div class="queue-grid">
        <!-- 우선 검토 큐 -->
        <div class="summary-box">
          <div class="summary-title">우선 검토 큐</div>
          <div v-if="reviewNeededTasks.length" class="priority-list">
            <div v-for="t in reviewNeededTasks" :key="t.id" class="priority-item">
              <div class="priority-copy">
                <div class="priority-main">{{ t.refDoc }} · {{ taskTypeLabel(t.type) }}</div>
                <div class="priority-sub">{{ t.sellerCompany }} · 수동 배정 필요</div>
              </div>
              <button class="btn btn--primary btn--sm" @click="openAssignModal(t)">배정</button>
            </div>
          </div>
          <p v-else class="task-empty">검토 필요 작업이 없습니다.</p>
        </div>

        <!-- 운영 메모 -->
        <div class="summary-box">
          <div class="summary-title">오늘의 운영 메모</div>
          <div class="priority-list">
            <div class="priority-item">
              <div class="priority-copy">
                <div class="priority-main">자동 배정률 {{ kpiAutoRate }}</div>
                <div class="priority-sub">예외 {{ kpiReviewNeeded }}건만 수동 조정 필요</div>
              </div>
            </div>
            <div class="priority-item">
              <div class="priority-copy">
                <div class="priority-main">완료 작업 {{ kpiCompleted }}건</div>
                <div class="priority-sub">검수·적재 / 피킹·패킹 합산</div>
              </div>
            </div>
            <div class="priority-item">
              <div class="priority-copy">
                <div class="priority-main">작업 이력 조회 가능</div>
                <div class="priority-sub">작업자별 최근 완료 작업과 처리 현황을 모달에서 확인</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════
         탭: 전체 작업 목록
    ════════════════════════════════════════ -->
    <div v-show="activeTab === 'tasks'" class="tab-panel">
      <div class="filter-bar">
        <select v-model="filterWorker" class="select-filter">
          <option value="">전체 작업자</option>
          <option v-for="w in workers" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
        <select v-model="filterType" class="select-filter">
          <option value="">전체 유형</option>
          <option :value="WORKER_STATUS.INSPECTION_LOADING">검수&amp;적재</option>
          <option :value="WORKER_STATUS.PICKING_PACKING">피킹&amp;패킹</option>
        </select>
        <select v-model="filterStatus" class="select-filter">
          <option value="">전체 상태</option>
          <option v-for="(val, key) in TASK_STATUS" :key="key" :value="val">{{ TASK_STATUS_LABEL[val] }}</option>
        </select>
        <div class="search-wrap">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" class="search-icon">
            <circle cx="6.5" cy="6.5" r="4"/><path d="M10 10l3 3" stroke-linecap="round"/>
          </svg>
          <input v-model="searchQuery" class="search-input" type="text" placeholder="ASN 번호, 피킹리스트 번호, 작업 ID 검색..." />
        </div>
      </div>

      <BaseTable :columns="taskColumns" :rows="filteredTasks" :loading="loading" :pagination="null">
        <template #cell-type="{ row }">
          <StatusBadge :status="row.type" type="worker" />
        </template>
        <template #cell-bins="{ row }">
          <span class="bin-chips">
            <span v-if="row.bins?.length" v-for="b in row.bins" :key="b" class="location-tag">{{ b }}</span>
            <span v-else class="location-tag location-tag--empty">미배정</span>
          </span>
        </template>
        <template #cell-status="{ row }">
          <StatusBadge :status="row.status" type="taskStatus" />
        </template>
        <template #cell-assignType="{ row }">
          <StatusBadge :status="row.assignType" type="taskAssignType" />
        </template>
        <template #cell-actions="{ row }">
          <button
            v-if="row.status === TASK_STATUS.REVIEW_NEEDED"
            class="btn btn--primary btn--sm"
            @click="openAssignModal(row)"
          >배정</button>
          <button v-else class="btn btn--ghost btn--sm" @click="openAssignModal(row)">조정</button>
        </template>
      </BaseTable>
    </div>

    <!-- ═══════════════════════════════════════
         탭: Bin 사전 배정
    ════════════════════════════════════════ -->
    <div v-show="activeTab === 'bin'" class="tab-panel panel-pad">
      <!-- 정책 안내 -->
      <div class="matrix-note">
        <div>
          <strong>Worker-Bin 사전 배정 정책</strong>
          <div class="matrix-note__sub">
            한 Bin은 한 명의 작업자에게만 고정 배정됩니다. 작업자 비활성화 시 해당 Bin은 즉시 재배정 검토 큐로 이동합니다.
          </div>
        </div>
        <button class="btn btn--primary btn--sm" @click="showToast('사전 배정 기준이 저장되었습니다.')">배정 정책 저장</button>
      </div>

      <!-- mini KPI 3개 -->
      <div class="mini-kpis">
        <div class="mini-kpi">
          <div class="mini-kpi__label">고정 배정 Bin</div>
          <div class="mini-kpi__value">{{ kpiBinCount }}</div>
        </div>
        <div class="mini-kpi">
          <div class="mini-kpi__label">재배정 필요</div>
          <div class="mini-kpi__value" style="color:var(--amber);">{{ kpiBinReassign }}</div>
        </div>
        <div class="mini-kpi">
          <div class="mini-kpi__label">자동 배정 예상률</div>
          <div class="mini-kpi__value" style="color:var(--blue);">{{ kpiAutoRate }}</div>
        </div>
      </div>

      <!-- 작업자별 담당 Zone (정책 설정) -->
      <div class="card">
        <div class="card-header-row"><span class="card-title">작업자별 담당 존</span></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>작업자</th>
                <th>코드</th>
                <th>상태</th>
                <th v-for="z in ZONES" :key="z" class="cell-center">{{ z }} 존</th>
                <th>저장</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="worker in workers"
                :key="worker.id"
                :class="{ 'row--inactive': worker.accountStatus === ACCOUNT_STATUS.INACTIVE }"
              >
                <td><strong>{{ worker.name }}</strong></td>
                <td class="mono">{{ worker.id }}</td>
                <td><StatusBadge :status="worker.accountStatus" type="account" /></td>
                <td v-for="z in ZONES" :key="z" class="cell-center">
                  <input
                    type="checkbox"
                    :checked="(editedZones[worker.id] ?? []).includes(z)"
                    :disabled="worker.accountStatus === ACCOUNT_STATUS.INACTIVE"
                    @change="toggleZone(worker.id, z)"
                  />
                </td>
                <td>
                  <button
                    class="btn btn--ghost btn--sm"
                    :disabled="worker.accountStatus === ACCOUNT_STATUS.INACTIVE"
                    @click="saveWorkerZones(worker)"
                  >저장</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 주요 Bin 고정 배정 (핵심 배정 현황) -->
      <div class="card" style="margin-top:16px;">
        <div class="card-header-row"><span class="card-title">주요 Bin 고정 배정</span></div>
        <BaseTable :columns="binFixedColumns" :rows="binFixed" :loading="loading" :pagination="null">
          <template #cell-bin="{ row }">
            <span class="location-tag">{{ row.bin }}</span>
          </template>
          <template #cell-taskType="{ row }">
            <StatusBadge :status="row.taskType" type="worker" />
          </template>
          <template #cell-latestRefDoc="{ row }">
            <span class="mono" style="font-size:11px;">{{ row.latestRefDoc }}</span>
          </template>
        </BaseTable>
      </div>
    </div>

    <!-- ═══════════════════════════════════════
         탭: 입고 대기
    ════════════════════════════════════════ -->
    <div v-show="activeTab === 'pending'" class="tab-panel panel-pad">
      <div class="info-banner">
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="flex-shrink:0;">
          <circle cx="7" cy="7" r="5.5"/><path d="M7 5v4M7 3.5v.5" stroke-linecap="round"/>
        </svg>
        <p><strong>입고 대기 페이지</strong>입니다. 오늘 도착 예정 ASN과 사전 배정 Bin, 작업자 슬롯을 기준으로 검수 착수 순서를 관리합니다.</p>
      </div>

      <div class="kpi-grid" style="margin-bottom:16px;">
        <div class="kpi-card">
          <div class="kpi-label">입고 대기 ASN</div>
          <div class="kpi-value kpi-amber">{{ inboundAsns.length }}</div>
          <div class="kpi-sub">도착 예정</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">즉시 검수 가능</div>
          <div class="kpi-value kpi-blue">{{ inboundAsns.filter(a => a.assignedWorkerId).length }}</div>
          <div class="kpi-sub">Bin 선배정 완료</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">검토 필요</div>
          <div class="kpi-value kpi-amber">{{ inboundAsns.filter(a => !a.assignedWorkerId).length }}</div>
          <div class="kpi-sub">작업자/Bin 미배정</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">총 예정 수량</div>
          <div class="kpi-value">{{ inboundAsns.reduce((s, a) => s + (a.plannedQty ?? 0), 0).toLocaleString() }}</div>
          <div class="kpi-sub">개</div>
        </div>
      </div>

      <div class="queue-grid">
        <div class="summary-box">
          <div class="summary-title">입고 대기 ASN 목록</div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ASN ID</th><th>셀러사</th><th>예정 수량</th>
                  <th>추천 Bin</th><th>예상 작업자</th><th>도착 예정</th><th>작업</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="asn in inboundAsns"
                  :key="asn.id"
                  :class="{ 'row--highlight-amber': !asn.assignedWorkerId }"
                >
                  <td class="mono">{{ asn.id }}</td>
                  <td>{{ asn.sellerCompany }}</td>
                  <td>{{ asn.plannedQty?.toLocaleString() }}개</td>
                  <td><span class="location-tag">{{ asn.recommendedBin || '미정' }}</span></td>
                  <td>{{ asn.assignedWorkerName || '담당자 없음' }}</td>
                  <td>{{ asn.eta }}</td>
                  <td>
                    <div class="action-btns">
                      <button class="btn btn--primary btn--sm" @click="openAssignModal(asn)">배정</button>
                      <button class="btn btn--ghost btn--sm" @click="openAsnDetail(asn)">상세</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="summary-box">
          <div class="summary-title">운영 포인트</div>
          <div class="priority-list">
            <div v-if="inboundAsns.filter(a => !a.assignedWorkerId).length" class="priority-item">
              <div class="priority-copy">
                <div class="priority-main">검토 필요 {{ inboundAsns.filter(a => !a.assignedWorkerId).length }}건</div>
                <div class="priority-sub">작업자 가용 슬롯 재배정 필요</div>
              </div>
              <span class="badge badge--red">주의</span>
            </div>
            <div class="priority-item">
              <div class="priority-copy">
                <div class="priority-main">고회전 SKU 존 우선 착수</div>
                <div class="priority-sub">Bin 사전 확인 후 검수 시작 권장</div>
              </div>
              <span class="badge badge--amber">권장</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════
         탭: 운송 중
    ════════════════════════════════════════ -->
    <div v-show="activeTab === 'transit'" class="tab-panel panel-pad">
      <div class="info-banner">
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="flex-shrink:0;">
          <circle cx="7" cy="7" r="5.5"/><path d="M7 5v4M7 3.5v.5" stroke-linecap="round"/>
        </svg>
        <p><strong>운송 중 페이지</strong>입니다. 운송 중 ASN의 ETA, 검수 준비 상태, 도착 직후 투입할 작업자와 Bin을 미리 확인합니다.</p>
      </div>

      <div class="kpi-grid" style="margin-bottom:16px;">
        <div class="kpi-card">
          <div class="kpi-label">운송 중 ASN</div>
          <div class="kpi-value kpi-blue">{{ inboundAsns.length }}</div>
          <div class="kpi-sub">운송 중</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">검수 슬롯 예약</div>
          <div class="kpi-value">{{ inboundAsns.filter(a => a.assignedWorkerId).length }}</div>
          <div class="kpi-sub">작업자 사전 확보</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">총 예정 수량</div>
          <div class="kpi-value">{{ inboundAsns.reduce((s, a) => s + (a.plannedQty ?? 0), 0).toLocaleString() }}</div>
          <div class="kpi-sub">개</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">출고 영향도</div>
          <div class="kpi-value">낮음</div>
          <div class="kpi-sub">오늘 출고 차질 없음</div>
        </div>
      </div>

      <div class="summary-box">
        <div class="summary-title">운송 중 ASN 추적</div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ASN ID</th><th>셀러사</th><th>ETA</th>
                <th>추천 Bin</th><th>예상 작업자</th><th>작업</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asn in inboundAsns" :key="asn.id">
                <td class="mono">{{ asn.id }}</td>
                <td>{{ asn.sellerCompany }}</td>
                <td>{{ asn.eta }}</td>
                <td><span class="location-tag">{{ asn.recommendedBin || '미정' }}</span></td>
                <td>{{ asn.assignedWorkerName || '-' }}</td>
                <td>
                  <div class="action-btns">
                    <button class="btn btn--ghost btn--sm" @click="openAsnDetail(asn)">상세</button>
                    <button class="btn btn--secondary btn--sm" @click="openAssignModal(asn)">조정</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════
         탭: 검수 완료
    ════════════════════════════════════════ -->
    <div v-show="activeTab === 'received'" class="tab-panel panel-pad">
      <div class="info-banner">
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="flex-shrink:0;">
          <circle cx="7" cy="7" r="5.5"/><path d="M7 5v4M7 3.5v.5" stroke-linecap="round"/>
        </svg>
        <p><strong>검수 완료 페이지</strong>입니다. 실입고 수량이 확정된 ASN과 적재 완료 이력을 확인하고 후속 재고 반영 상태를 추적합니다.</p>
      </div>

      <div class="kpi-grid" style="margin-bottom:16px;">
        <div class="kpi-card">
          <div class="kpi-label">검수 완료</div>
          <div class="kpi-value kpi-green">{{ inboundAsns.length }}</div>
          <div class="kpi-sub">총 완료 건수</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">총 실입고 수량</div>
          <div class="kpi-value kpi-green">{{ inboundAsns.reduce((s, a) => s + (a.actualQty ?? 0), 0).toLocaleString() }}</div>
          <div class="kpi-sub">개</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">적재 완료 Bin</div>
          <div class="kpi-value">{{ inboundAsns.filter(a => a.storedBin).length }}</div>
          <div class="kpi-sub">확정 적재</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">평균 처리 시간</div>
          <div class="kpi-value">-</div>
          <div class="kpi-sub">ASN 1건 기준</div>
        </div>
      </div>

      <div class="summary-box">
        <div class="summary-title">검수 완료 내역</div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ASN ID</th><th>셀러사</th><th>실입고 수량</th>
                <th>적재 Bin</th><th>완료 작업자</th><th>완료 시각</th><th>작업</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asn in inboundAsns" :key="asn.id">
                <td class="mono">{{ asn.id }}</td>
                <td>{{ asn.sellerCompany }}</td>
                <td>{{ asn.actualQty?.toLocaleString() }}개</td>
                <td><span class="location-tag">{{ asn.storedBin || '-' }}</span></td>
                <td>{{ asn.completedWorkerName || '-' }}</td>
                <td>{{ asn.completedAt || '-' }}</td>
                <td>
                  <button class="btn btn--ghost btn--sm" @click="openAsnDetail(asn)">상세</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════
         탭: 수량 불일치
    ════════════════════════════════════════ -->
    <div v-show="activeTab === 'mismatch'" class="tab-panel panel-pad">
      <div class="info-banner">
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="flex-shrink:0;">
          <circle cx="7" cy="7" r="5.5"/><path d="M7 5v4M7 3.5v.5" stroke-linecap="round"/>
        </svg>
        <p><strong>수량 불일치 페이지</strong>입니다. ASN 기준 예정 수량과 실입고 수량 차이를 검토하고 보류/승인/재요청 여부를 결정합니다.</p>
      </div>

      <div class="kpi-grid" style="margin-bottom:16px;">
        <div class="kpi-card">
          <div class="kpi-label">불일치 건수</div>
          <div class="kpi-value" style="color:var(--red);">{{ inboundAsns.length }}</div>
          <div class="kpi-sub">처리 대기</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">부족 수량 합계</div>
          <div class="kpi-value" style="color:var(--red);">{{ inboundAsns.reduce((s, a) => s + (a.diff ?? 0), 0) }}개</div>
          <div class="kpi-sub">총 합산</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">사유 첨부</div>
          <div class="kpi-value kpi-blue">{{ inboundAsns.filter(a => a.mismatchReason).length }}</div>
          <div class="kpi-sub">사유 포함 건</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">처리 SLA</div>
          <div class="kpi-value">30분</div>
          <div class="kpi-sub">관리자 승인 기준</div>
        </div>
      </div>

      <div class="queue-grid">
        <!-- 불일치 목록 테이블 -->
        <div class="summary-box">
          <div class="summary-title">수량 불일치 목록</div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ASN ID</th><th>SKU</th><th>예정 / 실입고</th>
                  <th>차이</th><th>사유</th><th>검수 작업자</th><th>작업</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="asn in inboundAsns" :key="asn.id" class="row--highlight-red">
                  <td class="mono">{{ asn.id }}</td>
                  <td class="mono">{{ asn.sku || '-' }}</td>
                  <td>{{ asn.plannedQty }} / {{ asn.actualQty }}</td>
                  <td><span class="badge badge--red">{{ asn.diff }}</span></td>
                  <td>{{ asn.mismatchReason || '-' }}</td>
                  <td>{{ asn.checkedWorkerName || '-' }}</td>
                  <td>
                    <button class="btn btn--primary btn--sm" @click="openAsnMismatch(asn)">처리</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 즉시 조치 -->
        <div class="summary-box">
          <div class="summary-title">즉시 조치</div>
          <div class="priority-list">
            <div v-for="asn in inboundAsns" :key="asn.id" class="priority-item">
              <div class="priority-copy">
                <div class="priority-main">{{ asn.id }}</div>
                <div class="priority-sub">{{ asn.mismatchReason }} · 처리 대기</div>
              </div>
              <span class="badge badge--red">긴급</span>
            </div>
            <p v-if="!inboundAsns.length" class="task-empty">불일치 건 없음</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ 모달 ═══ -->
    <AssignTaskModal
      :is-open="showAssignModal"
      :task="targetTask"
      :worker="targetWorker"
      :worker-options="workers"
      @confirm="handleAssignConfirm"
      @cancel="showAssignModal = false"
    />
    <WorkerLogModal
      :is-open="showWorkerLog"
      :worker="targetWorker"
      @cancel="showWorkerLog = false"
    />
    <AsnDetailModal
      :is-open="showAsnDetail"
      :asn="targetAsn"
      @cancel="showAsnDetail = false"
    />
    <AsnMismatchModal
      :is-open="showAsnMismatch"
      :asn="targetAsn"
      @cancel="showAsnMismatch = false"
      @confirm="showAsnMismatch = false"
    />
    <ToastMessage v-model:visible="toast.show" :message="toast.msg" :type="toast.type" />
  </AppLayout>
</template>

<style scoped>
/* ── KPI ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.kpi-card {
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: var(--radius-lg);
  padding: 16px;
}
.kpi-label { font-size: var(--font-size-xs); color: var(--t3); margin-bottom: 4px; }
.kpi-value { font-size: var(--font-size-2xl); font-weight: 700; color: var(--t1); margin-bottom: 2px; }
.kpi-sub   { font-size: var(--font-size-xs); color: var(--t3); }
.kpi-blue  { color: var(--blue); }
.kpi-amber { color: #b45309; }
.kpi-green { color: var(--green); }

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
  margin-bottom: 16px;
}
.info-banner p { margin: 0; line-height: 1.5; }
.info-banner strong { font-weight: 700; }

/* ── 탭 바 ── */
.tab-bar {
  display: flex;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-bottom: none;
}
.tab-item {
  padding: 10px 16px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--t3);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s, background 0.15s;
}
.tab-item:hover { background: var(--surface-1); color: var(--t2); }
.tab-item.active { color: var(--blue); background: var(--surface-1); border-bottom-color: var(--blue); font-weight: 700; }
.tab-badge {
  background: var(--red);
  color: #fff;
  border-radius: 999px;
  font-size: 10px;
  padding: 1px 6px;
  font-weight: 700;
}

/* ── 탭 패널 ── */
.tab-panel {
  border: 1px solid var(--border-1);
  border-top: none;
  border-radius: 0 0 8px 8px;
  background: var(--surface-1);
}
.panel-pad { padding: 20px; }

/* ── 작업자 그리드 ── */
.worker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.worker-card {
  background: var(--surface-1);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.worker-card.highlight {
  border-color: rgba(245, 166, 35, 0.45);
  background: linear-gradient(180deg, rgba(245, 166, 35, 0.04), rgba(245, 166, 35, 0.01));
}
.worker-head { display: flex; align-items: center; gap: 12px; }
.worker-avatar {
  width: 42px; height: 42px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700;
  flex-shrink: 0;
}
.worker-meta { flex: 1; min-width: 0; }
.worker-name { font-size: 15px; font-weight: 700; color: var(--t1); }
.worker-code { font-size: 11px; color: var(--t3); margin-top: 2px; font-family: monospace; }

.worker-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.worker-stat {
  padding: 12px; border-radius: 6px;
  background: var(--surface-2); border: 1px solid var(--border-1);
}
.worker-stat-label { font-size: 11px; color: var(--t3); margin-bottom: 4px; }
.worker-stat-value { font-size: 18px; font-weight: 700; color: var(--t1); }

.sub-title { font-size: 13px; font-weight: 700; color: var(--t1); }
.bin-list { display: flex; flex-wrap: wrap; gap: 6px; }

.task-list {
  border-top: 1px solid var(--border-1);
  padding-top: 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.task-entry {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--surface-2); border: 1px solid var(--border-1);
}
.task-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
.task-copy { flex: 1; min-width: 0; }
.task-title { font-size: 12px; font-weight: 600; color: var(--t1); margin-bottom: 2px; }
.task-desc  { font-size: 12px; color: var(--t3); line-height: 1.4; }
.task-empty { font-size: var(--font-size-xs); color: var(--t3); margin: 0; }

/* ── 큐 그리드 ── */
.queue-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-top: 16px; }

/* ── Summary box ── */
.summary-box {
  border: 1px solid var(--border-1);
  border-radius: 8px;
  background: var(--surface-1);
  padding: 18px;
}
.summary-title { font-size: 13px; font-weight: 700; color: var(--t1); margin-bottom: 12px; }

/* ── Priority list ── */
.priority-list { display: flex; flex-direction: column; gap: 10px; }
.priority-item {
  display: flex; justify-content: space-between; gap: 12px; align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--border-1);
  border-radius: 6px;
  background: var(--surface-2);
}
.priority-copy { min-width: 0; flex: 1; }
.priority-main { font-size: 12px; font-weight: 600; color: var(--t1); }
.priority-sub  { font-size: 11px; color: var(--t3); margin-top: 2px; }

/* ── 필터 바 (tasks 탭) ── */
.filter-bar {
  display: flex; gap: 8px; flex-wrap: wrap;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-1);
  background: var(--surface-2);
}
.select-filter {
  padding: 7px 10px;
  border: 1px solid var(--border-1);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--surface-1); color: var(--t1);
}
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--t3); width: 14px; height: 14px; }
.search-input {
  width: 100%; padding: 7px 10px 7px 32px;
  border: 1px solid var(--border-1);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--surface-1); color: var(--t1);
}

/* ── Bin 탭 ── */
.matrix-note {
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  padding: 16px 18px;
  border-radius: 8px;
  background: var(--surface-2); border: 1px solid var(--border-1);
  margin-bottom: 16px;
}
.matrix-note strong { color: var(--t1); }
.matrix-note__sub { font-size: 12px; color: var(--t3); margin-top: 4px; }

.mini-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
.mini-kpi { padding: 14px; border: 1px solid var(--border-1); border-radius: 6px; background: var(--surface-1); }
.mini-kpi__label { font-size: 11px; color: var(--t3); margin-bottom: 4px; }
.mini-kpi__value { font-size: 20px; font-weight: 700; color: var(--t1); }

/* ── 카드 래퍼 (bin 탭 테이블 들) ── */
.card { border: 1px solid var(--border-1); border-radius: 8px; background: var(--surface-1); overflow: hidden; }
.card-header-row { padding: 12px 16px; border-bottom: 1px solid var(--border-1); background: var(--surface-2); }
.card-title { font-size: 13px; font-weight: 700; color: var(--t1); }

/* ── 데이터 테이블 (인라인) ── */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.data-table th,
.data-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border-1); }
.data-table th { background: var(--surface-2); color: var(--t3); font-weight: 600; }
.data-table tbody tr:hover { background: var(--surface-2); }
.cell-center { text-align: center; }
.row--inactive { opacity: 0.55; }
.row--highlight-amber { background: rgba(245, 166, 35, 0.05); }
.row--highlight-red   { background: rgba(239, 68, 68, 0.03); }

/* ── Location tag ── */
.location-tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: var(--radius-md);
  font-size: 11px; font-weight: 600;
  font-family: monospace; color: var(--t2);
}
.location-tag--empty { color: var(--t3); font-weight: 400; }

.bin-chips { display: flex; flex-wrap: wrap; gap: 4px; }

/* ── Inline badges ── */
.badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.badge--red   { background: var(--red-pale);   color: var(--red);   }
.badge--amber { background: var(--amber-pale);  color: #b45309;     }

/* ── 액션 버튼 그룹 ── */
.action-btns { display: flex; gap: 4px; }

/* ── 버튼 ── */
.btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm); font-weight: 600;
  cursor: pointer; border: none; white-space: nowrap;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn--sm { padding: 5px 10px; font-size: var(--font-size-xs); }
.btn--primary   { background: var(--blue);      color: #fff;        }
.btn--secondary { background: var(--surface-2); color: var(--t2);   }
.btn--ghost     { background: transparent; color: var(--t3); border: 1px solid var(--border-1); }
.btn--assign    { background: var(--blue); color: #fff; border: none; }
.btn--assign:hover { filter: brightness(1.1); }
.btn--log       { background: var(--surface-2); color: var(--t2); border: 1px solid var(--border-1); }
.btn--log:hover { background: var(--surface-1); border-color: var(--blue); color: var(--blue); }
.btn:disabled   { opacity: 0.5; cursor: not-allowed; }

.worker-actions {
  display: flex;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid var(--border-1);
}

/* ── 기타 ── */
.mono { font-family: monospace; }
</style>