<script setup>
/**
 * OrderList — 총괄관리자 주문 목록 (출고 주문 현황) 페이지
 *
 * 레이아웃:
 *   상태 필터 탭 + 검색 + 창고/채널/셀러사 셀렉트
 *   BaseTable (클라이언트 사이드 필터링 + 페이지네이션)
 *
 * 데이터 흐름:
 *   onMounted → getOrderList() → allOrders
 *   탭/검색/셀렉트 변경 → filteredOrders(computed) → paginatedOrders(computed) → BaseTable
 */
import { ref, computed, onMounted, watch } from 'vue'
import { getOrderList } from '@/api/order'
import { ORDER_STATUS } from '@/constants'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

// ── 브레드크럼 ────────────────────────────────────────────────────────────────
const breadcrumb = [{ label: '입출고' }, { label: '주문 목록' }]

// ── BaseTable 컬럼 정의 ───────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'id',        label: '주문번호',    width: '190px' },
  { key: 'channel',   label: '채널',        width: '100px' },
  { key: 'company',   label: '셀러사',      width: '140px' },
  { key: 'warehouse', label: '창고',        width: '210px' },
  { key: 'sku',       label: 'SKU / 수량', width: '130px' },
  { key: 'destState', label: '배송지(주)',  width: '90px',  align: 'center' },
  { key: 'orderedAt', label: '주문일',      width: '130px' },
  { key: 'status',    label: '상태',        width: '120px' },
]

// ── 탭 정의 — color는 활성 시 StatusBadge 색상과 동일하게 적용 ──────────────
const TABS = [
  { key: 'ALL',                       label: '전체',      color: null                                                        },
  { key: ORDER_STATUS.PENDING,        label: '접수',      color: { bg: 'var(--amber-pale)',  border: 'var(--amber)',  text: '#b45309'      } },
  { key: ORDER_STATUS.CONFIRMED,      label: '확인',      color: { bg: 'var(--blue-pale)',   border: 'var(--blue)',   text: 'var(--blue)'  } },
  { key: ORDER_STATUS.PREPARING_ITEM, label: '물품준비중', color: { bg: 'var(--purple-pale)', border: 'var(--purple)', text: 'var(--purple)' } },
  { key: ORDER_STATUS.SHIPPED,        label: '출고완료',  color: { bg: 'var(--green-pale)',  border: 'var(--green)',  text: 'var(--green)' } },
  { key: ORDER_STATUS.CANCELLED,      label: '취소',      color: { bg: 'var(--red-pale)',    border: 'var(--red)',    text: 'var(--red)'   } },
]

// ── 채널 배지 매핑 ────────────────────────────────────────────────────────────
const CHANNEL_MAP = {
  AMAZON: { label: 'Amazon', cls: 'ch-amazon' },
  MANUAL: { label: '수동',   cls: 'ch-manual' },
  EXCEL:  { label: '엑셀',   cls: 'ch-excel'  },
}

// ── 상태 ─────────────────────────────────────────────────────────────────────
const allOrders = ref([])
const isLoading = ref(false)
const activeTab = ref('ALL')
const searchQ   = ref('')
const filterWh  = ref('')
const filterCh  = ref('')
const filterCo  = ref('')
const page      = ref(1)
const PAGE_SIZE = 10

// ── 동적 셀렉트 옵션 (API 데이터에서 추출) ───────────────────────────────────
const warehouseOptions = computed(() => [...new Set(allOrders.value.map(o => o.warehouse))])
const companyOptions   = computed(() => [...new Set(allOrders.value.map(o => o.company))])

// ── 탭 카운트 배지 ────────────────────────────────────────────────────────────
const TAB_COUNT = computed(() => {
  const base = { ALL: allOrders.value.length }
  for (const tab of TABS) {
    if (tab.key !== 'ALL') {
      base[tab.key] = allOrders.value.filter(o => o.status === tab.key).length
    }
  }
  return base
})

// ── 활성 탭 인라인 스타일 계산 ───────────────────────────────────────────────
function tabActiveStyle(tab) {
  if (activeTab.value !== tab.key) return {}
  if (!tab.color) {
    // ALL 탭: gold (기존 디자인)
    return { background: 'rgba(245,166,35,0.12)', borderColor: 'var(--gold)', color: 'var(--gold)' }
  }
  return { background: tab.color.bg, borderColor: tab.color.border, color: tab.color.text }
}

function tabCountStyle(tab) {
  if (activeTab.value !== tab.key) return {}
  if (!tab.color) return { background: 'var(--gold)', color: '#fff' }
  return { background: tab.color.border, color: '#fff' }
}

// ── 클라이언트 사이드 필터링 ─────────────────────────────────────────────────
const filteredOrders = computed(() => {
  return allOrders.value
    .filter(o => activeTab.value === 'ALL' || o.status === activeTab.value)
    .filter(o => !filterWh.value || o.warehouse === filterWh.value)
    .filter(o => !filterCh.value || o.channel === filterCh.value)
    .filter(o => !filterCo.value || o.company === filterCo.value)
    .filter(o => {
      if (!searchQ.value) return true
      const q = searchQ.value.toLowerCase()
      return o.id.toLowerCase().includes(q) || o.company.toLowerCase().includes(q)
    })
})

// ── 클라이언트 사이드 페이지네이션 ───────────────────────────────────────────
const paginatedOrders = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredOrders.value.slice(start, start + PAGE_SIZE)
})
const pagination = computed(() => ({
  page: page.value,
  pageSize: PAGE_SIZE,
  total: filteredOrders.value.length,
}))

