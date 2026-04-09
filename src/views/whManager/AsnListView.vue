<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { ROUTE_NAMES } from '@/constants'
import AsnDetailModal from '@/components/whManager/AsnDetailModal.vue'
import AsnMismatchModal from '@/components/whManager/AsnMismatchModal.vue'
import { useUiStore } from '@/stores/ui'
import { getWhmInboundAsns } from '@/api/wms'
import { INBOUND_STATUS } from '@/constants/status'

const ui = useUiStore()

// ── 탭 상태 ('asn' | 'bin')
const activeTab = ref('asn')

// ── ASN 목록 서브 상태 필터
const activeStatus = ref('all')

// ── 검색 / 필터
const searchText   = ref('')
const filterSeller = ref('')

// ── 페이지네이션
const currentPage = ref(1)
const PAGE_SIZE   = 6

// ── ASN 목록 (API 연동)
const asnList = ref([])
const loading = ref(false)

async function fetchAsns() {
  loading.value = true
  try {
    const res = await getWhmInboundAsns()
    asnList.value = res.data.data
  } finally {
    loading.value = false
  }
}

onMounted(fetchAsns)

// 상태 → 라벨/배지색 매핑
const STATUS_MAP = {
  [INBOUND_STATUS.PENDING]:  { label: '입고 대기',   color: 'amber' },
  [INBOUND_STATUS.TRANSIT]:  { label: '운송 중',     color: 'blue'  },
  [INBOUND_STATUS.RECEIVED]: { label: '검수 완료',   color: 'green' },
  [INBOUND_STATUS.MISMATCH]: { label: '수량 불일치', color: 'red'   },
}

// KPI 집계
const kpi = computed(() => ({
  total:    asnList.value.length,
  pending:  asnList.value.filter(a => a.status === INBOUND_STATUS.PENDING).length,
  transit:  asnList.value.filter(a => a.status === INBOUND_STATUS.TRANSIT).length,
  received: asnList.value.filter(a => a.status === INBOUND_STATUS.RECEIVED).length,
  mismatch: asnList.value.filter(a => a.status === INBOUND_STATUS.MISMATCH).length,
}))

const statusTabs = computed(() => [
  { key: 'all',                        label: '전체',        count: kpi.value.total,    color: 'gray'  },
  { key: INBOUND_STATUS.PENDING,       label: '입고 대기',   count: kpi.value.pending,  color: 'amber' },
  { key: INBOUND_STATUS.TRANSIT,       label: '운송 중',     count: kpi.value.transit,  color: 'blue'  },
  { key: INBOUND_STATUS.RECEIVED,      label: '검수 완료',   count: kpi.value.received, color: 'green' },
  { key: INBOUND_STATUS.MISMATCH,      label: '수량 불일치', count: kpi.value.mismatch, color: 'red'   },
])

watch([activeStatus, filterSeller, searchText], () => {
  currentPage.value = 1
})

const sellerOptions = computed(() => [...new Set(asnList.value.map(a => a.company))].sort())

const filteredAsns = computed(() => {
  let list = asnList.value

  if (activeStatus.value !== 'all') {
    list = list.filter(a => a.status === activeStatus.value)
  }
  if (filterSeller.value) {
    list = list.filter(a => a.company === filterSeller.value)
  }
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(a =>
      a.id.toLowerCase().includes(q) ||
      a.seller.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q) ||
      a.sku.toLowerCase().includes(q),
    )
  }

  return list
})

const pagedAsns = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredAsns.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({
  page:     currentPage.value,
  pageSize: PAGE_SIZE,
  total:    filteredAsns.value.length,
}))

const asnColumns = [
  { key: 'id',             label: 'ASN ID',      width: '175px' },
  { key: 'seller',         label: '셀러 / 회사',  width: '170px' },
  { key: 'sku',            label: 'SKU 종류' },
  { key: 'plannedQty',     label: '예정 수량',    align: 'right', width: '100px' },
  { key: 'actualQty',      label: '실입고 수량',  align: 'right', width: '120px' },
  { key: 'expectedDate',   label: '도착 예정일',  width: '110px' },
  { key: 'registeredDate', label: '등록일',        width: '100px' },
  { key: 'status',         label: '상태',          width: '110px' },
  { key: 'actions',        label: '작업',          width: '70px', align: 'center' },
]

