<script setup>
/**
 * SellerList — 총괄관리자 셀러 목록 페이지
 *
 * 레이아웃:
 *   Chip 필터 탭 (전체/활성/초대대기/정지) + 검색박스
 *   BaseTable (클라이언트 사이드 필터링 + 페이지네이션)
 *
 * 탭 색상:
 *   활성 탭 클릭 시 상태에 맞는 색상으로 변경 (AsnList.vue / OrderList.vue 패턴 동일)
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getSellerList } from '@/api/member'
import { ROUTE_NAMES } from '@/constants'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const breadcrumb = [{ label: '셀러 관리' }, { label: '셀러 목록' }]
const router = useRouter()

// ── BaseTable 컬럼 정의 ───────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'brand',       label: '셀러 정보 (Brand)', width: '260px' },
  { key: 'customerCode',label: 'customer_code',     width: '140px' },
  { key: 'warehouses',  label: '이용 중인 창고',     width: '200px' },
  { key: 'contact',     label: '대표 담당자',        width: '180px' },
  { key: 'createdAt',   label: '등록일',             width: '110px' },
  { key: 'status',      label: '상태',               width: '130px' },
]

// ── 탭 정의 — 탭 클릭 시 상태 색상으로 변경 ──────────────────────────────────
const TABS = [
  { key: 'ALL',       label: '전체',   color: null },
  { key: 'ACTIVE',    label: '활성',   color: { bg: 'var(--green-pale)', border: 'var(--green)', text: 'var(--green)' } },
  { key: 'PENDING',   label: '초대 대기', color: { bg: 'var(--amber-pale)', border: 'var(--amber)', text: '#b45309' } },
  { key: 'SUSPENDED', label: '정지',   color: { bg: 'var(--red-pale)',   border: 'var(--red)',   text: 'var(--red)'  } },
]

// ── 상태 ─────────────────────────────────────────────────────────────────────
const allSellers = ref([])
const isLoading  = ref(false)
const activeTab  = ref('ALL')
const searchQ    = ref('')
const page       = ref(1)
const PAGE_SIZE  = 10

// ── 탭 카운트 ─────────────────────────────────────────────────────────────────
const TAB_COUNT = computed(() => {
  const base = { ALL: allSellers.value.length }
  for (const tab of TABS) {
    if (tab.key !== 'ALL') {
      base[tab.key] = allSellers.value.filter(s => s.status === tab.key).length
    }
  }
  return base
})

// ── 활성 탭 색상 (AsnList.vue 동일 패턴) ─────────────────────────────────────
function tabActiveStyle(tab) {
  if (activeTab.value !== tab.key) return {}
  if (!tab.color) return { background: 'rgba(245,166,35,0.12)', borderColor: 'var(--gold)', color: 'var(--gold)' }
  return { background: tab.color.bg, borderColor: tab.color.border, color: tab.color.text }
}

function tabCountStyle(tab) {
  if (activeTab.value !== tab.key) return {}
  if (!tab.color) return { background: 'var(--gold)', color: '#fff' }
  return { background: tab.color.border, color: '#fff' }
}

// ── 클라이언트 사이드 필터링 ──────────────────────────────────────────────────
const filteredSellers = computed(() => {
  return allSellers.value
    .filter(s => activeTab.value === 'ALL' || s.status === activeTab.value)
    .filter(s => {
      if (!searchQ.value) return true
      const q = searchQ.value.toLowerCase()
      return (
        s.brandNameKo?.toLowerCase().includes(q) ||
        s.brandNameEn?.toLowerCase().includes(q) ||
        s.customerCode?.toLowerCase().includes(q) ||
        s.contactEmail?.toLowerCase().includes(q)
      )
    })
})

const paginatedSellers = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredSellers.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({
  page: page.value,
  pageSize: PAGE_SIZE,
  total: filteredSellers.value.length,
}))

watch([activeTab, searchQ], () => { page.value = 1 })

// ── 데이터 로드 ───────────────────────────────────────────────────────────────
async function fetchAll() {
  isLoading.value = true
  try {
    const res = await getSellerList()
    allSellers.value = res.data.data
  } catch (e) {
    console.error('[SellerList] fetch error:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAll)

// ── 셀러 로고 이니셜 (브랜드명 첫 2글자) ──────────────────────────────────────
function sellerInitials(seller) {
  const name = seller.brandNameEn || seller.brandNameKo || ''
  return name.slice(0, 2).toUpperCase()
}

// ── 상태 배지 스타일 ─────────────────────────────────────────────────────────
// ── 셀러 상세 모달 ────────────────────────────────────────────────────────────
const showSellerDetail  = ref(false)
const selectedSeller    = ref(null)

function openSellerDetail(row) {
  selectedSeller.value   = row
  showSellerDetail.value = true
}

function closeSellerDetail() {
  showSellerDetail.value = false
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="셀러 목록" :loading="isLoading">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost btn-export">CSV 내보내기</button>
      <button
        class="ui-btn ui-btn--gold"
        @click="router.push({ name: ROUTE_NAMES.MASTER_SELLER_COMPANY_REGISTER })"
      >
        신규 셀러 등록
      </button>
    </template>

    <!-- ── 필터 바 ── -->
    <div class="filter-bar">
      <!-- 탭 필터 -->
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

      <!-- 검색 -->
      <div class="search-box">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#B0B8CC" stroke-width="1.6">
          <circle cx="6" cy="6" r="4.5"/>
          <path d="M10 10l2.5 2.5" stroke-linecap="round"/>
        </svg>
        <input
          v-model="searchQ"
          class="search-input"
          type="text"
          placeholder="브랜드명, customer_code, 이메일 검색"
        />
      </div>
    </div>

    <!-- ── 데이터 테이블 ── -->
    <BaseTable
      :columns="COLUMNS"
      :rows="paginatedSellers"
      :loading="isLoading"
      :pagination="pagination"
      row-key="id"
      clickable
      @page-change="page = $event"
      @row-click="openSellerDetail"
    >
      <!-- 셀러 정보: 로고 이니셜 + 브랜드명 -->
      <template #cell-brand="{ row }">
        <div class="td-seller-info">
          <div class="seller-logo">{{ sellerInitials(row) }}</div>
          <div class="seller-text">
            <span class="seller-brand">{{ row.brandNameKo || row.brandNameEn }}</span>
            <span v-if="row.brandNameKo && row.brandNameEn" class="seller-brand-en">{{ row.brandNameEn }}</span>
            <span v-if="row.category" class="seller-cat">{{ row.category }}</span>
          </div>
        </div>
      </template>

      <!-- customer_code -->
      <template #cell-customerCode="{ value }">
        <span class="customer-code">{{ value }}</span>
      </template>

      <!-- 이용 창고 태그 -->
      <template #cell-warehouses="{ value }">
        <div class="wh-tags">
          <span v-for="wh in (value || [])" :key="wh" class="wh-tag">{{ wh }}</span>
          <span v-if="!value || value.length === 0" class="wh-tag-empty">-</span>
        </div>
      </template>

      <!-- 대표 담당자 -->
      <template #cell-contact="{ row }">
        <div class="td-contact">
          <span class="contact-name">{{ row.contactName }}</span>
          <span class="contact-email">{{ row.contactEmail }}</span>
        </div>
      </template>

      <!-- 등록일 -->
      <template #cell-createdAt="{ value }">
        <span class="date-normal">{{ value }}</span>
      </template>

      <!-- 상태 배지 -->
      <template #cell-status="{ value }">
        <StatusBadge :status="value" type="seller" />
      </template>
    </BaseTable>
    <!-- ── 셀러 상세 모달 ── -->
    <BaseModal
      title="셀러 상세 정보"
      :is-open="showSellerDetail"
      width="600px"
      :hide-footer="true"
      @cancel="closeSellerDetail"
    >
      <template v-if="selectedSeller">
        <!-- 헤더: 로고 이니셜 + 브랜드명 + 상태 배지 -->
        <div class="detail-header">
          <div class="detail-logo">{{ sellerInitials(selectedSeller) }}</div>
          <div class="detail-brand-wrap">
            <span class="detail-brand-ko">{{ selectedSeller.brandNameKo || selectedSeller.brandNameEn }}</span>
            <span v-if="selectedSeller.brandNameKo && selectedSeller.brandNameEn" class="detail-brand-en">
              {{ selectedSeller.brandNameEn }}
            </span>
          </div>
          <StatusBadge :status="selectedSeller.status" type="seller" />
        </div>

        <!-- 정보 그리드 -->
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">customer_code</span>
            <span class="detail-value detail-code">{{ selectedSeller.customerCode }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">카테고리</span>
            <span class="detail-value">{{ selectedSeller.category || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">담당자</span>
            <span class="detail-value">{{ selectedSeller.contactName }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">담당자 이메일</span>
            <span class="detail-value detail-email">{{ selectedSeller.contactEmail }}</span>
          </div>
          <div class="detail-item" style="grid-column: 1 / -1">
            <span class="detail-label">이용 중인 창고</span>
            <div class="detail-wh-tags">
              <span
                v-for="wh in (selectedSeller.warehouses || [])"
                :key="wh"
                class="wh-tag"
              >{{ wh }}</span>
              <span v-if="!selectedSeller.warehouses?.length" class="detail-value" style="color: var(--t4)">-</span>
            </div>
          </div>
          <div class="detail-item">
            <span class="detail-label">계약일</span>
            <span class="detail-value">{{ selectedSeller.createdAt }}</span>
          </div>
        </div>
      </template>

      <template #footer>
        <button class="ui-btn ui-btn--ghost" @click="closeSellerDetail">닫기</button>
      </template>
    </BaseModal>

  </AppLayout>
</template>

<style scoped>
/* ── 헤더 버튼 ── */
.ui-btn--gold {
  background: var(--gold);
  border: none;
  color: var(--t1);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(245,166,35,0.3);
}

