<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { ROUTE_NAMES } from '@/constants'

const router = useRouter()

// ── 탭 상태 ('asn' | 'tasks' | 'bin')
const activeTab = ref('asn')

// ── ASN 목록 서브 상태 필터
const activeStatus = ref('all')

// ── 검색 / 필터
const searchText   = ref('')
const filterSeller = ref('')

// ── 페이지네이션
const currentPage = ref(1)
const PAGE_SIZE   = 6

// ────────────────────────────────────────────
// 하드코딩 Mock 데이터 (추후 API 연동 시 교체)
// ────────────────────────────────────────────
const ASN_LIST = [
  {
    id: 'ASN-2024-0312-001',
    seller: '이수빈',
    company: 'Glow Beauty',
    sku: '앰플 세럼 30ml 외 2종',
    plannedQty: 1000,
    actualQty: null,
    expectedDate: '2026-03-14',
    registeredDate: '2026-03-10',
    status: 'pending',
  },
  {
    id: 'ASN-2024-0311-005',
    seller: '박정호',
    company: 'K-Style',
    sku: '티셔츠 L 외 3종',
    plannedQty: 500,
    actualQty: null,
    expectedDate: '2026-03-13',
    registeredDate: '2026-03-09',
    status: 'transit',
  },
  {
    id: 'ASN-2024-0310-003',
    seller: '최민수',
    company: 'Eco Pure',
    sku: '텀블러 350ml',
    plannedQty: 200,
    actualQty: 185,
    expectedDate: '2026-03-12',
    registeredDate: '2026-03-08',
    status: 'mismatch',
  },
  {
    id: 'ASN-2024-0309-002',
    seller: '이수빈',
    company: 'Glow Beauty',
    sku: '마스크팩 10매입',
    plannedQty: 800,
    actualQty: 800,
    expectedDate: '2026-03-12',
    registeredDate: '2026-03-07',
    status: 'received',
  },
  {
    id: 'ASN-2024-0308-001',
    seller: '강은채',
    company: 'K-Farm',
    sku: '특산 진액 30팩',
    plannedQty: 300,
    actualQty: 298,
    expectedDate: '2026-03-11',
    registeredDate: '2026-03-06',
    status: 'received',
  },
  {
    id: 'ASN-2024-0307-004',
    seller: '김지훈',
    company: 'Beauty Lab',
    sku: 'BB크림 외 1종',
    plannedQty: 400,
    actualQty: null,
    expectedDate: '2026-03-16',
    registeredDate: '2026-03-05',
    status: 'pending',
  },
]

// 상태 → 라벨/배지색 매핑 (HTML 목업 기준)
const STATUS_MAP = {
  pending:  { label: '입고 대기',   color: 'amber' },
  transit:  { label: '운송 중',     color: 'blue'  },
  received: { label: '검수 완료',   color: 'green' },
  mismatch: { label: '수량 불일치', color: 'red'   },
}

// KPI 집계 — 하드코딩 데이터에서 상태별 카운트 계산
const kpi = computed(() => ({
  total:    ASN_LIST.length,
  pending:  ASN_LIST.filter(a => a.status === 'pending').length,
  transit:  ASN_LIST.filter(a => a.status === 'transit').length,
  received: ASN_LIST.filter(a => a.status === 'received').length,
  mismatch: ASN_LIST.filter(a => a.status === 'mismatch').length,
}))

// 서브 탭 목록 (카운트는 전체 데이터 기준 고정값)
const statusTabs = computed(() => [
  { key: 'all',      label: '전체',        count: kpi.value.total,    color: 'gray'  },
  { key: 'pending',  label: '입고 대기',   count: kpi.value.pending,  color: 'amber' },
  { key: 'transit',  label: '운송 중',     count: kpi.value.transit,  color: 'blue'  },
  { key: 'received', label: '검수 완료',   count: kpi.value.received, color: 'green' },
  { key: 'mismatch', label: '수량 불일치', count: kpi.value.mismatch, color: 'red'   },
])

// 필터가 바뀔 때마다 페이지를 1로 초기화
watch([activeStatus, filterSeller, searchText], () => {
  currentPage.value = 1
})

