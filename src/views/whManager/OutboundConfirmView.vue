<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SingleOutboundConfirmModal from '@/components/whManager/SingleOutboundConfirmModal.vue'
import BulkOutboundConfirmModal from '@/components/whManager/BulkOutboundConfirmModal.vue'
import { getWhmOutboundConfirmOrders, confirmSingleOutbound, bulkConfirmOutbound } from '@/api/wh-manager'
import { OUTBOUND_CONFIRM_STATUS } from '@/constants'

// ── 데이터
const orders  = ref([])
const loading = ref(false)

// ── 필터
const searchText    = ref('')
const filterSeller  = ref('')
const filterCarrier = ref('')

// ── 페이지네이션
const currentPage = ref(1)
const PAGE_SIZE   = 8

// ── 체크박스 선택
const selectedIds = ref(new Set())

// ── 모달
const showSingleModal = ref(false)
const showBulkModal   = ref(false)
const targetOrder     = ref(null)

// ── 토스트
const toast = ref({ visible: false, message: '', type: 'success' })
function showToast(message, type = 'success') {
  toast.value = { visible: true, message, type }
}

async function fetchOrders() {
  loading.value = true
  try {
    const { data } = await getWhmOutboundConfirmOrders()
    orders.value = data
  } catch (e) {
    console.error('출고 확정 목록 로드 실패:', e)
    showToast('목록을 불러오지 못했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)

watch([searchText, filterSeller, filterCarrier], () => {
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
  if (filterCarrier.value) list = list.filter(o => o.carrier === filterCarrier.value)
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.trackingNumber.toLowerCase().includes(q),
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

// ── 확정 대기 주문만 선택 가능
const selectableIds = computed(() =>
  paged.value
    .filter(o => o.status === OUTBOUND_CONFIRM_STATUS.PENDING_CONFIRM)
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

const selectedOrders = computed(() =>
  orders.value.filter(o => selectedIds.value.has(o.id)),
)

// ── 개별 출고 확정
function openSingleModal(order) {
  targetOrder.value = order
  showSingleModal.value = true
}

async function handleSingleConfirm(payload) {
  try {
    await confirmSingleOutbound(payload.orderId, { status: OUTBOUND_CONFIRM_STATUS.CONFIRMED })
    orders.value = orders.value.map(o =>
      o.id === payload.orderId ? { ...o, status: OUTBOUND_CONFIRM_STATUS.CONFIRMED } : o,
    )
    selectedIds.value.delete(payload.orderId)
    selectedIds.value = new Set(selectedIds.value)
    showSingleModal.value = false
    showToast(`${payload.orderId} 출고 확정이 완료되었습니다.`)
  } catch (e) {
    showToast('출고 확정 처리 중 오류가 발생했습니다.', 'error')
  }
}

// ── 일괄 출고 확정
async function handleBulkConfirm(payload) {
  try {
    await bulkConfirmOutbound(payload)
    const ids = payload.orderIds
    orders.value = orders.value.map(o =>
      ids.includes(o.id) ? { ...o, status: OUTBOUND_CONFIRM_STATUS.CONFIRMED } : o,
    )
    selectedIds.value = new Set()
    showBulkModal.value = false
    showToast(`${ids.length}건 일괄 출고 확정이 완료되었습니다.`)
  } catch (e) {
    showToast('일괄 출고 확정 처리 중 오류가 발생했습니다.', 'error')
  }
}

// ── 컬럼 정의
const columns = [
  { key: 'checkbox',       label: '',          width: '44px',  align: 'center' },
  { key: 'id',             label: '주문번호',   width: '170px' },
  { key: 'sellerName',     label: '셀러' },
  { key: 'itemSummary',    label: '상품 / 수량' },
  { key: 'carrierService', label: '배송사 / 서비스', width: '160px' },
  { key: 'trackingNumber', label: '송장번호',   width: '170px' },
  { key: 'shipState',      label: '배송지',     width: '80px'  },
  { key: 'labelIssuedAt',  label: '라벨 발행일', width: '100px', align: 'center' },
  { key: 'status',         label: '상태',       width: '120px', align: 'center' },
  { key: 'actions',        label: '작업',       width: '90px',  align: 'center' },
]

const breadcrumb = [
  { label: 'CONK' },
  { label: '출고 관리' },
  { label: '출고 확정' },
]
</script>

<template>
  <AppLayout title="출고 확정" :breadcrumb="breadcrumb" :loading="loading">

    <!-- ── 상단 액션 ───────────────────────────────── -->
    <template #header-action>
      <button
        class="ui-btn ui-btn--primary"
        :disabled="selectedIds.size === 0"
        @click="showBulkModal = true"
      >
        <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
          <path d="M2 6.5l3 3 6-6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        일괄 출고 확정
      </button>
    </template>

    <!-- ── 안내 배너 ──────────────────────────────── -->
    <div class="info-banner">
      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
        <circle cx="7" cy="7" r="5.5"/>
        <path d="M7 5v4M7 3.5v.5" stroke-linecap="round"/>
      </svg>
      <p>라벨 발행이 완료된 주문을 수령지에 인계하고 <strong>출고 확정</strong>을 처리합니다. 확정 즉시 할당 재고가 영구 차감됩니다.</p>
    </div>

    <!-- ── 카드 ───────────────────────────────────── -->
    <div class="card">
      <div class="card-header">
        <div class="card-title-wrap">
          <span class="card-title">인계 완료 — 출고 확정 대기</span>
          <span class="badge badge--amber">
            {{ orders.filter(o => o.status === OUTBOUND_CONFIRM_STATUS.PENDING_CONFIRM).length }}건 대기
          </span>
        </div>
        <span v-if="selectedIds.size > 0" class="selected-info">
          <strong>{{ selectedIds.size }}</strong>건 선택됨
        </span>
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
            placeholder="주문번호, 송장번호 검색..."
          />
        </div>
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
            :disabled="row.status === OUTBOUND_CONFIRM_STATUS.CONFIRMED"
            @change="toggleRow(row.id)"
          />
        </template>

        <!-- 주문번호 -->
        <template #cell-id="{ row }">
          <span class="mono order-id">{{ row.id }}</span>
        </template>

        <!-- 배송사 / 서비스 -->
        <template #cell-carrierService="{ row }">
          <div class="carrier-cell">
            <StatusBadge :status="row.carrier" type="carrier" />
            <span class="text-muted">{{ row.service }}</span>
          </div>
        </template>

        <!-- 송장번호 -->
        <template #cell-trackingNumber="{ row }">
          <span class="mono tracking">{{ row.trackingNumber }}</span>
        </template>

        <!-- 배송지 -->
        <template #cell-shipState="{ row }">
          <span class="text-muted">{{ row.shipState }}, {{ row.shipCountry }}</span>
        </template>

        <!-- 라벨 발행일 -->
        <template #cell-labelIssuedAt="{ row }">
          <span class="text-muted">{{ row.labelIssuedAt }}</span>
        </template>

        <!-- 상태 배지 -->
        <template #cell-status="{ row }">
          <StatusBadge :status="row.status" type="outboundConfirm" />
        </template>

        <!-- 작업 -->
        <template #cell-actions="{ row }">
          <button
            v-if="row.status === OUTBOUND_CONFIRM_STATUS.PENDING_CONFIRM"
            class="ui-btn ui-btn--primary ui-btn--sm"
            @click="openSingleModal(row)"
          >
            출고 확정
          </button>
          <button
            v-else
            class="ui-btn ui-btn--ghost ui-btn--sm"
            disabled
          >
            완료
          </button>
        </template>
      </BaseTable>
    </div>

    <!-- ── 모달 ──────────────────────────────────── -->
    <SingleOutboundConfirmModal
      :isOpen="showSingleModal"
      :order="targetOrder"
      @confirm="handleSingleConfirm"
      @cancel="showSingleModal = false"
    />

    <BulkOutboundConfirmModal
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
.mono      { font-family: var(--font-mono); font-size: var(--font-size-xs); }
.order-id  { color: var(--blue); }
.tracking  { color: var(--t3); }
.text-muted { color: var(--t3); font-size: var(--font-size-xs); }

.carrier-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

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