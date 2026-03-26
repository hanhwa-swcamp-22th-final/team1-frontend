<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import PickingListDetailModal from '@/components/whManager/PickingListDetailModal.vue'
import { getWhmPickingLists } from '@/api/wms'
import { PICKING_LIST_STATUS } from '@/constants'

// ── 데이터
const pickingLists = ref([])
const loading      = ref(false)

// ── 필터
const filterStatus = ref('')
const filterWorker = ref('')
const searchText   = ref('')

// ── 모달
const showDetailModal     = ref(false)
const selectedPickingList = ref(null)

// ── 토스트
const toast = ref({ visible: false, message: '', type: 'success' })

function showToast(message, type = 'success') {
  toast.value = { visible: true, message, type }
}

async function fetchPickingLists() {
  loading.value = true
  try {
    const { data } = await getWhmPickingLists()
    pickingLists.value = data
  } catch (e) {
    console.error('피킹 리스트 로드 실패:', e)
    showToast('피킹 리스트를 불러오지 못했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchPickingLists)

// ── 작업자 목록 (중복 제거)
const workerOptions = computed(() =>
  [...new Set(pickingLists.value.map(p => p.assignedWorker))],
)

// ── 클라이언트 필터링
const filtered = computed(() => {
  let list = pickingLists.value

  if (filterStatus.value) {
    list = list.filter(p => p.status === filterStatus.value)
  }
  if (filterWorker.value) {
    list = list.filter(p => p.assignedWorker === filterWorker.value)
  }
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.assignedWorker.toLowerCase().includes(q),
    )
  }
  return list
})

// ── KPI
const kpi = computed(() => {
  const all        = pickingLists.value
  const inProgress = all.filter(p => p.status === PICKING_LIST_STATUS.IN_PROGRESS).length
  const completed  = all.filter(p => p.status === PICKING_LIST_STATUS.COMPLETED).length

  const completedItems = all.filter(
    p => p.status === PICKING_LIST_STATUS.COMPLETED && p.issuedAt && p.completedAt,
  )
  let avgTime = '-'
  if (completedItems.length > 0) {
    const toMinutes = t => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }
    const totalMin = completedItems.reduce(
      (acc, p) => acc + (toMinutes(p.completedAt) - toMinutes(p.issuedAt)),
      0,
    )
    avgTime = `${Math.round(totalMin / completedItems.length)}분`
  }

  return { total: all.length, inProgress, completed, avgTime }
})

// ── 진행률 계산
function progressPct(pl) {
  return pl.totalBins > 0 ? Math.round((pl.completedBins / pl.totalBins) * 100) : 0
}

// ── 상세 모달
function openDetail(pl) {
  selectedPickingList.value = pl
  showDetailModal.value = true
}

const breadcrumb = [
  { label: 'CONK' },
  { label: '출고 관리' },
  { label: '피킹 리스트' },
]
</script>

