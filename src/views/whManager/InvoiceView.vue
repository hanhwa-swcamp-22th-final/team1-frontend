<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LabelPrintModal from '@/components/whManager/LabelPrintModal.vue'
import BulkLabelModal from '@/components/whManager/BulkLabelModal.vue'
import { getWhmInvoiceOrders, issueLabel, bulkIssueLabels } from '@/api/wh-manager'
import { LABEL_STATUS } from '@/constants'

// ── 데이터
const orders  = ref([])
const loading = ref(false)

// ── 필터
const filterSeller  = ref('')
const filterCarrier = ref('')

// ── 페이지네이션
const currentPage = ref(1)
const PAGE_SIZE   = 8

// ── 체크박스 선택
const selectedIds = ref(new Set())

// ── 모달
const showLabelModal = ref(false)
const showBulkModal  = ref(false)
const targetOrder    = ref(null)

// ── 토스트
const toast = ref({ visible: false, message: '', type: 'success' })
function showToast(message, type = 'success') {
  toast.value = { visible: true, message, type }
}

async function fetchOrders() {
  loading.value = true
  try {
    const { data } = await getWhmInvoiceOrders()
    orders.value = data
  } catch (e) {
    console.error('송장 발행 목록 로드 실패:', e)
    showToast('목록을 불러오지 못했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)

// 필터 바뀌면 1페이지·선택 초기화
watch([filterSeller, filterCarrier], () => {
  currentPage.value = 1
  selectedIds.value = new Set()
})

// ── 셀러 목록 (중복 제거)
const sellerOptions = computed(() =>
  [...new Set(orders.value.map(o => o.sellerName))],
)

// ── 클라이언트 필터링
const filtered = computed(() => {
  let list = orders.value
  if (filterSeller.value)  list = list.filter(o => o.sellerName === filterSeller.value)
  if (filterCarrier.value) list = list.filter(o => o.recommendedCarrier === filterCarrier.value)
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

// ── 미발행 주문만 선택 가능
const selectableIds = computed(() =>
  paged.value
    .filter(o => o.labelStatus === LABEL_STATUS.NOT_ISSUED)
    .map(o => o.id),
)

const isAllChecked = computed(() =>
  selectableIds.value.length > 0 &&
  selectableIds.value.every(id => selectedIds.value.has(id)),
)

const isIndeterminate = computed(() =>
  selectableIds.value.some(id => selectedIds.value.has(id)) && !isAllChecked.value,
)

function toggleAll(e) {
  if (e.target.checked) {
    selectableIds.value.forEach(id => selectedIds.value.add(id))
  } else {
    selectableIds.value.forEach(id => selectedIds.value.delete(id))
  }
  selectedIds.value = new Set(selectedIds.value)
}

function toggleRow(id) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
  selectedIds.value = new Set(selectedIds.value)
}

// ── 선택된 주문 객체 목록
const selectedOrders = computed(() =>
  orders.value.filter(o => selectedIds.value.has(o.id)),
)

// ── 개별 라벨 발행
function openLabelModal(order) {
  targetOrder.value = order
  showLabelModal.value = true
}

async function handleLabelConfirm(payload) {
  try {
    await issueLabel(payload.orderId, {
      labelStatus:     LABEL_STATUS.ISSUED,
      carrier:         payload.carrier,
      service:         payload.service,
      labelFormat:     payload.labelFormat,
      labelIssuedAt:   new Date().toISOString().slice(0, 10),
    })
    orders.value = orders.value.map(o =>
      o.id === payload.orderId ? { ...o, labelStatus: LABEL_STATUS.ISSUED } : o,
    )
    selectedIds.value.delete(payload.orderId)
    selectedIds.value = new Set(selectedIds.value)
    showLabelModal.value = false
    showToast(`${payload.orderId} 라벨이 발행되었습니다.`)
  } catch (e) {
    showToast('라벨 발행 중 오류가 발생했습니다.', 'error')
  }
}

// ── 일괄 라벨 출력
async function handleBulkConfirm() {
  const ids = [...selectedIds.value]
  try {
    await bulkIssueLabels({ orderIds: ids })
    orders.value = orders.value.map(o =>
      ids.includes(o.id) ? { ...o, labelStatus: LABEL_STATUS.ISSUED } : o,
    )
    selectedIds.value = new Set()
    showBulkModal.value = false
    showToast(`${ids.length}건 라벨이 일괄 발행되었습니다.`)
  } catch (e) {
    showToast('일괄 라벨 발행 중 오류가 발생했습니다.', 'error')
  }
}

// ── 컬럼 정의
const columns = [
  { key: 'checkbox',            label: '',          width: '44px',  align: 'center' },
  { key: 'id',                  label: '주문번호',   width: '170px' },
  { key: 'sellerName',          label: '셀러' },
  { key: 'itemSummary',         label: '상품 / 중량' },
  { key: 'shipDestination',     label: '배송지',     width: '90px'  },
  { key: 'recommendedCarrier',  label: '추천 배송사', width: '110px', align: 'center' },
  { key: 'estimatedRate',       label: '예상 요금',  width: '100px', align: 'right'  },
  { key: 'labelStatus',         label: '상태',       width: '130px', align: 'center' },
  { key: 'actions',             label: '작업',       width: '90px',  align: 'center' },
]

const breadcrumb = [
  { label: 'CONK' },
  { label: '출고 관리' },
  { label: '송장 발행' },
]
</script>

<template>
  <AppLayout title="송장 발행" :breadcrumb="breadcrumb" :loading="loading">

    <!-- ── 상단 액션 ───────────────────────────────── -->
    <template #header-action>
      <button
        class="ui-btn ui-btn--primary"
        :disabled="selectedIds.size === 0"
        @click="showBulkModal = true"
      >
        <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
          <rect x="1" y="2" width="11" height="9" rx="1"/>
          <path d="M4 7h5M4 9h3" stroke-linecap="round"/>
        </svg>
        일괄 라벨 출력
      </button>
    </template>

    <!-- ── 안내 배너 ──────────────────────────────── -->
    <div class="info-banner">
      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
        <circle cx="7" cy="7" r="5.5"/>
        <path d="M7 5v4M7 3.5v.5" stroke-linecap="round"/>
      </svg>
      <p>포장 완료된 주문에 대해 USPS·UPS·FedEx 요금을 비교하여 최적 배송사를 선택하고 라벨을 출력합니다.</p>
    </div>

    <!-- ── 카드 ───────────────────────────────────── -->
    <div class="card">
      <div class="card-header">
        <div class="card-title-wrap">
          <span class="card-title">포장 완료 — 송장 발행 대기</span>
          <span class="badge badge--amber">{{ orders.filter(o => o.labelStatus === LABEL_STATUS.NOT_ISSUED).length }}건 대기</span>
        </div>
        <span v-if="selectedIds.size > 0" class="selected-info">
          <strong>{{ selectedIds.size }}</strong>건 선택됨
        </span>
      </div>

      <!-- 필터 바 -->
      <div class="filter-bar">
        <select v-model="filterSeller" class="select-filter">
          <option value="">전체 셀러</option>
          <option v-for="s in sellerOptions" :key="s" :value="s">{{ s }}</option>
        </select>
        <select v-model="filterCarrier" class="select-filter">
          <option value="">전체 배송사</option>
          <option value="USPS">USPS</option>
          <option value="UPS">UPS</option>
          <option value="FedEx">FedEx</option>
        </select>
      </div>

      <!-- 테이블 -->
      <div class="table-section">
        <BaseTable
          :columns="columns"
          :rows="paged"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          @page-change="p => currentPage = p"
        >
          <!-- 헤더: 전체 선택 -->
          <template #header-checkbox>
            <input
              type="checkbox"
              :checked="isAllChecked"
              :indeterminate="isIndeterminate"
              @change="toggleAll"
            />
          </template>

          <!-- 체크박스 -->
          <template #cell-checkbox="{ row }">
            <input
              type="checkbox"
              :checked="selectedIds.has(row.id)"
              :disabled="row.labelStatus === LABEL_STATUS.ISSUED"
              @change="toggleRow(row.id)"
            />
          </template>

          <!-- 주문번호 -->
          <template #cell-id="{ row }">
            <span class="mono order-id">{{ row.id }}</span>
          </template>

          <!-- 상품 / 중량 -->
          <template #cell-itemSummary="{ row }">
            {{ row.itemSummary }} / {{ row.weightLbs }} lbs
          </template>

          <!-- 배송지 -->
          <template #cell-shipDestination="{ row }">
            <span class="text-muted">{{ row.shipState }}, {{ row.shipCountry }}</span>
          </template>

          <!-- 추천 배송사 -->
          <template #cell-recommendedCarrier="{ row }">
            <StatusBadge :status="row.recommendedCarrier" type="carrier" />
          </template>

          <!-- 예상 요금 -->
          <template #cell-estimatedRate="{ row }">
            <span class="rate">${{ row.estimatedRate.toFixed(2) }}</span>
          </template>

          <!-- 상태 배지 -->
          <template #cell-labelStatus="{ row }">
            <StatusBadge :status="row.labelStatus" type="labelStatus" />
          </template>

          <!-- 작업 -->
          <template #cell-actions="{ row }">
            <button
              v-if="row.labelStatus === LABEL_STATUS.NOT_ISSUED"
              class="ui-btn ui-btn--primary ui-btn--sm"
              @click="openLabelModal(row)"
            >
              라벨 발행
            </button>
            <button
              v-else
              class="ui-btn ui-btn--ghost ui-btn--sm"
              @click="openLabelModal(row)"
            >
              재출력
            </button>
          </template>
        </BaseTable>
      </div>
    </div>

    <!-- ── 모달 ──────────────────────────────────── -->
    <LabelPrintModal
      :isOpen="showLabelModal"
      :order="targetOrder"
      @confirm="handleLabelConfirm"
      @cancel="showLabelModal = false"
    />

    <BulkLabelModal
      :isOpen="showBulkModal"
      :selectedOrders="selectedOrders"
      @confirm="handleBulkConfirm"
      @cancel="showBulkModal = false"
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
/* ── 안내 배너 ─────────────────────────────────── */
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--blue-pale);
  border: 1px solid var(--blue);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--t2);
  line-height: 1.5;
}

.info-banner svg { flex-shrink: 0; margin-top: 2px; color: var(--blue); }
.info-banner p   { margin: 0; }

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

.card-title-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--t1);
}

.selected-info {
  font-size: var(--font-size-sm);
  color: var(--t3);
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

/* ── 테이블 ────────────────────────────────────── */
.table-section { padding: var(--space-4); }

/* ── 셀 헬퍼 ────────────────────────────────────── */
.mono      { font-family: var(--font-mono); font-size: var(--font-size-xs); }
.order-id  { color: var(--blue); }
.text-muted { color: var(--t3); }
.rate      { font-weight: 700; color: var(--green); }

/* ── 배지 ──────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.badge--amber { background: var(--amber-pale); color: #b45309; }

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