function onStatusTab(key) {
  activeStatus.value = key
}

function onPageChange(page) {
  currentPage.value = page
}

const breadcrumb = [
  { label: 'CONK' },
  { label: '입고 관리' },
  { label: 'ASN 목록' },
]

// ── 모달 상태
const showDetailModal   = ref(false)
const showMismatchModal = ref(false)
const selectedAsn       = ref(null)
const detailCanAssign   = ref(false) // true = Bin 배정 편집 모드

// ASN 목록 탭 → 읽기 전용으로 열기
function openDetailModal(asn) {
  selectedAsn.value     = asn
  detailCanAssign.value = false
  showDetailModal.value = true
}

// Bin 미배정 ASN 탭 → 배정 편집 모드로 열기
function openAssignModal(asn) {
  selectedAsn.value     = asn
  detailCanAssign.value = true
  showDetailModal.value = true
}

function openMismatchModal(asn) {
  selectedAsn.value       = asn
  showMismatchModal.value = true
}

// 신규 SKU가 있고 아직 배정 완료되지 않은 ASN 목록
const unassignedAsns = computed(() =>
  asnList.value.filter(a => a.newSkus?.length > 0)
)

// AsnDetailModal에서 '입고 확인' 완료 시 호출
async function handleDetailConfirm() {
  showDetailModal.value = false
  await fetchAsns()
}

const binPendingColumns = [
  { key: 'id',          label: 'ASN ID',    width: '175px' },
  { key: 'company',     label: '셀러사',     width: '130px' },
  { key: 'newSkus',     label: '미배정 SKU' },
  { key: 'status',      label: 'ASN 상태',  width: '120px' },
  { key: 'actions',     label: '배정',       width: '90px', align: 'center' },
]
</script>

