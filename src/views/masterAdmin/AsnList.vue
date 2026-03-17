<script setup>
/**
 * AsnList — 총괄관리자 ASN(입고 예정 통보서) 목록 페이지
 *
 * 레이아웃:
 *   KPI 요약 카드 4개 (전체 / 제출됨 / 입고완료 / 취소)
 *   상태 필터 탭 + 검색 + 창고/셀러사 셀렉트
 *   BaseTable (클라이언트 사이드 필터링 + 페이지네이션)
 *
 * 데이터 흐름:
 *   onMounted → Promise.all([getAsnList, getAsnKpi]) → allAsns / kpi
 *   탭/검색/셀렉트 변경 → filteredAsns(computed) → paginatedAsns(computed) → BaseTable
 */
import { ref, computed, onMounted, watch } from 'vue'
import { getAsnList, getAsnKpi } from '@/api/wms'
import { ASN_STATUS } from '@/constants'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

// ── 브레드크럼 ────────────────────────────────────────────────────────────────
const breadcrumb = [{ label: '입출고' }, { label: 'ASN 목록' }]

// ── BaseTable 컬럼 정의 ───────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'id',             label: 'ASN 번호',   width: '185px' },
  { key: 'company',        label: '셀러사',      width: '130px' },
  { key: 'warehouse',      label: '창고',        width: '210px' },
  { key: 'skuCount',       label: 'SKU 수',     width: '80px',  align: 'center' },
  { key: 'plannedQty',     label: '예정 수량',   width: '100px', align: 'right'  },
  { key: 'expectedDate',   label: '예정 입고일', width: '120px' },
  { key: 'registeredDate', label: '등록일',      width: '110px' },
  { key: 'status',         label: '상태',        width: '120px' },
]

// ── 탭 정의 (ASN_STATUS 상수 참조) ────────────────────────────────────────────
const TABS = [
  { key: 'ALL',                label: '전체'   },
  { key: ASN_STATUS.SUBMITTED, label: '제출됨'  },
  { key: ASN_STATUS.RECEIVED,  label: '입고완료' },
  { key: ASN_STATUS.CANCELLED, label: '취소'   },
]

// ── 상태 ─────────────────────────────────────────────────────────────────────
const kpi       = ref({ total: 0, submitted: 0, received: 0, cancelled: 0 })
const allAsns   = ref([])
const isLoading = ref(false)
const activeTab = ref('ALL')
const searchQ   = ref('')
const filterWh  = ref('')
const filterCo  = ref('')
const page      = ref(1)
const PAGE_SIZE = 10

// ── 동적 셀렉트 옵션 (API 데이터에서 추출) ───────────────────────────────────
const warehouseOptions = computed(() => [...new Set(allAsns.value.map(a => a.warehouse))])
const companyOptions   = computed(() => [...new Set(allAsns.value.map(a => a.company))])

// ── 탭 카운트 배지 ────────────────────────────────────────────────────────────
const TAB_COUNT = computed(() => ({
  ALL:                     allAsns.value.length,
  [ASN_STATUS.SUBMITTED]:  kpi.value.submitted,
  [ASN_STATUS.RECEIVED]:   kpi.value.received,
  [ASN_STATUS.CANCELLED]:  kpi.value.cancelled,
}))

// ── 클라이언트 사이드 필터링 ─────────────────────────────────────────────────
const filteredAsns = computed(() => {
  return allAsns.value
    .filter(a => activeTab.value === 'ALL' || a.status === activeTab.value)
    .filter(a => !filterWh.value || a.warehouse === filterWh.value)
    .filter(a => !filterCo.value || a.company === filterCo.value)
    .filter(a => {
      if (!searchQ.value) return true
      const q = searchQ.value.toLowerCase()
      return a.id.toLowerCase().includes(q) || a.company.toLowerCase().includes(q)
    })
})

// ── 클라이언트 사이드 페이지네이션 ───────────────────────────────────────────
const paginatedAsns = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredAsns.value.slice(start, start + PAGE_SIZE)
})
const pagination = computed(() => ({
  page: page.value,
  pageSize: PAGE_SIZE,
  total: filteredAsns.value.length,
}))

// 필터 변경 시 1페이지로 리셋
watch([activeTab, searchQ, filterWh, filterCo], () => { page.value = 1 })

// ── 데이터 로드 ───────────────────────────────────────────────────────────────
async function fetchAll() {
  isLoading.value = true
  try {
    const [listRes, kpiRes] = await Promise.all([getAsnList(), getAsnKpi()])
    allAsns.value = listRes.data.data
    kpi.value     = kpiRes.data.data
  } catch (e) {
    console.error('[AsnList] fetch error:', e)
  } finally {
    isLoading.value = false
  }
}
onMounted(fetchAll)

