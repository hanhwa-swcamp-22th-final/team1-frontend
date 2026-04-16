<script setup>
/**
 * OrderList -- 총괄관리자 주문 목록(출고 주문 현황) 페이지
 *
 * 레이아웃:
 *   상태 필터 탭 + 검색 + 창고/채널/셀러사 셀렉트
 *   BaseTable (클라이언트 사이드 필터링 + 페이지네이션)
 *
 * 데이터 흐름:
 *   onMounted -> getOrderList() -> allOrders
 *   탭/검색/셀렉트 변경 -> filteredOrders(computed) -> paginatedOrders(computed) -> BaseTable
 */
import { ref, computed, onMounted, watch } from 'vue'
import { getOrderList } from '@/api/order'
import { ORDER_STATUS } from '@/constants'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import MasterListToolbar from '@/components/masterAdmin/MasterListToolbar.vue'
import MasterStatusTabs from '@/components/masterAdmin/MasterStatusTabs.vue'

// -- 브레드크럼 ---------------------------------------------------------------
const breadcrumb = [{ label: '입출고' }, { label: '주문 목록' }]

// -- BaseTable 컬럼 정의 ------------------------------------------------------
const COLUMNS = [
  { key: 'id', label: '주문번호', width: '190px' },
  { key: 'channel', label: '채널', width: '100px' },
  { key: 'company', label: '셀러사', width: '140px' },
  { key: 'warehouse', label: '창고', width: '210px' },
  { key: 'sku', label: 'SKU / 수량', width: '130px' },
  { key: 'destState', label: '배송지(주)', width: '90px', align: 'center' },
  { key: 'orderedAt', label: '주문일', width: '130px' },
  { key: 'status', label: '상태', width: '120px' },
]

// -- 상태 탭 정의 -------------------------------------------------------------
const TABS = [
  { key: 'ALL', label: '전체', color: null },
  { key: ORDER_STATUS.PENDING, label: '접수', color: { bg: 'var(--amber-pale)', border: 'var(--amber)', text: '#b45309' } },
  { key: ORDER_STATUS.CONFIRMED, label: '확인', color: { bg: 'var(--blue-pale)', border: 'var(--blue)', text: 'var(--blue)' } },
  { key: ORDER_STATUS.PREPARING_ITEM, label: '물품준비중', color: { bg: 'var(--purple-pale)', border: 'var(--purple)', text: 'var(--purple)' } },
  { key: ORDER_STATUS.SHIPPED, label: '출고완료', color: { bg: 'var(--green-pale)', border: 'var(--green)', text: 'var(--green)' } },
  { key: ORDER_STATUS.CANCELLED, label: '취소', color: { bg: 'var(--red-pale)', border: 'var(--red)', text: 'var(--red)' } },
]

// -- 채널 배지 매핑 -----------------------------------------------------------
const CHANNEL_MAP = {
  AMAZON: { label: 'Amazon', cls: 'ch-amazon' },
  MANUAL: { label: '수동', cls: 'ch-manual' },
  EXCEL: { label: '엑셀', cls: 'ch-excel' },
}

// -- 상태 --------------------------------------------------------------------
const allOrders = ref([])
const isLoading = ref(false)
const activeTab = ref('ALL')
const searchQ = ref('')
const filterWh = ref('')
const filterCh = ref('')
const filterCo = ref('')
const page = ref(1)
const PAGE_SIZE = 10

// -- 동적 셀렉트 옵션 ---------------------------------------------------------
const warehouseOptions = computed(() => [...new Set(allOrders.value.map(order => order.warehouse))])
const companyOptions = computed(() => [...new Set(allOrders.value.map(order => order.company))])
const toolbarFilters = computed(() => [
  { key: 'warehouse', value: filterWh.value, placeholder: '전체 창고', options: warehouseOptions.value },
  {
    key: 'channel',
    value: filterCh.value,
    placeholder: '전체 채널',
    options: [
      { label: 'Amazon FBM', value: 'AMAZON' },
      { label: '수동 입력', value: 'MANUAL' },
      { label: '엑셀 업로드', value: 'EXCEL' },
    ],
  },
  { key: 'company', value: filterCo.value, placeholder: '셀러사 전체', options: companyOptions.value },
])

// -- 탭 카운트 ----------------------------------------------------------------
const TAB_COUNT = computed(() => {
  const base = { ALL: allOrders.value.length }
  for (const tab of TABS) {
    if (tab.key !== 'ALL') {
      base[tab.key] = allOrders.value.filter(order => order.status === tab.key).length
    }
  }
  return base
})

// -- 클라이언트 사이드 필터링 --------------------------------------------------
const filteredOrders = computed(() => {
  return allOrders.value
    .filter(order => activeTab.value === 'ALL' || order.status === activeTab.value)
    .filter(order => !filterWh.value || order.warehouse === filterWh.value)
    .filter(order => !filterCh.value || order.channel === filterCh.value)
    .filter(order => !filterCo.value || order.company === filterCo.value)
    .filter(order => {
      if (!searchQ.value) return true
      const query = searchQ.value.toLowerCase()
      return order.id.toLowerCase().includes(query) || order.company.toLowerCase().includes(query)
    })
})

// -- 클라이언트 사이드 페이지네이션 --------------------------------------------
const paginatedOrders = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredOrders.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({
  page: page.value,
  pageSize: PAGE_SIZE,
  total: filteredOrders.value.length,
}))

watch([activeTab, searchQ, filterWh, filterCh, filterCo], () => {
  page.value = 1
})