<template>
  <AppLayout title="ASN 목록" :breadcrumb="breadcrumb" :loading="loading || ui.isLoading">

    <!-- ── KPI 카드 4개 ─────────────────────────── -->
    <div class="kpi-grid">

      <div class="kpi-card" @click="onStatusTab('all')">
        <div class="kpi-label">전체 ASN</div>
        <div class="kpi-value">{{ kpi.total }}</div>
        <div class="kpi-sub">오늘 기준 등록 문서</div>
      </div>

      <div class="kpi-card" @click="onStatusTab(INBOUND_STATUS.PENDING)">
        <div class="kpi-label">입고 대기</div>
        <div class="kpi-value kpi--amber">{{ kpi.pending }}</div>
        <div class="kpi-sub">예정 입고 포함</div>
      </div>

      <div class="kpi-card" @click="onStatusTab(INBOUND_STATUS.TRANSIT)">
        <div class="kpi-label">운송 중</div>
        <div class="kpi-value kpi--blue">{{ kpi.transit }}</div>
        <div class="kpi-sub">도착 예정 48시간 이내</div>
      </div>

      <div class="kpi-card" @click="onStatusTab(INBOUND_STATUS.MISMATCH)">
        <div class="kpi-label">수량 불일치</div>
        <div class="kpi-value kpi--red">{{ kpi.mismatch }}</div>
        <div class="kpi-sub">즉시 검토 필요</div>
      </div>

    </div>

    <!-- ── 안내 배너 ──────────────────────────────── -->
    <div class="info-banner">
      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="flex-shrink:0;">
        <circle cx="7" cy="7" r="5.5"/>
        <path d="M7 5v4M7 3.5v.5" stroke-linecap="round"/>
      </svg>
      <p>
        <strong>ASN 운영 화면</strong> — ASN 목록 조회와 Bin 미배정 ASN 처리를 탭으로 전환하며 관리합니다.
      </p>
    </div>

    <!-- ── 메인 탭 ────────────────────────────────── -->
    <div class="main-tabs">
      <button
        v-for="tab in [
          { key: 'asn', label: 'ASN 목록' },
          { key: 'bin', label: 'Bin 미배정 ASN' },
        ]"
        :key="tab.key"
        class="main-tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'bin' && unassignedAsns.length" class="tab-badge">
          {{ unassignedAsns.length }}
        </span>
      </button>
    </div>

    <!-- ── 탭 패널 공통 래퍼 ─────────────────────── -->
    <div class="tab-panel">

      <!-- ▶ ASN 목록 탭 ─────────────────────────── -->
      <section v-if="activeTab === 'asn'">

        <!-- 서브 상태 탭 -->
        <div class="status-tabs">
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            class="status-tab-btn"
            :class="{ active: activeStatus === tab.key }"
            @click="onStatusTab(tab.key)"
          >
            {{ tab.label }}
            <span class="status-count" :class="`count--${tab.color}`">{{ tab.count }}</span>
          </button>
        </div>

        <!-- 필터 바 -->
        <div class="filter-bar">
          <div class="search-wrap">
            <svg class="search-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6">
              <circle cx="6.5" cy="6.5" r="4"/>
              <path d="M10 10l3 3" stroke-linecap="round"/>
            </svg>
            <input
              v-model="searchText"
              class="search-input"
              type="text"
              placeholder="ASN ID, 셀러명, SKU 검색..."
            />
          </div>

          <select v-model="filterSeller" class="select-filter">
            <option value="">전체 셀러</option>
            <option v-for="company in sellerOptions" :key="company" :value="company">{{ company }}</option>
          </select>

          <select class="select-filter">
            <option>도착 예정일(전체)</option>
            <option>오늘</option>
            <option>이번 주</option>
            <option>이번 달</option>
          </select>

          <div class="spacer"></div>

          <button class="ui-btn ui-btn--ghost" @click="activeTab = 'bin'">
            <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13">
              <path d="M2 3h9M2 6.5h9M2 10h5" stroke-linecap="round"/>
            </svg>
            Bin 미배정 ASN
            <span v-if="unassignedAsns.length" class="btn-badge">{{ unassignedAsns.length }}</span>
          </button>
        </div>

        <!-- ASN 테이블 -->
        <div class="table-section">
          <BaseTable
            :columns="asnColumns"
            :rows="pagedAsns"
            :pagination="pagination"
            row-key="id"
            @page-change="onPageChange"
          >
            <template #cell-id="{ row }">
              <span class="asn-link" @click="openDetailModal(row)">{{ row.id }}</span>
            </template>

            <template #cell-seller="{ row }">
              {{ row.seller }} / {{ row.company }}
            </template>

            <template #cell-plannedQty="{ row }">
              <span class="fw-600">{{ row.plannedQty.toLocaleString() }}개</span>
            </template>

            <template #cell-actualQty="{ row }">
              <span v-if="row.actualQty === null" class="text-muted">-</span>
              <span
                v-else
                class="fw-600"
                :class="row.actualQty < row.plannedQty ? 'text-red' : 'text-green'"
              >
                {{ row.actualQty.toLocaleString() }}개
                <span v-if="row.actualQty < row.plannedQty" class="diff-badge">
                  -{{ (row.plannedQty - row.actualQty).toLocaleString() }}
                </span>
              </span>
            </template>

            <template #cell-status="{ row }">
              <span class="badge" :class="`badge--${STATUS_MAP[row.status]?.color}`">
                {{ STATUS_MAP[row.status]?.label ?? row.status }}
              </span>
            </template>

            <template #cell-actions="{ row }">
              <button
                class="ui-btn ui-btn--ghost ui-btn--sm"
                @click="row.status === INBOUND_STATUS.MISMATCH ? openMismatchModal(row) : openDetailModal(row)"
              >
                {{ row.status === INBOUND_STATUS.MISMATCH ? '처리' : '상세' }}
              </button>
            </template>
          </BaseTable>
        </div>

      </section>

      <!-- ▶ Bin 미배정 ASN 탭 ───────────────────── -->
      <section v-else-if="activeTab === 'bin'">

        <!-- 탭 헤더 -->
        <div class="bin-header">
          <div>
            <div class="bin-header-title">Bin 배정 필요 ASN</div>
            <div class="bin-header-sub">
              신규 SKU가 포함된 ASN입니다. <strong>배정하기</strong>를 클릭해 ASN 상세에서 Bin을 직접 배정하세요.
              배정 완료 후 동일 SKU 재입고 시 자동으로 매핑됩니다.
            </div>
          </div>
          <span v-if="unassignedAsns.length" class="badge badge--amber">
            {{ unassignedAsns.length }}건 배정 필요
          </span>
          <span v-else class="badge badge--green">모두 배정 완료</span>
        </div>

        <!-- 빈 상태 -->
        <div v-if="!unassignedAsns.length" class="bin-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40" class="bin-empty-icon">
            <circle cx="12" cy="12" r="9"/>
            <path d="M8 12l3 3 5-5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="bin-empty-title">모든 ASN의 Bin이 배정되었습니다</div>
          <div class="bin-empty-sub">신규 SKU가 포함된 미처리 ASN이 없습니다.</div>
        </div>

        <!-- 미배정 ASN 테이블 -->
        <div v-else class="table-section">
          <BaseTable
            :columns="binPendingColumns"
            :rows="unassignedAsns"
            row-key="id"
          >
            <!-- ASN ID -->
            <template #cell-id="{ row }">
              <span class="asn-link" @click="openAssignModal(row)">{{ row.id }}</span>
            </template>

            <!-- 미배정 SKU 목록 -->
            <template #cell-newSkus="{ row }">
              <span
                v-for="sku in row.newSkus"
                :key="sku.code"
                class="sku-tag"
              >
                {{ sku.code }}
                <span class="sku-tag-name">{{ sku.name }}</span>
              </span>
            </template>

            <!-- ASN 상태 배지 -->
            <template #cell-status="{ row }">
              <span class="badge" :class="`badge--${STATUS_MAP[row.status]?.color}`">
                {{ STATUS_MAP[row.status]?.label ?? row.status }}
              </span>
            </template>

            <!-- 배정하기 버튼 -->
            <template #cell-actions="{ row }">
              <button class="ui-btn ui-btn--primary ui-btn--sm" @click="openAssignModal(row)">
                배정하기
              </button>
            </template>
          </BaseTable>
        </div>

      </section>

    </div>

    <!-- ── 모달 ─────────────────────────────────── -->
    <AsnDetailModal
      :is-open="showDetailModal"
      :asn-id="selectedAsn?.id ?? ''"
      :can-assign="detailCanAssign"
      @cancel="showDetailModal = false"
      @confirm="handleDetailConfirm"
    />
    <AsnMismatchModal
      :is-open="showMismatchModal"
      :asn="selectedAsn"
      @cancel="showMismatchModal = false"
      @confirm="showMismatchModal = false"
    />

  </AppLayout>