// 필터 변경 시 1페이지로 리셋
watch([activeTab, searchQ, filterWh, filterCh, filterCo], () => { page.value = 1 })

// ── 데이터 로드 ───────────────────────────────────────────────────────────────
async function fetchAll() {
  isLoading.value = true
  try {
    const res = await getOrderList()
    allOrders.value = res.data.data
  } catch (e) {
    console.error('[OrderList] fetch error:', e)
  } finally {
    isLoading.value = false
  }
}
onMounted(fetchAll)

// ── 채널 배지 헬퍼 ────────────────────────────────────────────────────────────
function channelInfo(channel) {
  return CHANNEL_MAP[channel] ?? { label: channel, cls: 'ch-manual' }
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="주문 목록">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost btn-refresh" @click="fetchAll">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <path d="M12.5 2.5A6 6 0 1 1 9 1.2"/>
          <path d="M9 1v3h3"/>
        </svg>
        새로고침
      </button>
    </template>

    <!-- ── 툴바 ── -->
    <div class="toolbar">
      <!-- 상태 필터 탭 -->
      <div class="filter-tabs">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          class="filter-tab"
          :class="{ active: activeTab === tab.key }"
          :style="tabActiveStyle(tab)"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span class="filter-count" :style="tabCountStyle(tab)">{{ TAB_COUNT[tab.key] ?? 0 }}</span>
        </button>
      </div>

      <!-- 검색 + 셀렉트 필터 -->
      <div class="toolbar-right">
        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#B0B8CC" stroke-width="1.6">
            <circle cx="6" cy="6" r="4.5"/>
            <path d="M10 10l2.5 2.5" stroke-linecap="round"/>
          </svg>
          <input
            v-model="searchQ"
            class="search-input"
            type="text"
            placeholder="주문번호, 셀러사 검색"
          />
        </div>
        <select v-model="filterWh" class="select-filter">
          <option value="">전체 창고</option>
          <option v-for="wh in warehouseOptions" :key="wh" :value="wh">{{ wh }}</option>
        </select>
        <select v-model="filterCh" class="select-filter">
          <option value="">전체 채널</option>
          <option value="AMAZON">Amazon FBM</option>
          <option value="MANUAL">수동 입력</option>
          <option value="EXCEL">엑셀 업로드</option>
        </select>
        <select v-model="filterCo" class="select-filter">
          <option value="">셀러사 전체</option>
          <option v-for="co in companyOptions" :key="co" :value="co">{{ co }}</option>
        </select>
      </div>
    </div>

    <!-- ── 데이터 테이블 ── -->
    <BaseTable
      :columns="COLUMNS"
      :rows="paginatedOrders"
      :loading="isLoading"
      :pagination="pagination"
      row-key="id"
      @page-change="page = $event"
    >
      <!-- 주문번호: 파란색 모노 스타일 -->
      <template #cell-id="{ value }">
        <span class="order-num">{{ value }}</span>
      </template>

      <!-- 채널 배지 -->
      <template #cell-channel="{ value }">
        <span :class="['channel-badge', channelInfo(value).cls]">{{ channelInfo(value).label }}</span>
      </template>

      <!-- SKU / 수량 -->
      <template #cell-sku="{ row }">
        <span class="cell-bold">{{ row.skuCount }} SKU / {{ row.qty }} EA</span>
      </template>

      <!-- 배송지(주): Inter 12px -->
      <template #cell-destState="{ value }">
        <span class="cell-state">{{ value }}</span>
      </template>

      <!-- 주문일: 연하게 -->
      <template #cell-orderedAt="{ value }">
        <span class="date-normal">{{ value }}</span>
      </template>

      <!-- 상태 배지: StatusBadge 재사용 -->
      <template #cell-status="{ value }">
        <StatusBadge :status="value" type="order" />
      </template>
    </BaseTable>
  </AppLayout>
</template>

<style scoped>
/* ── 툴바 ─────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-family: 'Barlow', sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: var(--t2);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--ease-fast), border-color var(--ease-fast), color var(--ease-fast);
}

.filter-tab.active {
  font-weight: 700;
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  margin-left: 6px;
  background: var(--border);
  border-radius: 9px;
  font-size: 10px;
  font-weight: 700;
  color: var(--t2);
  transition: background var(--ease-fast), color var(--ease-fast);
}

/* ── 툴바 오른쪽 ──────────────────────────────────────────────── */
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  width: 220px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  transition: border-color var(--ease-fast);
}

.search-box:focus-within {
  border-color: var(--blue);
}

.search-input {
  border: none;
  outline: none;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--t1);
  background: transparent;
  flex: 1;
}

.search-input::placeholder {
  color: var(--t4);
}

.select-filter {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  color: var(--t2);
  outline: none;
  cursor: pointer;
  transition: border-color var(--ease-fast);
}

.select-filter:focus {
  border-color: var(--blue);
}

/* ── 헤더 액션 버튼 ─────────────────────────────────────────── */
.btn-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

/* ── 셀 커스텀 스타일 ───────────────────────────────────────── */
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

.ch-amazon { background: #FFF3E0; color: #E65100; }
.ch-manual { background: var(--border); color: var(--t3); }
.ch-excel  { background: var(--green-pale); color: var(--green); }

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

.date-normal {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--t3);
  white-space: nowrap;
}
</style>
