<script setup>
/**
 * 셀러 주문 목록 화면.
 * mock-server seller 주문 목록 API를 기준으로 상태/채널 필터와 테이블 UI를 구성한다.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { cancelSellerOrder, getSellerOrderDetail, getSellerOrderList } from '@/api/order.js'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import SellerConfirmDialog from '@/components/seller/SellerConfirmDialog.vue'
import SellerOrderDetailModal from '@/components/seller/SellerOrderDetailModal.vue'
import { ROUTE_NAMES } from '@/constants'
import { downloadExcel } from '@/utils/excel.js'
import {
  buildSellerOrderExportRows,
  getSellerOrderChannelMeta,
  getSellerOrderStatusMeta,
  normalizeSellerOrderDetail,
  SELLER_ORDER_CHANNEL_OPTIONS,
  SELLER_ORDER_LIST_COLUMNS,
  SELLER_ORDER_STATUS_OPTIONS,
} from '@/utils/seller/orderList.utils.js'

/** Header 브레드크럼 표시용 */
const breadcrumb = [{ label: 'Seller' }, { label: '주문 목록' }]

// 목록 화면은 상태, 채널, 검색어 조합으로 먼저 필터링한다.
const activeStatus = ref('all')
const activeChannel = ref('all')
const searchKeyword = ref('')
const toolbarMessage = ref('')
const loadErrorMessage = ref('')
const isLoading = ref(false)
const orderRows = ref([])
const selectedOrderId = ref('')
const pendingCancelOrderId = ref('')
const isDetailModalOpen = ref(false)
const isCancelDialogOpen = ref(false)
const isCsvDialogOpen = ref(false)

const currentPage = ref(1)
const PAGE_SIZE = 10
const totalItems = ref(0)
const selectedOrderDetail = ref(null)

watch([activeStatus, activeChannel, searchKeyword], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1
    return
  }

  void fetchSellerOrders()
})

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: PAGE_SIZE,
  total: totalItems.value,
}))

function handlePageChange(page) {
  currentPage.value = page
}

async function fetchSellerOrders() {
  isLoading.value = true
  loadErrorMessage.value = ''

  try {
    const res = await getSellerOrderList({
      page: currentPage.value - 1,
      size: PAGE_SIZE,
      status: activeStatus.value === 'all' ? undefined : activeStatus.value,
      channel: activeChannel.value === 'all' ? undefined : activeChannel.value,
      search: searchKeyword.value || undefined,
    })
    const payload = res.data?.data
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.orders)
        ? payload.orders
        : Array.isArray(payload?.items)
          ? payload.items
          : []

    orderRows.value = rows.map((row) => ({ ...row }))
    totalItems.value = Number(payload?.totalCount ?? payload?.total ?? rows.length)
  } catch (error) {
    console.error('[SellerOrderListView] fetch error:', error)
    loadErrorMessage.value = '주문 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    orderRows.value = []
    totalItems.value = 0
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchSellerOrders)

watch(currentPage, () => {
  void fetchSellerOrders()
})

const selectedOrder = computed(() => {
  return orderRows.value.find((row) => row.id === selectedOrderId.value) ?? null
})

const pendingCancelOrder = computed(() => {
  return orderRows.value.find((row) => row.id === pendingCancelOrderId.value) ?? null
})

const csvDialogMessage = computed(() => {
  return `${orderRows.value.length}건 주문 목록을 CSV로 내보내시겠습니까?`
})

function showToolbarMessage(message) {
  toolbarMessage.value = message
}

function handleOpenCsvDialog() {
  if (!orderRows.value.length) {
    showToolbarMessage('내보낼 주문이 없습니다.')
    return
  }

  isCsvDialogOpen.value = true
}

function handleCloseCsvDialog() {
  isCsvDialogOpen.value = false
}

function handleConfirmCsv() {
  if (!orderRows.value.length) {
    handleCloseCsvDialog()
    showToolbarMessage('내보낼 주문이 없습니다.')
    return
  }

  downloadExcel(
    buildSellerOrderExportRows(orderRows.value),
    `seller-orders-${new Date().toISOString().slice(0, 10)}`,
  )
  showToolbarMessage('현재 필터 기준 주문 목록을 다운로드했습니다.')
  handleCloseCsvDialog()
}

async function handleOpenOrderDetail(row) {
  try {
    const response = await getSellerOrderDetail(row.id)
    selectedOrderDetail.value = normalizeSellerOrderDetail(response.data?.data ?? {}, row)
    selectedOrderId.value = row.id
    isDetailModalOpen.value = true
  } catch (error) {
    showToolbarMessage(error.response?.data?.message ?? '주문 상세를 불러오지 못했습니다.')
  }
}