</template>

<style scoped>
/* ── KPI Grid ──────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  cursor: pointer;
  transition: box-shadow var(--ease-default), transform var(--ease-fast);
}
.kpi-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.kpi-label { font-size: var(--font-size-sm); color: var(--t3); margin-bottom: var(--space-2); }
.kpi-value {
  font-family: var(--font-condensed);
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--t1);
  line-height: 1.1;
  margin-bottom: var(--space-2);
}
.kpi-sub  { font-size: var(--font-size-xs); color: var(--t3); }

.kpi--amber { color: #b45309; }
.kpi--blue  { color: var(--blue); }
.kpi--red   { color: var(--red); }

/* ── Info Banner ───────────────────────────────── */
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--blue-pale);
  border: 1px solid rgba(76, 116, 255, 0.3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  color: var(--blue);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}
.info-banner p { margin: 0; }

/* ── Main Tabs ─────────────────────────────────── */
.main-tabs {
  display: flex;
  border-bottom: 2px solid var(--border);
}

.main-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--space-3) var(--space-5);
  border: none;
  background: transparent;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t3);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color var(--ease-fast), border-color var(--ease-fast);
}
.main-tab-btn:hover { color: var(--t1); }
.main-tab-btn.active { color: var(--blue); border-bottom-color: var(--blue); }

/* 탭 버튼 내 카운트 배지 */
.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  background: var(--amber-pale);
  color: #b45309;
  font-size: 11px;
  font-weight: 700;
}

/* ── Tab Panel ─────────────────────────────────── */
.tab-panel {
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  background: var(--surface);
}

/* ── Status Sub-tabs ───────────────────────────── */
.status-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}

