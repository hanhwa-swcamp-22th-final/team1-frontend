<script setup>
/**
 * SellerReceivablesView — 총괄관리자 셀러별 미수금 현황
 *
 * 레이아웃:
 *   상단 stat cards (총 미수금 / 연체 건수 / 정상 건수)
 *   탭 필터 (전체 / 연체 / 정상) + BaseTable
 *
 * 데이터: /members/sellers/receivables
 */
import { ref, computed, onMounted, watch } from 'vue'
import { getSellerReceivables } from '@/api/member'
import { formatNumber } from '@/utils/format'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'

const breadcrumb = [{ label: '셀러 관리' }, { label: '셀러별 미수금' }]

const COLUMNS = [
  { key: 'sellerName',  label: '셀러명' },
  { key: 'totalBilled', label: '총 청구액', align: 'right',  width: '140px' },
  { key: 'paid',        label: '수납액',    align: 'right',  width: '140px' },
  { key: 'unpaid',      label: '미수금',    align: 'right',  width: '140px' },
  { key: 'daysOverdue', label: '연체일',    align: 'center', width: '90px'  },
]

const TABS = [
  { key: 'ALL',      label: '전체', color: null },
  { key: 'OVERDUE',  label: '연체', color: { bg: 'var(--red-pale)',   border: 'var(--red)',   text: 'var(--red)'  } },
  { key: 'NORMAL',   label: '정상', color: { bg: 'var(--green-pale)', border: 'var(--green)', text: 'var(--green)' } },
]

const allRows   = ref([])
const isLoading = ref(false)
const activeTab = ref('ALL')
const page      = ref(1)
const PAGE_SIZE = 10

const overdueRows = computed(() => allRows.value.filter(r => r.daysOverdue > 0))
const normalRows  = computed(() => allRows.value.filter(r => r.daysOverdue === 0))

const tabCount = computed(() => ({
  ALL:     allRows.value.length,
  OVERDUE: overdueRows.value.length,
  NORMAL:  normalRows.value.length,
}))

const filteredRows = computed(() => {
  if (activeTab.value === 'OVERDUE') return overdueRows.value
  if (activeTab.value === 'NORMAL')  return normalRows.value
  return allRows.value
})

const paginatedRows = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredRows.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({
  page: page.value,
  pageSize: PAGE_SIZE,
  total: filteredRows.value.length,
}))

watch(activeTab, () => { page.value = 1 })

const totalUnpaid    = computed(() => allRows.value.reduce((s, r) => s + r.unpaid, 0))
const overdueCount   = computed(() => overdueRows.value.length)
const normalCount    = computed(() => normalRows.value.length)

async function fetchAll() {
  isLoading.value = true
  try {
    const res = await getSellerReceivables()
    allRows.value = res.data.data
  } catch (e) {
    console.error('[SellerReceivablesView] fetch error:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAll)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb">
    <div class="receivables-page">

      <!-- ── 요약 카드 ─────────────────────────────────────────────────────── -->
      <div class="stat-grid">
        <div class="stat-card">
          <span class="stat-label">총 미수금</span>
          <span class="stat-value">₩{{ formatNumber(totalUnpaid) }}</span>
        </div>
        <div class="stat-card stat-card--red">
          <span class="stat-label">연체</span>
          <span class="stat-value">{{ overdueCount }}<span class="stat-unit">건</span></span>
        </div>
        <div class="stat-card stat-card--green">
          <span class="stat-label">정상</span>
          <span class="stat-value">{{ normalCount }}<span class="stat-unit">건</span></span>
        </div>
      </div>

      <!-- ── 탭 필터 ────────────────────────────────────────────────────────── -->
      <div class="tab-row">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          :style="activeTab === tab.key && tab.color
            ? { background: tab.color.bg, borderColor: tab.color.border, color: tab.color.text }
            : {}"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span class="tab-count">{{ tabCount[tab.key] }}</span>
        </button>
      </div>

      <!-- ── 테이블 ─────────────────────────────────────────────────────────── -->
      <BaseTable
        :columns="COLUMNS"
        :rows="paginatedRows"
        :loading="isLoading"
        :pagination="pagination"
        @page-change="page = $event"
      >
        <template #cell-totalBilled="{ value }">
          ₩{{ formatNumber(value) }}
        </template>

        <template #cell-paid="{ value }">
          ₩{{ formatNumber(value) }}
        </template>

        <template #cell-unpaid="{ value, row }">
          <span :class="{ 'unpaid-alert': row.daysOverdue > 0 }">
            ₩{{ formatNumber(value) }}
          </span>
        </template>

        <template #cell-daysOverdue="{ value }">
          <span v-if="value === 0" class="overdue-none">—</span>
          <span v-else class="overdue-badge">{{ value }}일</span>
        </template>
      </BaseTable>

    </div>
  </AppLayout>
</template>

<style scoped>
.receivables-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6);
}

/* ── 요약 카드 ───────────────────────────────────────────────── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border-top: 3px solid var(--blue);
}
.stat-card--red   { border-top-color: var(--red);   }
.stat-card--green { border-top-color: var(--green);  }

.stat-label {
  font-family: var(--font-barlow);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-family: var(--font-condensed);
  font-size: 28px;
  font-weight: 700;
  color: var(--t1);
  line-height: 1;
}

.stat-unit {
  font-size: var(--font-size-sm);
  font-family: var(--font-barlow);
  color: var(--t3);
  margin-left: 3px;
}

/* ── 탭 ──────────────────────────────────────────────────────── */
.tab-row {
  display: flex;
  gap: var(--space-2);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--t2);
  font-family: var(--font-barlow);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--ease-fast);
}
.tab-btn:hover { border-color: var(--border-dk); color: var(--t1); }
.tab-btn.active { font-weight: 600; }

.tab-count {
  background: var(--surface-2);
  border-radius: 10px;
  padding: 1px 7px;
  font-size: var(--font-size-xs);
  color: var(--t3);
  font-family: var(--font-barlow);
}

/* ── 셀 스타일 ──────────────────────────────────────────────── */
.unpaid-alert {
  color: var(--red);
  font-weight: 600;
}

.overdue-none {
  color: var(--t4);
}

.overdue-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--red-pale);
  color: var(--red);
  font-family: var(--font-barlow);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
</style>
