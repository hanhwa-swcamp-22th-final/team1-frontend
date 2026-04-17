<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'
import SingleDispatchModal from '@/components/whManager/SingleDispatchModal.vue'
import BulkDispatchModal from '@/components/whManager/BulkDispatchModal.vue'
import { getWhmPendingOrders, dispatchSingleOrder, bulkDispatchOrders, getWhmWorkers } from '@/api/wms'
import { ORDER_STATUS, STOCK_STATUS } from '@/constants'

// ── 데이터
const orders   = ref([])
const workers  = ref([])
const loading  = ref(false)

// ── 필터
const searchText    = ref('')
const filterSeller  = ref('')
const filterChannel = ref('')

// ── 페이지네이션
const currentPage = ref(1)
const PAGE_SIZE   = 8

// ── 체크박스 선택
const selectedIds = ref(new Set())

// ── 모달
const showBulkModal   = ref(false)
const showSingleModal = ref(false)
const targetOrder     = ref(null)

// ── 토스트
const toast = ref({ visible: false, message: '', type: 'success' })

function showToast(message, type = 'success') {
  toast.value = { visible: true, message, type }
}

async function fetchOrders() {
  loading.value = true
  try {
    const { data } = await getWhmPendingOrders()
    orders.value = data.data
  } catch (e) {
    console.error('주문 목록 로드 실패:', e)
  } finally {
    loading.value = false
  }
}

async function fetchWorkers() {
  try {
    const { data } = await getWhmWorkers()
    workers.value = data.data
  } catch (e) {
    console.error('작업자 목록 로드 실패:', e)
  }
}

onMounted(() => {
  fetchOrders()
  fetchWorkers()
})

// 필터 바뀌면 1페이지·선택 초기화
watch([searchText, filterSeller, filterChannel], () => {
  currentPage.value = 1
  selectedIds.value = new Set()
})

// ── 클라이언트 필터링
const filtered = computed(() => {
  let list = orders.value

  if (filterSeller.value) {
    list = list.filter(o => o.sellerName === filterSeller.value)
  }
  if (filterChannel.value) {
    list = list.filter(o => o.channel === filterChannel.value)
  }
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.sellerName.toLowerCase().includes(q),
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

// ── 셀러 목록 (중복 제거)
const sellerOptions = computed(() =>
  [...new Set(orders.value.map(o => o.sellerName))],
)

// ── 출고 가능한 선택 건수 (재고 부족 제외)
const validSelectedCount = computed(() =>
  [...selectedIds.value].filter(id => {
    const o = orders.value.find(o => o.id === id)
    return o?.stockStatus !== STOCK_STATUS.INSUFFICIENT
  }).length,
)

// ── 전체 선택 여부 (필터된 전체 목록 기준)
const isAllChecked = computed(() => {
  const dispatchable = filtered.value.filter(o => o.stockStatus !== STOCK_STATUS.INSUFFICIENT)
  return dispatchable.length > 0 && dispatchable.every(o => selectedIds.value.has(o.id))
})

const isIndeterminate = computed(() => {
  const dispatchable = filtered.value.filter(o => o.stockStatus !== STOCK_STATUS.INSUFFICIENT)
  return dispatchable.some(o => selectedIds.value.has(o.id)) && !isAllChecked.value
})

function toggleAll() {
  const dispatchable = filtered.value.filter(o => o.stockStatus !== STOCK_STATUS.INSUFFICIENT)
  if (isAllChecked.value) {
    dispatchable.forEach(o => selectedIds.value.delete(o.id))
  } else {
    dispatchable.forEach(o => selectedIds.value.add(o.id))
  }
  selectedIds.value = new Set(selectedIds.value)
}

function toggleRow(id) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value)
}

// ── 개별 출고 지시 열기
function openSingle(order) {
  targetOrder.value = order
  showSingleModal.value = true
}

