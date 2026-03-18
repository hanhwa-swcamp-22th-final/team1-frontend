<script setup>
/**
 * 셀러 ASN 목록 화면.
 * 로컬 mock 데이터를 기준으로 KPI, 상태 필터, 검색, 테이블 UI를 먼저 구성한다.
 */
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { ASN_STATUS, ROUTE_NAMES } from '@/constants'
import {
  filterSellerAsnRows,
  getSellerAsnKpi,
  SELLER_ASN_LIST_COLUMNS,
  SELLER_ASN_LIST_ROWS,
} from './asnList.utils'

/** Header 브레드크럼 표시용 */
const breadcrumb = [{ label: 'Seller' }, { label: 'ASN 목록' }]

// 목록 화면은 상태 탭과 검색어만으로 먼저 필터링한다.
const activeStatus = ref('all')
const searchKeyword = ref('')

// 페이지네이션은 클라이언트 기준으로 단순 처리한다.
const currentPage = ref(1)
const PAGE_SIZE = 6

// 필터가 바뀌면 첫 페이지로 되돌린다.
watch([activeStatus, searchKeyword], () => {
  currentPage.value = 1
})

// 상단 KPI 카드에 필요한 집계를 계산한다.
const kpi = computed(() => getSellerAsnKpi(SELLER_ASN_LIST_ROWS))

// 상태 탭은 KPI 수치를 함께 보여준다.
const statusTabs = computed(() => [
  { key: 'all', label: '전체', count: kpi.value.total },
  { key: ASN_STATUS.SUBMITTED, label: '제출됨', count: kpi.value.submitted },
  { key: ASN_STATUS.RECEIVED, label: '입고완료', count: kpi.value.received },
  { key: ASN_STATUS.CANCELLED, label: '취소', count: kpi.value.cancelled },
])

// 현재 상태 탭과 검색어를 기준으로 목록을 필터링한다.
const filteredRows = computed(() => {
  return filterSellerAsnRows(SELLER_ASN_LIST_ROWS, {
    status: activeStatus.value,
    search: searchKeyword.value,
  })
})

// 테이블은 현재 페이지에 해당하는 구간만 잘라서 보여준다.
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
</script>

<template>
  <AppLayout title="ASN 목록" :breadcrumb="breadcrumb">
    <template #header-action>
      <RouterLink :to="{ name: ROUTE_NAMES.SELLER_ASN_CREATE }" class="ui-btn ui-btn--primary">
        ASN 등록
      </RouterLink>
    </template>

    <section class="seller-asn-list-page">
      <!-- 상단 KPI 카드로 현재 ASN 운영 상태를 먼저 보여준다. -->
      <div class="kpi-grid">
        <article class="kpi-card">
          <span class="kpi-label">전체 ASN</span>
          <strong class="kpi-value">{{ kpi.total }}</strong>
          <span class="kpi-sub">등록된 전체 통보서</span>
        </article>

        <article class="kpi-card">
          <span class="kpi-label">제출됨</span>
          <strong class="kpi-value">{{ kpi.submitted }}</strong>
          <span class="kpi-sub">입고 예정 반영 대기</span>
        </article>

        <article class="kpi-card">
          <span class="kpi-label">입고완료</span>
          <strong class="kpi-value">{{ kpi.received }}</strong>
          <span class="kpi-sub">검수 완료 기준</span>
        </article>

        <article class="kpi-card">
          <span class="kpi-label">취소</span>
          <strong class="kpi-value">{{ kpi.cancelled }}</strong>
          <span class="kpi-sub">운영 메모 확인 필요</span>
        </article>
      </div>

      <section class="list-card">
        <div class="list-head">
          <div>
            <p class="section-eyebrow">Seller ASN Monitor</p>
            <h2 class="section-title">등록한 ASN을 상태별로 확인합니다.</h2>
          </div>

          <label class="search-field">
            <span class="search-label">검색</span>
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="ASN 번호, 창고, 참조 번호, 메모"
            />
          </label>
        </div>

        <!-- 상태 탭으로 제출됨/입고완료/취소 상태를 빠르게 전환한다. -->
        <div class="status-tabs">
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            type="button"
            class="status-tab"
            :class="{ 'status-tab--active': activeStatus === tab.key }"
            @click="activeStatus = tab.key"
          >
            <span>{{ tab.label }}</span>
            <strong>{{ tab.count }}</strong>
          </button>
        </div>

        <BaseTable
          :columns="SELLER_ASN_LIST_COLUMNS"
          :rows="pagedRows"
          :pagination="pagination"
          row-key="id"
          @page-change="handlePageChange"
        >
          <template #cell-skuCount="{ value }">
            {{ value }}종
          </template>

          <template #cell-totalQuantity="{ value }">
            {{ value.toLocaleString() }}
          </template>

          <template #cell-status="{ value }">
            <StatusBadge :status="value" type="asn" />
          </template>
        </BaseTable>
      </section>
    </section>
  </AppLayout>
</template>

<style scoped>
.seller-asn-list-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.kpi-card,
.list-card {
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.kpi-label {
  color: var(--t3);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.kpi-value {
  color: var(--t1);
  font-family: var(--font-condensed);
  font-size: var(--font-size-2xl);
}

.kpi-sub {
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.list-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-end;
  margin-bottom: var(--space-5);
}

.section-eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--blue);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-title {
  margin: 0;
  color: var(--t1);
  font-size: var(--font-size-xl);
}

.search-field {
  min-width: min(100%, 320px);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.search-label {
  color: var(--t3);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.search-field input {
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

.search-field input:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-pale);
}

.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.status-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--t2);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color var(--ease-fast),
    background var(--ease-fast),
    color var(--ease-fast);
}

.status-tab--active {
  border-color: var(--blue);
  background: var(--blue-pale);
  color: var(--blue);
}

@media (max-width: 1080px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .list-head {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 720px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .kpi-card,
  .list-card {
    padding: var(--space-5);
  }
}
</style>
