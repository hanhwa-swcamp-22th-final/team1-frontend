<script setup>
/**
 * 셀러 재고 목록 화면.
 * Pigma 재고 목록 시안을 기준으로 상태/창고 필터와 테이블 UI를 로컬 mock 데이터로 먼저 구성한다.
 */
import { computed, ref, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import {
  filterSellerInventoryRows,
  getSellerInventoryStatusMeta,
  SELLER_INVENTORY_LIST_COLUMNS,
  SELLER_INVENTORY_LIST_ROWS,
  SELLER_INVENTORY_STATUS_OPTIONS,
  SELLER_INVENTORY_WAREHOUSE_OPTIONS,
} from '@/utils/inventoryList.utils.js'

const breadcrumb = [{ label: 'Seller' }, { label: '재고 목록' }]

// 목록 화면은 상태, 창고, 검색어 조합으로 먼저 필터링한다.
const activeStatus = ref('all')
const activeWarehouse = ref('all')
const searchKeyword = ref('')
const toolbarMessage = ref('')

// 페이지네이션은 로컬 mock 기준으로 단순 처리한다.
const currentPage = ref(1)
const PAGE_SIZE = 10

// 필터가 바뀌면 첫 페이지로 되돌린다.
watch([activeStatus, activeWarehouse, searchKeyword], () => {
  currentPage.value = 1
})

// 현재 상태와 창고, 검색어를 기준으로 재고 목록을 필터링한다.
const filteredRows = computed(() => {
  return filterSellerInventoryRows(SELLER_INVENTORY_LIST_ROWS, {
    status: activeStatus.value,
    warehouse: activeWarehouse.value,
    search: searchKeyword.value,
  })
})

// 현재 페이지에 해당하는 구간만 잘라서 테이블에 전달한다.
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredRows.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: PAGE_SIZE,
  total: filteredRows.value.length,
}))

function handlePageChange(page) {
  currentPage.value = page
}

// UI 범위만 구현하므로 CSV와 상세 모달은 안내 메시지로 처리한다.
function showToolbarMessage(message) {
  toolbarMessage.value = message
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
                v-for="option in SELLER_INVENTORY_WAREHOUSE_OPTIONS"
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

            <!-- TODO(frontend): 재고 목록 CSV 내보내기 기능을 연결한다. -->
            <button
              class="ui-btn ui-btn--ghost toolbar-btn"
              type="button"
              @click="showToolbarMessage('CSV 내보내기 UI는 다음 단계에서 연결합니다.')"
            >
              CSV 내보내기
            </button>
          </div>
        </div>

        <p v-if="toolbarMessage" class="toolbar-message">{{ toolbarMessage }}</p>

        <BaseTable
          :columns="SELLER_INVENTORY_LIST_COLUMNS"
          :rows="pagedRows"
          :pagination="pagination"
          row-key="id"
          @page-change="handlePageChange"
        >
          <template #cell-sku="{ value }">
            <span class="sku-code">{{ value }}</span>
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

          <template #cell-status="{ value }">
            <!-- TODO(frontend): 재고 상세 모달 또는 상세 화면을 연결한다. -->
            <span
              class="inventory-status-badge"
              :class="`inventory-status-badge--${getSellerInventoryStatusMeta(value).tone}`"
            >
              {{ getSellerInventoryStatusMeta(value).label }}
            </span>
          </template>
        </BaseTable>
      </section>
    </section>
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

.sku-code {
  color: var(--t1);
  font-family: var(--font-condensed);
  font-size: var(--font-size-md);
  font-weight: 700;
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