function handleCloseOrderDetail() {
  isDetailModalOpen.value = false
  selectedOrderId.value = ''
  selectedOrderDetail.value = null
}

function handleOpenCancelDialog(row) {
  pendingCancelOrderId.value = row.id
  isCancelDialogOpen.value = true
}

function handleCloseCancelDialog() {
  isCancelDialogOpen.value = false
  pendingCancelOrderId.value = ''
}

async function handleConfirmCancel() {
  if (!pendingCancelOrder.value) return

  try {
    await cancelSellerOrder(pendingCancelOrder.value.id)
    toolbarMessage.value = `${pendingCancelOrder.value.orderNo} 주문을 취소했습니다.`
    handleCloseCancelDialog()
    await fetchSellerOrders()
  } catch (error) {
    showToolbarMessage(error.response?.data?.message ?? '주문 취소 처리에 실패했습니다.')
  }
}
</script>

<template>
  <AppLayout title="주문 목록" :breadcrumb="breadcrumb">
    <template #header-action>
      <RouterLink :to="{ name: ROUTE_NAMES.SELLER_ORDER_REGISTER }" class="ui-btn ui-btn--primary">
        주문 등록
      </RouterLink>
    </template>

    <section class="seller-order-list-page">
      <section class="list-card">
        <div class="toolbar">
          <div class="filter-stack">
            <div class="filter-row">
              <span class="filter-label">상태</span>

              <button
                v-for="option in SELLER_ORDER_STATUS_OPTIONS"
                :key="option.key"
                type="button"
                class="filter-badge"
                :class="{ 'filter-badge--active': activeStatus === option.key }"
                @click="activeStatus = option.key"
              >
                {{ option.label }}
              </button>
            </div>

            <div class="filter-row">
              <span class="filter-label">채널</span>

              <button
                v-for="option in SELLER_ORDER_CHANNEL_OPTIONS"
                :key="option.key"
                type="button"
                class="filter-badge"
                :class="{ 'filter-badge--active': activeChannel === option.key }"
                @click="activeChannel = option.key"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="toolbar-right">
            <label class="search-box">
              <span class="sr-only">검색</span>
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="주문번호 또는 수령자명 검색"
              />
            </label>

            <button
              class="ui-btn ui-btn--ghost toolbar-btn"
              type="button"
              @click="handleOpenCsvDialog"
            >
              CSV 내보내기
            </button>
          </div>
        </div>

        <p v-if="loadErrorMessage" class="toolbar-message toolbar-message--error">{{ loadErrorMessage }}</p>
        <p v-else-if="toolbarMessage" class="toolbar-message">{{ toolbarMessage }}</p>

        <BaseTable
          :columns="SELLER_ORDER_LIST_COLUMNS"
          :loading="isLoading"
          :rows="orderRows"
          :pagination="pagination"
          row-key="id"
          @page-change="handlePageChange"
        >
          <template #cell-orderNo="{ row, value }">
            <button class="cell-trigger cell-trigger--order" type="button" @click="handleOpenOrderDetail(row)">
              <span class="order-num">{{ value }}</span>
            </button>
          </template>

          <template #cell-channel="{ row, value }">
            <button class="cell-trigger" type="button" @click="handleOpenOrderDetail(row)">
              <span
                class="channel-tag"
                :class="`channel-tag--${getSellerOrderChannelMeta(value).tone}`"
              >
                {{ getSellerOrderChannelMeta(value).label }}
              </span>
            </button>
          </template>

          <template #cell-recipient="{ row, value }">
            <button class="cell-trigger cell-trigger--text" type="button" @click="handleOpenOrderDetail(row)">
              {{ value }}
            </button>
          </template>

          <template #cell-address="{ row, value }">
            <button class="cell-trigger cell-trigger--text" type="button" @click="handleOpenOrderDetail(row)">
              {{ value }}
            </button>
          </template>

          <template #cell-itemsSummary="{ row, value }">
            <button class="cell-trigger cell-trigger--text" type="button" @click="handleOpenOrderDetail(row)">
              <span class="sku-summary">{{ value }}</span>
            </button>
          </template>

          <template #cell-orderedAt="{ row, value }">
            <button class="cell-trigger cell-trigger--text" type="button" @click="handleOpenOrderDetail(row)">
              {{ value }}
            </button>
          </template>

          <template #cell-status="{ row, value }">
            <button class="cell-trigger" type="button" @click="handleOpenOrderDetail(row)">
              <span
                class="order-status-badge"
                :class="`order-status-badge--${getSellerOrderStatusMeta(value).tone}`"
              >
                {{ getSellerOrderStatusMeta(value).label }}
              </span>
            </button>
          </template>

          <template #cell-trackingNo="{ row, value }">
            <button class="cell-trigger cell-trigger--text" type="button" @click="handleOpenOrderDetail(row)">
              <span :class="{ 'tracking-empty': !value }">{{ value || '—' }}</span>
            </button>
          </template>

          <template #cell-actions="{ row }">
            <button
              v-if="row.canCancel"
              class="action-btn action-btn--danger"
              type="button"
              @click.stop="handleOpenCancelDialog(row)"
            >
              취소
            </button>
            <span v-else class="action-empty">—</span>
          </template>
        </BaseTable>
      </section>
    </section>

    <SellerOrderDetailModal
      :detail="selectedOrderDetail"
      :isOpen="isDetailModalOpen"
      :order="selectedOrder"
      @cancel="handleCloseOrderDetail"
    />

    <SellerConfirmDialog
      :isOpen="isCancelDialogOpen"
      :message="pendingCancelOrder ? `${pendingCancelOrder.orderNo} 주문을 취소하시겠습니까?` : '주문을 취소하시겠습니까?'"
      confirmLabel="취소 확정"
      title="주문 취소"
      :danger="true"
      @cancel="handleCloseCancelDialog"
      @confirm="handleConfirmCancel"
    />

    <SellerConfirmDialog
      :isOpen="isCsvDialogOpen"
      title="CSV 내보내기"
      :message="csvDialogMessage"
      confirmLabel="내보내기"
      @cancel="handleCloseCsvDialog"
      @confirm="handleConfirmCsv"
    />
  </AppLayout>