// -- 데이터 로드 ---------------------------------------------------------------
async function fetchAll() {
  isLoading.value = true
  try {
    const res = await getOrderList()
    const payload = Array.isArray(res.data?.data?.orders) ? res.data.data.orders : []
    allOrders.value = payload.map((order) => ({
      ...order,
      id: String(order.id ?? ''),
      company: String(order.company ?? ''),
      warehouse: String(order.warehouse ?? ''),
      channel: String(order.channel ?? ''),
      status: String(order.status ?? ''),
      destState: String(order.destState ?? ''),
      skuCount: Number(order.skuCount ?? 0),
      qty: Number(order.qty ?? 0),
    }))
  } catch (error) {
    console.error('[OrderList] fetch error:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAll)

// -- 채널 배지 헬퍼 -----------------------------------------------------------
function channelInfo(channel) {
  return CHANNEL_MAP[channel] ?? { label: channel, cls: 'ch-manual' }
}

function handleToolbarFilter({ key, value }) {
  if (key === 'warehouse') filterWh.value = value
  if (key === 'channel') filterCh.value = value
  if (key === 'company') filterCo.value = value
}

// -- 주문 상세 모달 -----------------------------------------------------------
const showOrderDetail = ref(false)
const selectedOrder = ref(null)

function openOrderDetail(row) {
  selectedOrder.value = row
  showOrderDetail.value = true
}

function closeOrderDetail() {
  showOrderDetail.value = false
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="주문 목록" :loading="isLoading">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost btn-refresh" @click="fetchAll">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <path d="M12.5 2.5A6 6 0 1 1 9 1.2" />
          <path d="M9 1v3h3" />
        </svg>
        새로고침
      </button>
    </template>

    <!-- -- 툴바 ------------------------------------------------------------- -->
    <div class="toolbar">
      <!-- 공통 상태 탭: 주문 상태 정의와 카운트만 주입한다. -->
      <MasterStatusTabs
        :tabs="TABS"
        :active-key="activeTab"
        :counts="TAB_COUNT"
        @change="activeTab = $event"
      />

      <!-- 공통 검색/셀렉트 툴바: 검색어와 필터 상태만 부모가 관리한다. -->
      <MasterListToolbar
        :search-value="searchQ"
        search-placeholder="주문번호, 셀러사 검색"
        search-width="220px"
        :filters="toolbarFilters"
        @update:search-value="searchQ = $event"
        @update:filter="handleToolbarFilter"
      />
    </div>

    <!-- -- 데이터 테이블 ------------------------------------------------------ -->
    <BaseTable
      :columns="COLUMNS"
      :rows="paginatedOrders"
      :loading="isLoading"
      :pagination="pagination"
      row-key="id"
      clickable
      @page-change="page = $event"
      @row-click="openOrderDetail"
    >
      <template #cell-id="{ value }">
        <span class="order-num">{{ value }}</span>
      </template>

      <template #cell-channel="{ value }">
        <span :class="['channel-badge', channelInfo(value).cls]">{{ channelInfo(value).label }}</span>
      </template>

      <template #cell-sku="{ row }">
        <span class="cell-bold">{{ row.skuCount }} SKU / {{ row.qty }} EA</span>
      </template>

      <template #cell-destState="{ value }">
        <span class="cell-state">{{ value }}</span>
      </template>

      <template #cell-orderedAt="{ value }">
        <span class="date-normal">{{ value }}</span>
      </template>

      <template #cell-status="{ value }">
        <StatusBadge :status="value" type="order" />
      </template>
    </BaseTable>

    <BaseModal
      title="주문 상세 정보"
      :is-open="showOrderDetail"
      width="580px"
      :hide-footer="true"
      @cancel="closeOrderDetail"
    >
      <template v-if="selectedOrder">
        <div class="detail-header">
          <span class="detail-order-id">{{ selectedOrder.id }}</span>
          <span :class="['channel-badge', channelInfo(selectedOrder.channel).cls]">
            {{ channelInfo(selectedOrder.channel).label }}
          </span>
          <StatusBadge :status="selectedOrder.status" type="order" />
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">셀러사</span>
            <span class="detail-value">{{ selectedOrder.company }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">배송 창고</span>
            <span class="detail-value">{{ selectedOrder.warehouse }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">배송지(주)</span>
            <span class="detail-value">{{ selectedOrder.destState }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">SKU 수</span>
            <span class="detail-value">{{ selectedOrder.skuCount }} SKU</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">총 수량</span>
            <span class="detail-value">{{ selectedOrder.qty?.toLocaleString() }} EA</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">주문일</span>
            <span class="detail-value">{{ selectedOrder.orderedAt }}</span>
          </div>
        </div>
      </template>

      <template #footer>
        <button class="ui-btn ui-btn--ghost" @click="closeOrderDetail">닫기</button>
      </template>
    </BaseModal>
  </AppLayout>
</template>

<style scoped>
@import '../../assets/styles/master-admin.css';

/* -- 셀 커스텀 스타일 -------------------------------------------------------- */
.order-num {
  font-family: 'IBM Plex Sans', monospace;
  font-weight: 500;
  font-size: 13px;
  color: var(--blue);
  white-space: nowrap;
}

.channel-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 3px;
  font-family: 'Barlow', sans-serif;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.ch-amazon {
  background: #FFF3E0;
  color: #E65100;
}

.ch-manual {
  background: var(--border);
  color: var(--t3);
}

.ch-excel {
  background: var(--green-pale);
  color: var(--green);
}

.cell-bold {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  white-space: nowrap;
}

.cell-state {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  white-space: nowrap;
}

.detail-order-id {
  font-family: 'IBM Plex Sans', monospace;
  font-weight: 600;
  font-size: 15px;
  color: var(--blue);
}
</style>
