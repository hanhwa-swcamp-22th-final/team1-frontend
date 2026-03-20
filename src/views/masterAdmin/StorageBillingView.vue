<script setup>
/**
 * StorageBillingView — 총괄관리자 보관료 청구 현황
 *
 * 레이아웃:
 *   상단 stat cards (총 청구액 / PENDING 건수 / BILLED 건수)
 *   상태 탭 필터 + BaseTable
 *
 * 데이터: /wms/storage-billing
 */
import { ref, computed, onMounted, watch } from 'vue'
import { getStorageBilling } from '@/api/wms'
import { formatNumber } from '@/utils/format'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const breadcrumb = [{ label: '요금 설정' }, { label: '보관료 청구 현황' }]

const COLUMNS = [
  { key: 'billingMonth',  label: '청구월',    width: '100px' },
  { key: 'warehouseName', label: '창고명' },
  { key: 'storageQty',    label: '재고(SKU)', align: 'right',  width: '100px' },
  { key: 'locationUtil',  label: '사용률',    align: 'center', width: '140px' },
  { key: 'unitRate',      label: '단가(₩/SKU)', align: 'right', width: '110px' },
  { key: 'amount',        label: '청구액',    align: 'right',  width: '130px' },
  { key: 'status',        label: '상태',      align: 'center', width: '110px' },
]

const TABS = [
  { key: 'ALL',     label: '전체',     color: null },
  { key: 'PENDING', label: '청구 대기', color: { bg: 'var(--amber-pale)', border: 'var(--amber)', text: '#b45309' } },
  { key: 'BILLED',  label: '청구 완료', color: { bg: 'var(--green-pale)', border: 'var(--green)', text: 'var(--green)' } },
]

const allRows  = ref([])
const isLoading = ref(false)
const activeTab = ref('ALL')
const page      = ref(1)
const PAGE_SIZE = 10

const tabCount = computed(() => {
  const base = { ALL: allRows.value.length }
  for (const t of TABS) {
    if (t.key !== 'ALL') base[t.key] = allRows.value.filter(r => r.status === t.key).length
  }
  return base
})

const filteredRows = computed(() =>
  activeTab.value === 'ALL'
    ? allRows.value
    : allRows.value.filter(r => r.status === activeTab.value)
)

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

// ── 요약 수치 ──────────────────────────────────────────────────────────────────
const totalAmount  = computed(() => allRows.value.reduce((s, r) => s + r.amount, 0))
const pendingCount = computed(() => allRows.value.filter(r => r.status === 'PENDING').length)
const billedCount  = computed(() => allRows.value.filter(r => r.status === 'BILLED').length)

async function fetchAll() {
  isLoading.value = true
  try {
    const res = await getStorageBilling()
    allRows.value = res.data.data
  } catch (e) {
    console.error('[StorageBillingView] fetch error:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAll)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb">
    <div class="billing-page">

      <!-- ── 요약 카드 ─────────────────────────────────────────────────────── -->
      <div class="stat-grid">
        <div class="stat-card">
          <span class="stat-label">총 청구액</span>
          <span class="stat-value">₩{{ formatNumber(totalAmount) }}</span>
        </div>
        <div class="stat-card stat-card--amber">
          <span class="stat-label">청구 대기</span>
          <span class="stat-value">{{ pendingCount }}<span class="stat-unit">건</span></span>
        </div>
        <div class="stat-card stat-card--green">
          <span class="stat-label">청구 완료</span>
          <span class="stat-value">{{ billedCount }}<span class="stat-unit">건</span></span>
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
        <template #cell-locationUtil="{ value }">
          <div class="util-wrap">
            <div class="util-bar">
              <div
                class="util-fill"
                :style="{ width: value + '%', background: value >= 70 ? 'var(--red)' : value >= 50 ? 'var(--amber)' : 'var(--green)' }"
              />
            </div>
            <span class="util-text">{{ value }}%</span>
          </div>
        </template>

        <template #cell-amount="{ value }">
          ₩{{ formatNumber(value) }}
        </template>

        <template #cell-storageQty="{ value }">
          {{ formatNumber(value) }}
        </template>

        <template #cell-unitRate="{ value }">
          ₩{{ formatNumber(value) }}
        </template>

        <template #cell-status="{ value }">
          <StatusBadge :status="value" type="billing" />
        </template>
      </BaseTable>

    </div>
  </AppLayout>
</template>

<style scoped>
.billing-page {
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
.stat-card--amber { border-top-color: var(--amber); }
.stat-card--green  { border-top-color: var(--green); }

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

/* ── 사용률 바 ──────────────────────────────────────────────── */
.util-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.util-bar {
  flex: 1;
  height: 6px;
  background: var(--surface-2);
  border-radius: 3px;
  overflow: hidden;
}
.util-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s var(--ease-fast);
}
.util-text {
  font-family: var(--font-barlow);
  font-size: var(--font-size-xs);
  color: var(--t2);
  min-width: 32px;
  text-align: right;
}
</style>
