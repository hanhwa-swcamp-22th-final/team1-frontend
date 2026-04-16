<script setup>
/**
 * 셀러 재고 목록 화면.
 * mock-server seller 재고 목록 API를 기준으로 상태/창고 필터와 테이블 UI를 구성한다.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { getSellerInventoryDetail, getSellerInventoryList } from '@/api/wms.js'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import SellerConfirmDialog from '@/components/seller/SellerConfirmDialog.vue'
import SellerInventoryDetailModal from '@/components/seller/SellerInventoryDetailModal.vue'
import { downloadExcel } from '@/utils/excel.js'
import {
  buildSellerInventoryExportRows,
  getSellerInventoryStatusMeta,
  normalizeSellerInventoryDetail,
  SELLER_INVENTORY_LIST_COLUMNS,
  SELLER_INVENTORY_STATUS_OPTIONS,
} from '@/utils/seller/inventoryList.utils.js'

const breadcrumb = [{ label: 'Seller' }, { label: '재고 목록' }]

// 목록 화면은 상태, 창고, 검색어 조합으로 먼저 필터링한다.
const activeStatus = ref('all')
const activeWarehouse = ref('all')
const searchKeyword = ref('')
const toolbarMessage = ref('')
const loadErrorMessage = ref('')
const isLoading = ref(false)
const inventoryRows = ref([])
const selectedInventoryId = ref('')
const isDetailModalOpen = ref(false)
const isCsvDialogOpen = ref(false)

const currentPage = ref(1)
const PAGE_SIZE = 10
const totalItems = ref(0)
const selectedInventoryDetail = ref(null)

watch([activeStatus, activeWarehouse, searchKeyword], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1
    return
  }

  void fetchSellerInventories()
})

const warehouseOptions = computed(() => {
  const warehouses = new Set(inventoryRows.value.map((row) => row.warehouseName).filter(Boolean))
  return [{ key: 'all', label: '전체' }, ...[...warehouses].map((warehouse) => ({ key: warehouse, label: warehouse }))]
})

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: PAGE_SIZE,
  total: totalItems.value,
}))

function handlePageChange(page) {
  currentPage.value = page
}

async function fetchSellerInventories() {
  isLoading.value = true
  loadErrorMessage.value = ''

  try {
    const res = await getSellerInventoryList({
      page: currentPage.value - 1,
      size: PAGE_SIZE,
      stockStatus: activeStatus.value === 'all' ? undefined : activeStatus.value,
      warehouseId: activeWarehouse.value === 'all' ? undefined : activeWarehouse.value,
      search: searchKeyword.value || undefined,
    })
    const payload = res.data?.data
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : []

    inventoryRows.value = rows.map((row) => ({ ...row }))
    totalItems.value = Number(payload?.total ?? rows.length)
  } catch (error) {
    console.error('[SellerInventoryListView] fetch error:', error)
    loadErrorMessage.value = '재고 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    inventoryRows.value = []
    totalItems.value = 0
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchSellerInventories)

watch(currentPage, () => {
  void fetchSellerInventories()
})

const selectedInventory = computed(() => {
  return inventoryRows.value.find((row) => row.id === selectedInventoryId.value) ?? null
})

const csvDialogMessage = computed(() => {
  return `${inventoryRows.value.length}건 재고 목록을 CSV로 내보내시겠습니까?`
})

async function handleOpenInventoryDetail(row) {
  try {
    const response = await getSellerInventoryDetail(row.id)
    selectedInventoryDetail.value = normalizeSellerInventoryDetail(response.data?.data ?? {}, row)
    selectedInventoryId.value = row.id
    isDetailModalOpen.value = true
  } catch (error) {
    showToolbarMessage(error.response?.data?.message ?? '재고 상세를 불러오지 못했습니다.')
  }
}

function handleCloseInventoryDetail() {
  isDetailModalOpen.value = false
  selectedInventoryId.value = ''
  selectedInventoryDetail.value = null
}

function showToolbarMessage(message) {
  toolbarMessage.value = message
}

function handleOpenCsvDialog() {
  if (!inventoryRows.value.length) {
    showToolbarMessage('내보낼 재고가 없습니다.')
    return
  }

  isCsvDialogOpen.value = true
}

function handleCloseCsvDialog() {
  isCsvDialogOpen.value = false
}

async function handleConfirmCsv() {
  if (!inventoryRows.value.length) {
    handleCloseCsvDialog()
    showToolbarMessage('내보낼 재고가 없습니다.')
    return
  }

  try {
    await downloadExcel(
      buildSellerInventoryExportRows(inventoryRows.value),
      `seller-inventories-${new Date().toISOString().slice(0, 10)}`,
    )
    showToolbarMessage('현재 필터 기준 재고 목록을 다운로드했습니다.')
    handleCloseCsvDialog()
  } catch (error) {
    console.error('[SellerInventoryListView] export error:', error)
    showToolbarMessage('재고 목록 내보내기에 실패했습니다.')
  }
}
</script>

<template>
  <AppLayout title="재고 목록" :breadcrumb="breadcrumb">
    <section class="seller-inventory-list-page">
      <section class="list-card">
        <div class="toolbar">
          <div class="filter-stack">
            <div class="filter-row">
              <span class="filter-label">상태</span>

              <button
                v-for="option in SELLER_INVENTORY_STATUS_OPTIONS"
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
              <span class="filter-label">창고</span>

              <button
                v-for="option in warehouseOptions"
                :key="option.key"
                type="button"
                class="filter-badge"
                :class="{ 'filter-badge--active': activeWarehouse === option.key }"
                @click="activeWarehouse = option.key"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="toolbar-right">
            <label class="search-box">
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="SKU 또는 상품명 검색"
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
          :columns="SELLER_INVENTORY_LIST_COLUMNS"
          :loading="isLoading"
          :rows="inventoryRows"
          :pagination="pagination"
          row-key="id"
          @page-change="handlePageChange"
        >
          <template #cell-sku="{ row, value }">
            <button class="cell-trigger cell-trigger--text" type="button" @click="handleOpenInventoryDetail(row)">
              <span class="sku-code">{{ value }}</span>
            </button>
          </template>

          <template #cell-productName="{ row, value }">
            <button class="cell-trigger cell-trigger--text" type="button" @click="handleOpenInventoryDetail(row)">
              <span class="product-name">{{ value }}</span>
            </button>
          </template>

          <template #cell-warehouseName="{ value }">
            <span class="warehouse-chip">{{ value }}</span>
          </template>

          <template #cell-availableStock="{ value, row }">
            <span
              class="stock-value"
              :class="{
                'stock-value--low': row.status === 'LOW',
                'stock-value--empty': row.status === 'OUT',
              }"
            >
              {{ value.toLocaleString() }}
            </span>
          </template>

          <template #cell-allocatedStock="{ value }">
            <span class="stock-sub-value">{{ value.toLocaleString() }}</span>
          </template>

          <template #cell-totalStock="{ value }">
            <span class="stock-total">{{ value.toLocaleString() }}</span>
          </template>

          <template #cell-inboundExpected="{ value }">
            <span class="stock-sub-value">{{ value.toLocaleString() }}</span>
          </template>

          <template #cell-warningThreshold="{ value }">
            <span class="stock-sub-value">{{ value.toLocaleString() }}</span>
          </template>

          <template #cell-status="{ row, value }">
            <button class="cell-trigger" type="button" @click="handleOpenInventoryDetail(row)">
              <span
                class="inventory-status-badge"
                :class="`inventory-status-badge--${getSellerInventoryStatusMeta(value).tone}`"
              >
                {{ getSellerInventoryStatusMeta(value).label }}
              </span>
            </button>
          </template>
        </BaseTable>
      </section>
    </section>

    <SellerInventoryDetailModal
      :detail="selectedInventoryDetail"
      :inventory="selectedInventory"
      :isOpen="isDetailModalOpen"
      @cancel="handleCloseInventoryDetail"
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
.seller-inventory-list-page {
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
  flex: 1 1 auto;
  justify-content: flex-end;
  gap: var(--space-2);
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  flex: 1 1 240px;
  min-width: 220px;
  max-width: 280px;
}

.search-box input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t2);
  font-size: var(--font-size-sm);
  outline: none;
  transition:
    border-color var(--ease-fast),
    box-shadow var(--ease-fast);
}

.search-box input:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-pale);
}

.search-box input::placeholder {
  color: var(--t4);
}

.toolbar-btn {
  min-width: 112px;
  padding-inline: 16px;
  flex-shrink: 0;
}

.toolbar-message {
  margin-bottom: var(--space-3);
  color: var(--t3);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.toolbar-message--error {
  color: var(--red);
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

.cell-trigger--text:hover .sku-code,
.cell-trigger--text:hover .product-name {
  color: var(--blue);
}

.sku-code {
  color: var(--t1);
  font-family: var(--font-condensed);
  font-size: var(--font-size-md);
  font-weight: 700;
}

.product-name {
  color: var(--t2);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.warehouse-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--t2);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.stock-value {
  color: var(--t1);
  font-weight: 700;
}

.stock-value--low {
  color: var(--amber);
}

.stock-value--empty {
  color: var(--red);
}

.stock-sub-value {
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.stock-total {
  color: var(--t1);
  font-weight: 600;
}

.inventory-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.inventory-status-badge--green {
  background: var(--green-pale);
  color: var(--green);
}

.inventory-status-badge--amber {
  background: var(--gold-pale);
  color: #92400e;
}

.inventory-status-badge--red {
  background: var(--red-pale);
  color: #7f1d1d;
}

.inventory-status-badge--default {
  background: var(--surface-2);
  color: var(--t3);
}

@media (max-width: 1200px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-right {
    justify-content: flex-start;
  }
}
</style>
