<script setup>
/**
 * 셀러 상품 목록 화면.
 * Pigma 상품 목록 시안을 기준으로 상태/카테고리 필터와 테이블 UI를 로컬 mock 데이터로 먼저 구성한다.
 */
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { ROUTE_NAMES } from '@/constants'
import {
  filterSellerProductRows,
  getSellerProductStatusMeta,
  SELLER_PRODUCT_CATEGORY_OPTIONS,
  SELLER_PRODUCT_LIST_COLUMNS,
  SELLER_PRODUCT_LIST_ROWS,
  SELLER_PRODUCT_STATUS_OPTIONS,
} from '@/utils/productList.utils.js'

const breadcrumb = [{ label: 'Seller' }, { label: '상품 목록' }]

// 상품 목록은 상태, 카테고리, 검색어 조합으로 먼저 필터링한다.
const activeStatus = ref('all')
const activeCategory = ref('all')
const searchKeyword = ref('')
const toolbarMessage = ref('')

// 페이지네이션은 로컬 mock 기준으로 단순 처리한다.
const currentPage = ref(1)
const PAGE_SIZE = 8

// 필터가 바뀌면 첫 페이지로 되돌린다.
watch([activeStatus, activeCategory, searchKeyword], () => {
  currentPage.value = 1
})

// 현재 상태와 카테고리, 검색어를 기준으로 상품 목록을 필터링한다.
const filteredRows = computed(() => {
  return filterSellerProductRows(SELLER_PRODUCT_LIST_ROWS, {
    status: activeStatus.value,
    category: activeCategory.value,
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

// UI 범위만 구현하므로 CSV, 수정, 비활성은 안내 메시지로 처리한다.
function showToolbarMessage(message) {
  toolbarMessage.value = message
}
</script>

<template>
  <AppLayout title="상품 목록" :breadcrumb="breadcrumb">
    <template #header-action>
      <RouterLink :to="{ name: ROUTE_NAMES.SELLER_PRODUCT_REGISTER }" class="ui-btn ui-btn--primary">
        상품 등록
      </RouterLink>
    </template>

    <section class="seller-product-list-page">
      <section class="list-card">
        <div class="toolbar">
          <div class="filter-stack">
            <div class="filter-row">
              <span class="filter-label">상태</span>

              <button
                v-for="option in SELLER_PRODUCT_STATUS_OPTIONS"
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
              <span class="filter-label">카테고리</span>

              <button
                v-for="option in SELLER_PRODUCT_CATEGORY_OPTIONS"
                :key="option.key"
                type="button"
                class="filter-badge"
                :class="{ 'filter-badge--active': activeCategory === option.key }"
                @click="activeCategory = option.key"
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

            <!-- TODO(frontend): 상품 목록 CSV 내보내기 기능을 연결한다. -->
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
          :columns="SELLER_PRODUCT_LIST_COLUMNS"
          :rows="pagedRows"
          :pagination="pagination"
          row-key="id"
          @page-change="handlePageChange"
        >
          <template #cell-image="{ row }">
            <div class="image-thumb" :title="row.productName">
              <span>{{ row.sku.slice(0, 2) }}</span>
            </div>
          </template>

          <template #cell-sku="{ value }">
            <span class="sku-code">{{ value }}</span>
          </template>

          <template #cell-warehouseName="{ value }">
            <span class="warehouse-chip">{{ value }}</span>
          </template>

          <template #cell-salePrice="{ value }">
            <span class="price-value">${{ value.toFixed(2) }}</span>
          </template>

          <template #cell-costPrice="{ value }">
            <span class="price-value">${{ value.toFixed(2) }}</span>
          </template>

          <template #cell-stock="{ row }">
            <span
              class="stock-available"
              :class="{
                'stock-available--low': row.status === 'LOW_STOCK',
                'stock-available--empty': row.status === 'OUT_OF_STOCK',
              }"
            >
              {{ row.availableStock }}
            </span>
            <span class="stock-divider">/</span>
            <span class="stock-allocated">{{ row.allocatedStock }}</span>
          </template>

          <template #cell-status="{ value }">
            <span
              class="product-status-badge"
              :class="`product-status-badge--${getSellerProductStatusMeta(value).tone}`"
            >
              {{ getSellerProductStatusMeta(value).label }}
            </span>
          </template>

          <template #cell-actions="{ row }">
            <!-- TODO(frontend): 상품 수정과 비활성/재활성 동작을 연결한다. -->
            <div class="action-group">
              <button
                class="action-btn action-btn--edit"
                type="button"
                @click="showToolbarMessage(`${row.sku} 수정 UI는 다음 단계에서 연결합니다.`)"
              >
                수정
              </button>

              <button
                v-if="row.status !== 'INACTIVE'"
                class="action-btn action-btn--danger"
                type="button"
                @click="showToolbarMessage(`${row.sku} 비활성 UI는 다음 단계에서 연결합니다.`)"
              >
                비활성
              </button>

              <button
                v-else
                class="action-btn action-btn--success"
                type="button"
                @click="showToolbarMessage(`${row.sku} 재활성 UI는 다음 단계에서 연결합니다.`)"
              >
                재활성
              </button>
            </div>
          </template>
        </BaseTable>
      </section>
    </section>
  </AppLayout>
</template>

<style scoped>
.seller-product-list-page {
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

.image-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: 0 auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-weight: 700;
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

.price-value {
  color: var(--t1);
  font-weight: 600;
}

.stock-available {
  color: var(--t1);
  font-weight: 700;
}

.stock-available--low {
  color: var(--amber);
}

.stock-available--empty {
  color: var(--red);
}

.stock-divider,
.stock-allocated {
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.product-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.product-status-badge--green {
  background: var(--green-pale);
  color: var(--green);
}

.product-status-badge--amber {
  background: var(--gold-pale);
  color: #92400e;
}

.product-status-badge--red {
  background: var(--red-pale);
  color: #7f1d1d;
}

.product-status-badge--blue {
  background: var(--blue-pale);
  color: #3730a3;
}

.action-group {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
}

.action-btn--edit {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--t2);
}

.action-btn--danger {
  border: 1px solid #fca5a5;
  background: var(--red-pale);
  color: #991b1b;
}

.action-btn--success {
  border: 1px solid #86efac;
  background: var(--green-pale);
  color: #166534;
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
