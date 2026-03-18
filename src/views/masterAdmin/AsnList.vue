<script setup>
/**
 * AsnList — 총괄관리자 ASN(입고 예정 통보서) 목록 페이지
 *
 * 레이아웃:
 *   상태 필터 탭 + 검색 + 창고/셀러사 셀렉트
 *   BaseTable (클라이언트 사이드 필터링 + 페이지네이션)
 *
 * 데이터 흐름:
 *   onMounted → getAsnList() → allAsns
 *   탭/검색/셀렉트 변경 → filteredAsns(computed) → paginatedAsns(computed) → BaseTable
 */
import { ref, computed, onMounted, watch } from 'vue'
import { getAsnList } from '@/api/wms'
import { ASN_STATUS } from '@/constants'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'

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

// ── 탭 정의 — color는 활성 시 StatusBadge 색상과 동일하게 적용 ──────────────
const TABS = [
  { key: 'ALL',                label: '전체',    color: null                                                        },
  { key: ASN_STATUS.SUBMITTED, label: '제출됨',  color: { bg: 'var(--blue-pale)',  border: 'var(--blue)',  text: 'var(--blue)'  } },
  { key: ASN_STATUS.RECEIVED,  label: '입고완료', color: { bg: 'var(--green-pale)', border: 'var(--green)', text: 'var(--green)' } },
  { key: ASN_STATUS.CANCELLED, label: '취소',    color: { bg: 'var(--red-pale)',   border: 'var(--red)',   text: 'var(--red)'   } },
]

// ── 상태 ─────────────────────────────────────────────────────────────────────
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
const TAB_COUNT = computed(() => {
  const base = { ALL: allAsns.value.length }
  for (const tab of TABS) {
    if (tab.key !== 'ALL') {
      base[tab.key] = allAsns.value.filter(a => a.status === tab.key).length
    }
  }
  return base
})

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
    const res = await getAsnList()
    allAsns.value = res.data.data
  } catch (e) {
    console.error('[AsnList] fetch error:', e)
  } finally {
    isLoading.value = false
  }
}
onMounted(fetchAll)

// ── 활성 탭 인라인 스타일 계산 ───────────────────────────────────────────────
function tabActiveStyle(tab) {
  if (activeTab.value !== tab.key) return {}
  if (!tab.color) {
    return { background: 'rgba(245,166,35,0.12)', borderColor: 'var(--gold)', color: 'var(--gold)' }
  }
  return { background: tab.color.bg, borderColor: tab.color.border, color: tab.color.text }
}

function tabCountStyle(tab) {
  if (activeTab.value !== tab.key) return {}
  if (!tab.color) return { background: 'var(--gold)', color: '#fff' }
  return { background: tab.color.border, color: '#fff' }
}

// ── ASN 상세 모달 ─────────────────────────────────────────────────────────────
const showAsnDetail = ref(false)
const selectedAsn   = ref(null)

function openAsnDetail(row) {
  selectedAsn.value  = row
  showAsnDetail.value = true
}

function closeAsnDetail() {
  showAsnDetail.value = false
}

// ── 유틸 ─────────────────────────────────────────────────────────────────────
/** 예정 입고일이 오늘(2026-03-17) 이후면 true → 골드 강조 */
function isUpcoming(date) { return date >= '2026-03-17' }
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="ASN 목록" :loading="isLoading">
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
      clickable
      @page-change="page = $event"
      @row-click="openAsnDetail"
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
    <!-- ── ASN 상세 모달 ── -->
    <BaseModal
      title="ASN 상세 정보"
      :is-open="showAsnDetail"
      width="640px"
      :hide-footer="true"
      @cancel="closeAsnDetail"
    >
      <template v-if="selectedAsn">
        <!-- 헤더 정보 -->
        <div class="detail-header">
          <span class="detail-asn-id">{{ selectedAsn.id }}</span>
          <StatusBadge :status="selectedAsn.status" type="asn" />
        </div>

        <!-- 기본 정보 그리드 -->
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">셀러사</span>
            <span class="detail-value">{{ selectedAsn.company }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">담당자</span>
            <span class="detail-value">{{ selectedAsn.seller }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">입고 창고</span>
            <span class="detail-value">{{ selectedAsn.warehouse }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">SKU 수</span>
            <span class="detail-value">{{ selectedAsn.skuCount }} SKU</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">예정 수량</span>
            <span class="detail-value">{{ selectedAsn.plannedQty?.toLocaleString() }} EA</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">실수령 수량</span>
            <span class="detail-value" :class="{ 'detail-null': !selectedAsn.actualQty }">
              {{ selectedAsn.actualQty != null ? selectedAsn.actualQty.toLocaleString() + ' EA' : '미입고' }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">SKU 내용</span>
            <span class="detail-value">{{ selectedAsn.sku }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">예정 입고일</span>
            <span class="detail-value" :class="{ 'detail-upcoming': isUpcoming(selectedAsn.expectedDate) }">
              {{ selectedAsn.expectedDate }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">등록일</span>
            <span class="detail-value">{{ selectedAsn.registeredDate }}</span>
          </div>
        </div>
      </template>

      <template #footer>
        <button class="ui-btn ui-btn--ghost" @click="closeAsnDetail">닫기</button>
      </template>
    </BaseModal>

  </AppLayout>
</template>

<style scoped>
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
  font-weight: 700;
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

/* ── ASN 상세 모달 ──────────────────────────────────────────────── */
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.detail-asn-id {
  font-family: 'IBM Plex Sans', monospace;
  font-weight: 600;
  font-size: 15px;
  color: var(--blue);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-value {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--t1);
}

.detail-null   { color: var(--t4); font-style: italic; }
.detail-upcoming { color: var(--gold); font-weight: 600; }
</style>