</template>

<style scoped>
.seller-order-list-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.list-card {
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.filter-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.filter-label {
  color: var(--t3);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.filter-badge {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--t3);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition:
    background var(--ease-fast),
    border-color var(--ease-fast),
    color var(--ease-fast);
}

.filter-badge--active {
  border-color: var(--gold);
  background: var(--gold-pale);
  color: var(--t1);
}

.toolbar-right {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;
}

.search-box {
  flex: 1 1 240px;
  min-width: 220px;
  max-width: 280px;
}

.search-box input {
  width: 100%;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-md);
  outline: none;
  transition:
    border-color var(--ease-fast),
    box-shadow var(--ease-fast);
}

.search-box input:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-pale);
}

.toolbar-btn {
  flex-shrink: 0;
  min-height: 38px;
  min-width: 112px;
  padding-inline: 16px;
  white-space: nowrap;
}

.toolbar-btn--compact {
  min-width: 64px;
}

.toolbar-message {
  margin: 0 0 var(--space-4);
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.toolbar-message--error {
  color: var(--red);
}

.order-num {
  color: var(--t1);
  font-family: var(--font-condensed);
  font-size: var(--font-size-md);
  font-weight: 700;
}

.cell-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.cell-trigger--order {
  width: auto;
}

.cell-trigger--text:hover {
  color: var(--blue);
}

.channel-tag,
.order-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.channel-tag--amazon {
  background: #fff3e0;
  color: #e65100;
}

.channel-tag--manual {
  background: var(--surface-2);
  color: var(--t2);
}

.channel-tag--excel {
  background: var(--blue-pale);
  color: var(--blue);
}

.channel-tag--default {
  background: var(--surface-2);
  color: var(--t3);
}

.order-status-badge--blue {
  background: var(--blue-pale);
  color: var(--blue);
}

.order-status-badge--indigo {
  background: rgba(99, 102, 241, 0.12);
  color: #4338ca;
}

.order-status-badge--amber {
  background: var(--amber-pale);
  color: #b45309;
}

.order-status-badge--gold {
  background: var(--gold-pale);
  color: #92400e;
}

.order-status-badge--green {
  background: var(--green-pale);
  color: var(--green);
}

.order-status-badge--red {
  background: var(--red-pale);
  color: var(--red);
}

.order-status-badge--default {
  background: var(--surface-2);
  color: var(--t3);
}

.sku-summary {
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  color: var(--t3);
  font-size: var(--font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tracking-empty {
  color: var(--t4);
}

.action-btn {
  min-height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
}

.action-btn--danger {
  border: 1px solid var(--red);
  background: var(--surface);
  color: var(--red);
}

.action-btn--danger:hover {
  background: var(--red-pale);
}

.action-empty {
  color: var(--t4);
  font-size: var(--font-size-sm);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 1080px) {
  .toolbar {
    flex-direction: column;
  }

  .toolbar-right {
    flex-wrap: wrap;
  }

  .search-box {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .list-card {
    padding: var(--space-5);
  }
}
</style>