// 클라이언트 사이드 필터링
const filteredAsns = computed(() => {
  let list = ASN_LIST

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

// 클라이언트 사이드 페이지네이션 — 필터된 결과에서 현재 페이지 슬라이스
const pagedAsns = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredAsns.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({
  page:     currentPage.value,
  pageSize: PAGE_SIZE,
  total:    filteredAsns.value.length,
}))

// BaseTable 컬럼 정의
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
</script>

<template>
  <AppLayout title="ASN 목록" :breadcrumb="breadcrumb">

    <!-- ── KPI 카드 4개 ─────────────────────────── -->
    <div class="kpi-grid">

      <div class="kpi-card" @click="onStatusTab('all')">
        <div class="kpi-label">전체 ASN</div>
        <div class="kpi-value">{{ kpi.total }}</div>
        <div class="kpi-sub">오늘 기준 등록 문서</div>
      </div>

      <div class="kpi-card" @click="onStatusTab('pending')">
        <div class="kpi-label">입고 대기</div>
        <div class="kpi-value kpi--amber">{{ kpi.pending }}</div>
        <div class="kpi-sub">예정 입고 포함</div>
      </div>

      <div class="kpi-card" @click="onStatusTab('transit')">
        <div class="kpi-label">운송 중</div>
        <div class="kpi-value kpi--blue">{{ kpi.transit }}</div>
        <div class="kpi-sub">도착 예정 48시간 이내</div>
      </div>

      <div class="kpi-card" @click="onStatusTab('mismatch')">
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
        <strong>ASN 운영 화면</strong> — ASN 목록, 전체 작업 목록, Bin 사전 배정을 탭으로 전환하며 관리합니다.
      </p>
    </div>

    <!-- ── 메인 탭 ────────────────────────────────── -->
    <div class="main-tabs">
      <button
        v-for="tab in [
          { key: 'asn',   label: 'ASN 목록' },
          { key: 'tasks', label: '전체 작업 목록' },
          { key: 'bin',   label: 'Bin 사전 배정' },
        ]"
        :key="tab.key"
        class="main-tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
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
            <option>Glow Beauty</option>
            <option>K-Style</option>
            <option>Eco Pure</option>
            <option>K-Farm</option>
            <option>Beauty Lab</option>
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
            Bin 배정 보기
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
            <!-- ASN ID: 파란색 링크 스타일 -->
            <template #cell-id="{ row }">
              <span class="asn-link">{{ row.id }}</span>
            </template>

            <!-- 셀러 / 회사: 두 필드 합쳐서 표시 -->
            <template #cell-seller="{ row }">
              {{ row.seller }} / {{ row.company }}
            </template>

            <!-- 예정 수량: 천단위 콤마 -->
            <template #cell-plannedQty="{ row }">
              <span class="fw-600">{{ row.plannedQty.toLocaleString() }}개</span>
            </template>

            <!-- 실입고 수량: null이면 '-', 불일치면 빨간색 + diff 배지 -->
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

            <!-- 상태 배지 -->
            <template #cell-status="{ row }">
              <span class="badge" :class="`badge--${STATUS_MAP[row.status]?.color}`">
                {{ STATUS_MAP[row.status]?.label ?? row.status }}
              </span>
            </template>

            <!-- 작업 버튼: 수량 불일치는 '처리', 나머지는 '상세' -->
            <template #cell-actions="{ row }">
              <button class="ui-btn ui-btn--ghost ui-btn--sm">
                {{ row.status === 'mismatch' ? '처리' : '상세' }}
              </button>
            </template>
          </BaseTable>
        </div>

      </section>

      <!-- ▶ 전체 작업 목록 탭 (Issue 2에서 구현) ── -->
      <section v-else-if="activeTab === 'tasks'" class="coming-soon">
        <p>전체 작업 목록은 준비 중입니다.</p>
      </section>

      <!-- ▶ Bin 사전 배정 탭 (Issue 2에서 구현) ──── -->
      <section v-else-if="activeTab === 'bin'" class="coming-soon">
        <p>Bin 사전 배정은 준비 중입니다.</p>
      </section>

    </div>

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

/* ── Coming Soon ───────────────────────────────── */
.coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--t3);
  font-size: var(--font-size-sm);
}
</style>