<template>
  <AppLayout title="피킹 리스트" :breadcrumb="breadcrumb" :loading="loading">

    <!-- ── KPI 카드 ──────────────────────────────── -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-label">전체 피킹 리스트</span>
        <span class="kpi-value">{{ kpi.total }}</span>
        <span class="kpi-sub">금일 발행 건</span>
      </div>
      <div class="kpi-card kpi-card--amber">
        <span class="kpi-label">진행 중</span>
        <span class="kpi-value">{{ kpi.inProgress }}</span>
        <span class="kpi-sub">작업자 피킹 중</span>
      </div>
      <div class="kpi-card kpi-card--green">
        <span class="kpi-label">완료</span>
        <span class="kpi-value">{{ kpi.completed }}</span>
        <span class="kpi-sub">피킹 완료</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">평균 피킹 시간</span>
        <span class="kpi-value">{{ kpi.avgTime }}</span>
        <span class="kpi-sub">완료 건 기준</span>
      </div>
    </div>

    <!-- ── 필터 바 ────────────────────────────────── -->
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
          placeholder="리스트 ID, 작업자명 검색..."
        />
      </div>

      <select v-model="filterStatus" class="select-filter">
        <option value="">전체 상태</option>
        <option :value="PICKING_LIST_STATUS.WAITING">대기</option>
        <option :value="PICKING_LIST_STATUS.IN_PROGRESS">진행 중</option>
        <option :value="PICKING_LIST_STATUS.COMPLETED">완료</option>
      </select>

      <select v-model="filterWorker" class="select-filter">
        <option value="">전체 작업자</option>
        <option v-for="worker in workerOptions" :key="worker" :value="worker">{{ worker }}</option>
      </select>

      <span class="result-count">{{ filtered.length }}건</span>
    </div>

    <!-- ── 빈 상태 ───────────────────────────────── -->
    <div v-if="!loading && filtered.length === 0" class="state-box">
      <span class="text-muted">해당하는 피킹 리스트가 없습니다.</span>
    </div>

    <!-- ── 피킹 리스트 카드 목록 ─────────────────── -->
    <div v-else-if="!loading" class="card-list">
      <div
        v-for="pl in filtered"
        :key="pl.id"
        class="pl-card"
      >
        <!-- 카드 헤더 -->
        <div class="pl-header">
          <div class="pl-header-left">
            <span class="pl-id">{{ pl.id }}</span>
            <StatusBadge :status="pl.status" type="pickingList" />
          </div>
          <div class="pl-meta">
            <span class="pl-worker">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" width="12" height="12">
                <circle cx="7" cy="5" r="2.5"/>
                <path d="M2.5 12.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke-linecap="round"/>
              </svg>
              {{ pl.assignedWorker }}
            </span>
            <span class="pl-stat">주문 {{ pl.orderCount }}건</span>
            <span class="pl-stat">{{ pl.itemCount }} EA</span>
            <span class="pl-stat">{{ pl.issuedAt }} 발행</span>
            <span v-if="pl.completedAt" class="pl-stat">{{ pl.completedAt }} 완료</span>
          </div>
        </div>

        <!-- 진행률 바 -->
        <div class="progress-wrap">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="{
                'progress-fill--green': pl.status === PICKING_LIST_STATUS.COMPLETED,
                'progress-fill--amber': pl.status === PICKING_LIST_STATUS.IN_PROGRESS,
              }"
              :style="{ width: `${progressPct(pl)}%` }"
            />
          </div>
          <span class="progress-label">{{ progressPct(pl) }}% ({{ pl.completedBins }}/{{ pl.totalBins }} Bin)</span>
        </div>

        <!-- 아이템 테이블 -->
        <div class="items-wrap">
          <table class="items-table">
            <thead>
              <tr>
                <th class="col-seq">동선</th>
                <th class="col-bin">Bin</th>
                <th class="col-sku">SKU</th>
                <th>상품명</th>
                <th class="col-qty">수량</th>
                <th class="col-status">상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in pl.items" :key="item.sequence">
                <td class="text-center text-muted">{{ item.sequence }}</td>
                <td><span class="location-tag">{{ item.bin }}</span></td>
                <td><span class="mono">{{ item.sku }}</span></td>
                <td>{{ item.productName }}</td>
                <td class="text-right fw-600">{{ item.qty }}</td>
                <td class="text-center">
                  <StatusBadge :status="item.status" type="pickingList" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 카드 푸터 -->
        <div class="pl-footer">
          <button class="ui-btn ui-btn--ghost ui-btn--sm" @click="openDetail(pl)">
            상세 보기
          </button>
        </div>
      </div>
    </div>

    <!-- ── 모달 ──────────────────────────────────── -->
    <PickingListDetailModal
      :isOpen="showDetailModal"
      :pickingList="selectedPickingList"
      @cancel="showDetailModal = false"
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
/* ── KPI 카드 ────────────────────────────────────── */
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
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.kpi-card--amber { border-left: 3px solid #d97706; }
.kpi-card--green { border-left: 3px solid var(--green); }

.kpi-label {
  font-size: var(--font-size-xs);
  color: var(--t3);
  font-weight: 500;
}

.kpi-value {
  font-family: var(--font-condensed);
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--t1);
  line-height: 1;
}

.kpi-sub {
  font-size: var(--font-size-xs);
  color: var(--t3);
}

/* ── 필터 바 ────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  margin-bottom: var(--space-4);
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

.result-count {
  margin-left: auto;
  font-size: var(--font-size-sm);
  color: var(--t3);
}

/* ── 상태 박스 ─────────────────────────────────── */
.state-box {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-8);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

/* ── 카드 목록 ─────────────────────────────────── */
.card-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ── 피킹 리스트 카드 ────────────────────────── */
.pl-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.pl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.pl-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.pl-id {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--t1);
}

.pl-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.pl-worker {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t1);
}

.pl-stat {
  font-size: var(--font-size-xs);
  color: var(--t3);
}

/* ── 진행률 바 ─────────────────────────────────── */
.progress-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--surface-2);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--t3);
  transition: width 0.3s ease;
}

.progress-fill--amber { background: #d97706; }
.progress-fill--green { background: var(--green); }

.progress-label {
  font-size: var(--font-size-xs);
  color: var(--t3);
  white-space: nowrap;
}

/* ── 아이템 테이블 ─────────────────────────────── */
.items-wrap {
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.items-table th {
  padding: 8px 12px;
  background: var(--surface-2);
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.items-table td {
  padding: 8px 12px;
  color: var(--t1);
  border-bottom: 1px solid var(--border);
}

.items-table tr:last-child td { border-bottom: none; }
.items-table tr:hover td { background: var(--surface-2); }

.col-seq    { width: 48px; }
.col-bin    { width: 80px; }
.col-sku    { width: 130px; }
.col-qty    { width: 60px; }
.col-status { width: 90px; }

/* ── 카드 푸터 ─────────────────────────────────── */
.pl-footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--space-3) var(--space-4);
}

/* ── 셀 헬퍼 ───────────────────────────────────── */
.mono        { font-family: var(--font-mono); font-size: var(--font-size-xs); }
.text-muted  { color: var(--t3); }
.text-center { text-align: center; }
.text-right  { text-align: right; }
.fw-600      { font-weight: 600; }

.location-tag {
  display: inline-flex;
  padding: 2px 7px;
  background: var(--blue-pale);
  color: var(--blue);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  font-family: var(--font-mono);
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

.ui-btn--ghost {
  border-color: var(--border);
  background: transparent;
  color: var(--t2);
}
.ui-btn--ghost:hover { background: var(--surface-2); color: var(--t1); }
.ui-btn--sm { height: 28px; font-size: var(--font-size-xs); }
</style>