// ── 개별 출고 지시 확정
async function handleSingleConfirm(payload) {
  try {
    await dispatchSingleOrder(payload.orderId, { workerId: payload.workerId, status: ORDER_STATUS.PREPARING_ITEM })
    orders.value = orders.value.filter(o => o.id !== payload.orderId)
    selectedIds.value.delete(payload.orderId)
    selectedIds.value = new Set(selectedIds.value)
    showSingleModal.value = false
    showToast(`${payload.orderId} 출고 지시가 완료되었습니다.`, 'success')
  } catch (e) {
    showToast('출고 지시 처리 중 오류가 발생했습니다.', 'error')
  }
}

// ── 일괄 출고 지시 확정
async function handleBulkConfirm(payload) {
  const ids = [...selectedIds.value].filter(id => {
    const o = orders.value.find(o => o.id === id)
    return o?.stockStatus !== STOCK_STATUS.INSUFFICIENT
  })
  try {
    const { data } = await bulkDispatchOrders({ orderIds: ids, ...payload })
    const result = data?.data ?? {}
    const succeededOrderIds = Array.isArray(result.succeededOrderIds) ? result.succeededOrderIds : []
    const failedOrders = Array.isArray(result.failedOrders) ? result.failedOrders : []

    orders.value = orders.value.filter(o => !succeededOrderIds.includes(o.id))
    selectedIds.value = new Set(failedOrders.map(order => order.orderId))
    showBulkModal.value = false

    if (!failedOrders.length) {
      showToast(`${succeededOrderIds.length}건 일괄 출고 지시가 완료되었습니다.`, 'success')
      return
    }

    const failedSummary = failedOrders
      .slice(0, 2)
      .map(order => `${order.orderId}(${order.reason ?? '실패'})`)
      .join(', ')

    showToast(
      `${succeededOrderIds.length}건 성공, ${failedOrders.length}건 실패했습니다. ${failedSummary}`,
      succeededOrderIds.length ? 'success' : 'error',
    )
  } catch (e) {
    showToast('일괄 출고 지시 처리 중 오류가 발생했습니다.', 'error')
  }
}

// ── 컬럼 정의
const columns = [
  { key: 'checkbox',       label: '',        width: '44px',  align: 'center' },
  { key: 'id',             label: '주문번호', width: '170px' },
  { key: 'channel',        label: '채널',     width: '80px',  align: 'center' },
  { key: 'sellerName',     label: '셀러' },
  { key: 'itemSummary',    label: '상품 / 수량' },
  { key: 'shipDestination',label: '배송지',   width: '100px' },
  { key: 'orderDate',      label: '주문일',   width: '100px' },
  { key: 'stockStatus',    label: '재고 상태', width: '110px', align: 'center' },
  { key: 'actions',        label: '작업',     width: '80px',  align: 'center' },
]

const breadcrumb = [
  { label: 'CONK' },
  { label: '출고 관리' },
  { label: '출고 지시' },
]
</script>