.btn-export { font-size: 13px; }

/* ── 필터 바 ── */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
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

.filter-tab.active { font-weight: 700; }

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

/* ── 검색 ── */
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  width: 320px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  transition: border-color var(--ease-fast);
}
.search-box:focus-within { border-color: var(--blue); }

.search-input {
  border: none;
  outline: none;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--t1);
  background: transparent;
  flex: 1;
}
.search-input::placeholder { color: var(--t4); }

/* ── 셀 스타일 ── */
.td-seller-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.seller-logo {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 13px;
  color: var(--t3);
  flex-shrink: 0;
}

.seller-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.seller-brand {
  font-family: 'Barlow', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--t1);
}

.seller-brand-en,
.seller-cat {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: var(--t3);
}

.customer-code {
  font-family: 'IBM Plex Sans', monospace;
  font-size: 12px;
  color: var(--blue);
  white-space: nowrap;
}

.wh-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.wh-tag {
  padding: 2px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 3px;
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  color: var(--t3);
  white-space: nowrap;
}

.wh-tag-empty {
  font-size: 12px;
  color: var(--t4);
}

.td-contact {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-name {
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: var(--t2);
}

.contact-email {
  font-family: 'IBM Plex Sans', monospace;
  font-size: 11px;
  color: var(--t3);
  white-space: nowrap;
}

.date-normal {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--t3);
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 4px;
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 11px;
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* ── 셀러 상세 모달 ─────────────────────────────────────────────── */
.detail-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.detail-logo {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: var(--t3);
  flex-shrink: 0;
}

.detail-brand-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.detail-brand-ko {
  font-family: 'Barlow', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: var(--t1);
}

.detail-brand-en {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--t3);
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

.detail-code {
  font-family: 'IBM Plex Sans', monospace;
  color: var(--blue);
}

.detail-email {
  font-family: 'IBM Plex Sans', monospace;
  font-size: 12px;
  color: var(--t2);
}

.detail-wh-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}
</style>