// ── 유틸 ─────────────────────────────────────────────────────────────────────
/** 예정 입고일이 오늘(2026-03-17) 이후면 true → 골드 강조 */
function isUpcoming(date) { return date >= '2026-03-17' }

/** KPI 카드 value 색상 클래스 */
function kpiValueClass(key) {
  if (key === 'submitted')  return 'kpi-value--blue'
  if (key === 'cancelled')  return 'kpi-value--red'
  if (key === 'received')   return 'kpi-value--green'
  return ''
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="ASN 목록">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost btn-refresh" @click="fetchAll">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <path d="M12.5 2.5A6 6 0 1 1 9 1.2"/>
          <path d="M9 1v3h3"/>
        </svg>
        새로고침
      </button>
    </template>

    <!-- ── KPI 요약 카드 ── -->
    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">전체 ASN</span>
        <span class="kpi-value">{{ kpi.total }}</span>
        <span class="kpi-sub">이번 달 누적</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">제출됨</span>
        <span class="kpi-value kpi-value--blue">{{ kpi.submitted }}</span>
        <span class="kpi-sub">창고 접수 대기 중</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">입고완료</span>
        <span class="kpi-value kpi-value--green">{{ kpi.received }}</span>
        <span class="kpi-sub">재고로 전환됨</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">취소</span>
        <span class="kpi-value kpi-value--red">{{ kpi.cancelled }}</span>
        <span class="kpi-sub">처리 취소된 ASN</span>
      </div>
    </div>

    <!-- ── 툴바 ── -->
    <div class="toolbar">
      <!-- 상태 필터 탭 -->
      <div class="filter-tabs">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          :class="['filter-tab', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span class="filter-count">{{ TAB_COUNT[tab.key] ?? 0 }}</span>
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
            placeholder="ASN번호, 셀러사 검색"
          />
        </div>
        <select v-model="filterWh" class="select-filter">
          <option value="">전체 창고</option>
          <option v-for="wh in warehouseOptions" :key="wh" :value="wh">{{ wh }}</option>
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
      :rows="paginatedAsns"
      :loading="isLoading"
      :pagination="pagination"
      row-key="id"
      @page-change="page = $event"
    >
      <!-- ASN 번호: 파란색 모노 스타일 -->
      <template #cell-id="{ value }">
        <span class="asn-num">{{ value }}</span>
      </template>

      <!-- SKU 수: 굵은 폰트 + 단위 -->
      <template #cell-skuCount="{ value }">
        <span class="cell-bold">{{ value }} SKU</span>
      </template>

      <!-- 예정 수량: 굵은 폰트 + 단위 -->
      <template #cell-plannedQty="{ value }">
        <span class="cell-bold">{{ value.toLocaleString() }} EA</span>
      </template>

      <!-- 예정 입고일: 오늘 이후 → 골드 강조 -->
      <template #cell-expectedDate="{ value }">
        <span :class="isUpcoming(value) ? 'date-upcoming' : 'date-normal'">{{ value }}</span>
      </template>

      <!-- 등록일: 연하게 -->
      <template #cell-registeredDate="{ value }">
        <span class="date-normal">{{ value }}</span>
      </template>

      <!-- 상태 배지: StatusBadge 컴포넌트 재사용 -->
      <template #cell-status="{ value }">
        <StatusBadge :status="value" type="asn" />
      </template>
    </BaseTable>
  </AppLayout>
</template>

<style scoped>
/* ── KPI 카드 ────────────────────────────────────────────────────── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kpi-label {
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--t3);
}

.kpi-value {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 38px;
  color: var(--t1);
  line-height: 1;
}

.kpi-value--blue  { color: var(--blue); }
.kpi-value--green { color: var(--green); }
.kpi-value--red   { color: var(--red); }

.kpi-sub {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--t3);
}

/* ── 툴바 ─────────────────────────────────────────────────────────── */
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
}

.filter-tab.active {
  background: rgba(245, 166, 35, 0.12);
  border-color: var(--gold);
  color: var(--gold);
  font-weight: 700;
}

.filter-tab.active .filter-count {
  background: var(--gold);
  color: #fff;
}

/* ── 툴바 오른쪽 ──────────────────────────────────────────────────── */
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
  width: 260px;
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

/* ── 헤더 액션 버튼 ─────────────────────────────────────────────── */
.btn-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

/* ── 셀 커스텀 스타일 (BaseTable 내 td 요소) ───────────────────── */
.asn-num {
  font-family: 'IBM Plex Sans', monospace;
  font-weight: 500;
  font-size: 13px;
  color: var(--blue);
  white-space: nowrap;
}

.cell-bold {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  white-space: nowrap;
}

.date-upcoming {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--gold);
  font-weight: 600;
  white-space: nowrap;
}

.date-normal {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--t3);
  white-space: nowrap;
}
</style>