<template>
  <AppLayout title="출고 지시" :breadcrumb="breadcrumb">

    <!-- ── 상단 액션 슬롯 ─────────────────────────── -->
    <template #header-action>
      <button class="ui-btn ui-btn--ghost" @click="toggleAll">
        {{ isAllChecked ? '전체 해제' : '전체 선택' }}
      </button>
      <button
        class="ui-btn ui-btn--primary"
        :disabled="validSelectedCount === 0"
        @click="showBulkModal = true"
      >
        <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
          <path d="M1 6.5h9M7.5 4l3 2.5-3 2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        일괄 출고 지시 발행
      </button>
    </template>

    <!-- ── 카드 ──────────────────────────────────── -->
    <div class="card">
      <!-- 카드 헤더 -->
      <div class="card-header">
        <div class="card-title-wrap">
          <span class="card-title">출고 지시 대기 주문</span>
          <span class="badge badge--blue">{{ orders.length }}건 대기 중</span>
        </div>
        <span v-if="validSelectedCount > 0" class="selected-info">
          <strong>{{ validSelectedCount }}</strong>건 선택됨
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
            placeholder="주문번호, 셀러명 검색..."
          />
        </div>

        <select v-model="filterSeller" class="select-filter">
          <option value="">전체 셀러</option>
          <option v-for="seller in sellerOptions" :key="seller" :value="seller">{{ seller }}</option>
        </select>

        <select v-model="filterChannel" class="select-filter">
          <option value="">전체 채널</option>
          <option value="AMAZON">Amazon</option>
          <option value="MANUAL">수동 등록</option>
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
          <!-- 헤더: 전체 선택 체크박스 -->
          <template #header-checkbox>
            <input
              type="checkbox"
              :checked="isAllChecked"
              :indeterminate="isIndeterminate"
              @change="toggleAll"
              style="cursor:pointer"
            />
          </template>

          <!-- 행: 체크박스 -->
          <template #cell-checkbox="{ row }">
            <input
              type="checkbox"
              :checked="selectedIds.has(row.id)"
              :disabled="row.stockStatus === STOCK_STATUS.INSUFFICIENT"
              @change="toggleRow(row.id)"
            />
          </template>

          <!-- 주문번호 -->
          <template #cell-id="{ row }">
            <span class="mono order-id">{{ row.id }}</span>
          </template>

          <!-- 채널 배지 -->
          <template #cell-channel="{ row }">
            <span
              class="badge"
              :class="row.channel === 'AMAZON' ? 'badge--blue' : 'badge--gray'"
            >
              {{ row.channel === 'AMAZON' ? 'Amazon' : '수동' }}
            </span>
          </template>

          <!-- 주문일 -->
          <template #cell-orderDate="{ row }">
            <span class="text-muted">{{ row.orderDate }}</span>
          </template>

          <!-- 재고 상태 배지 -->
          <template #cell-stockStatus="{ row }">
            <StatusBadge :status="row.stockStatus" type="stockStatus" />
          </template>

          <!-- 작업 버튼 -->
          <template #cell-actions="{ row }">
            <button
              class="ui-btn ui-btn--ghost ui-btn--sm"
              :disabled="row.stockStatus === STOCK_STATUS.INSUFFICIENT"
              @click="openSingle(row)"
            >
              {{ row.stockStatus === STOCK_STATUS.INSUFFICIENT ? '지시불가' : '지시' }}
            </button>
          </template>
        </BaseTable>
      </div>
    </div>

    <!-- ── 모달 ──────────────────────────────────── -->
    <SingleDispatchModal
      :isOpen="showSingleModal"
      :order="targetOrder"
      :workers="workers"
      @confirm="handleSingleConfirm"
      @cancel="showSingleModal = false"
    />

    <BulkDispatchModal
      :isOpen="showBulkModal"
      :selectedCount="validSelectedCount"
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

/* ── 테이블 ────────────────────────────────────── */
.table-section { padding: var(--space-4); }

/* ── Cell 헬퍼 ─────────────────────────────────── */
.mono     { font-family: var(--font-mono); font-size: var(--font-size-xs); }
.order-id { color: var(--blue); }
.text-muted { color: var(--t3); }

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
.badge--blue  { background: var(--blue-pale);  color: var(--blue); }
.badge--gray  { background: var(--surface-2);  color: var(--t3); }

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

.ui-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ui-btn--primary {
  background: var(--blue);
  color: #fff;
}
.ui-btn--primary:not(:disabled):hover { opacity: 0.9; }

.ui-btn--ghost {
  border-color: var(--border);
  background: transparent;
  color: var(--t2);
}
.ui-btn--ghost:not(:disabled):hover { background: var(--surface-2); color: var(--t1); }
.ui-btn--sm { height: 28px; font-size: var(--font-size-xs); white-space: nowrap; }
</style>