.status-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  font-size: var(--font-size-sm);
  color: var(--t3);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color var(--ease-fast);
}
.status-tab-btn:hover { color: var(--t1); }
.status-tab-btn.active {
  color: var(--t1);
  font-weight: 600;
  border-bottom-color: var(--t1);
}

.status-count {
  font-size: var(--font-size-xs);
  padding: 2px 7px;
  border-radius: var(--radius-full);
  font-weight: 600;
}
.count--gray  { background: var(--surface-2); color: var(--t3); border: 1px solid var(--border); }
.count--amber { background: var(--amber-pale); color: #b45309; }
.count--blue  { background: var(--blue-pale);  color: var(--blue); }
.count--green { background: var(--green-pale); color: var(--green); }
.count--red   { background: var(--red-pale);   color: var(--red); }

/* ── Filter Bar ────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 10px;
  width: 14px;
  height: 14px;
  color: var(--t3);
  pointer-events: none;
}
.search-input {
  height: 36px;
  padding: 0 12px 0 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
  width: 240px;
  outline: none;
  transition: border-color var(--ease-fast);
}
.search-input:focus { border-color: var(--blue); }

.select-filter {
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.spacer { flex: 1; }

/* ── Table Section ─────────────────────────────── */
.table-section { padding: var(--space-4); }

/* ── Table Cell Helpers ────────────────────────── */
.asn-link {
  color: var(--blue);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  cursor: pointer;
}
.asn-link:hover { text-decoration: underline; }

.fw-600      { font-weight: 600; }
.text-muted  { color: var(--t3); }
.text-green  { color: var(--green); }
.text-red    { color: var(--red); }

.diff-badge {
  display: inline-flex;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: var(--red-pale);
  color: var(--red);
  font-size: 9px;
  font-weight: 700;
  margin-left: 4px;
}

/* ── Status Badge ──────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.badge--amber { background: var(--amber-pale); color: #b45309; }
.badge--blue  { background: var(--blue-pale);  color: var(--blue); }
.badge--green { background: var(--green-pale); color: var(--green); }
.badge--red   { background: var(--red-pale);   color: var(--red); }

/* ── Bin 미배정 탭 헤더 ──────────────────────── */
.bin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}
.bin-header-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--t1);
  margin-bottom: 4px;
}
.bin-header-sub {
  font-size: var(--font-size-xs);
  color: var(--t3);
  line-height: 1.5;
}

/* ── 빈 상태 ──────────────────────────────────── */
.bin-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px var(--space-5);
  gap: var(--space-2);
}
.bin-empty-icon { color: var(--green); margin-bottom: var(--space-2); }
.bin-empty-title { font-size: var(--font-size-md); font-weight: 600; color: var(--t2); }
.bin-empty-sub { font-size: var(--font-size-sm); color: var(--t3); }

/* ── 신규 SKU 태그 ────────────────────────────── */
.sku-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  background: var(--amber-pale);
  border: 1px solid #d97706;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-family: var(--font-mono);
  color: #92400e;
  margin-right: 4px;
  margin-bottom: 2px;
  white-space: nowrap;
}
.sku-tag-name {
  font-family: var(--font-sans, sans-serif);
  font-size: var(--font-size-xs);
  color: #b45309;
  font-weight: 400;
}

/* ── 버튼 ─────────────────────────────────────── */
.ui-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
  transition: background var(--ease-fast), opacity var(--ease-fast);
}
.ui-btn--ghost {
  border-color: var(--border);
  background: transparent;
  color: var(--t2);
  padding: 0 var(--space-3);
  height: 36px;
  font-size: var(--font-size-sm);
}
.ui-btn--ghost:hover { background: var(--surface-2); color: var(--t1); }
.ui-btn--primary {
  background: var(--blue);
  color: #fff;
  padding: 0 var(--space-3);
  height: 36px;
  font-size: var(--font-size-sm);
}
.ui-btn--primary:hover { opacity: 0.9; }
.ui-btn--sm { height: 30px; font-size: var(--font-size-xs); padding: 0 var(--space-3); }

/* 필터바 내 버튼 카운트 배지 */
.btn-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--radius-full);
  background: #b45309;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}
</style>
