<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { ROUTE_NAMES } from '@/constants'
import AsnDetailModal from './components/AsnDetailModal.vue'
import AsnMismatchModal from './components/AsnMismatchModal.vue'

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

// ── 모달 상태
const showDetailModal   = ref(false)
const showMismatchModal = ref(false)
const selectedAsn       = ref(null)

function openDetailModal(asn) {
  selectedAsn.value     = asn
  showDetailModal.value = true
}

function openMismatchModal(asn) {
  selectedAsn.value       = asn
  showMismatchModal.value = true
}

/** 태스크 목록 탭에서 asnId로 원본 ASN 데이터를 찾아 모달 오픈 */
function openModalForTask(task) {
  const asn = ASN_LIST.find(a => a.id === task.asnId) ?? null
  if (task.action === 'mismatch') openMismatchModal(asn)
  else openDetailModal(asn)
}

// ────────────────────────────────────────────
// 전체 작업 목록 탭 — 하드코딩 Mock 데이터
// ────────────────────────────────────────────
const taskList = [
  { id: 'INB-TASK-024', type: '검수',        typeColor: 'blue',   asnId: 'ASN-2024-0312-001', bin: 'A-3-2', worker: '박민준',          status: '대기',     statusColor: 'amber', action: 'detail'   },
  { id: 'INB-TASK-023', type: '수량 대조',   typeColor: 'green',  asnId: 'ASN-2024-0311-005', bin: 'C-1-4', worker: '이서윤',          status: '진행중',   statusColor: 'blue',  action: 'track'    },
  { id: 'INB-TASK-022', type: '불일치 검토', typeColor: 'red',    asnId: 'ASN-2024-0310-003', bin: '검토',  worker: '관리자 확인 필요', status: '검토 필요', statusColor: 'red',   action: 'mismatch' },
  { id: 'INB-TASK-021', type: '적재',        typeColor: 'amber',  asnId: 'ASN-2024-0309-002', bin: 'A-3-3', worker: '이서윤',          status: '완료',     statusColor: 'green', action: 'history'  },
]

const priorities = [
  { asnId: 'ASN-2024-0310-003', sub: '실입고 185개 / 예정 200개 · 파손 사진 2건 첨부됨', level: '긴급', color: 'red'   },
  { asnId: 'ASN-2024-0312-001', sub: '입고 예정 1,000개 · 고회전 SKU라 Bin 선점 필요',    level: '우선', color: 'amber' },
]

const opMemos = [
  { title: '검수 대기 8건',     sub: '도착 예정일이 오늘인 ASN 3건 우선 처리' },
  { title: '자동 Bin 추천 91%', sub: '예외 2건만 수동 조정 필요' },
  { title: '적재 완료 9건',      sub: '완료 ASN은 재고현황으로 자동 반영됨' },
]

const taskColumns = [
  { key: 'id',     label: '작업 ID',   width: '130px' },
  { key: 'type',   label: '유형',       width: '100px' },
  { key: 'asnId',  label: '기준 문서', width: '160px' },
  { key: 'bin',    label: '추천 Bin',  width: '90px'  },
  { key: 'worker', label: '담당 작업자' },
  { key: 'status', label: '상태',       width: '90px'  },
  { key: 'action', label: '작업',       width: '70px', align: 'center' },
]

// ────────────────────────────────────────────
// Bin 사전 배정 탭 — 하드코딩 Mock 데이터
// ────────────────────────────────────────────
const binKpi = [
  { label: '사전 배정 ASN', value: 11,    color: ''      },
  { label: '즉시 검토 Bin', value: 2,     color: 'amber' },
  { label: '여유 적재율',   value: '78%', color: 'blue'  },
]

const binRecommendations = [
  { asnId: 'ASN-2024-0312-001', company: 'Glow Beauty', sku: '앰플 세럼 30ml', bins: ['A-3-2', 'A-3-3'], worker: '박민준', avail: '1,220개', memo: '고회전 SKU 존 우선' },
  { asnId: 'ASN-2024-0311-005', company: 'K-Style',     sku: '티셔츠 L',       bins: ['C-1-4'],           worker: '이서윤', avail: '640개',   memo: '혼적 방지 위해 단일 Bin 유지' },
  { asnId: 'ASN-2024-0310-003', company: 'Eco Pure',    sku: '텀블러 350ml',   bins: [],                  worker: '관리자', avail: '-',       memo: '불일치 처리 후 Bin 재추천' },
]

const zonePolicy = [
  { zone: 'A Zone', worker: '박민준', category: '뷰티, 고회전 SKU', fallback: '최현우', status: '안정',   statusColor: 'green' },
  { zone: 'C Zone', worker: '이서윤', category: '패션, 박스 입고',  fallback: '박민준', status: '운영중', statusColor: 'blue'  },
  { zone: 'D Zone', worker: '최현우', category: '일반 적재',        fallback: '이서윤', status: '재점검', statusColor: 'amber' },
]

const binColumns = [
  { key: 'asnId',   label: 'ASN ID',      width: '160px' },
  { key: 'company', label: '셀러사' },
  { key: 'sku',     label: '주요 SKU' },
  { key: 'bins',    label: '추천 Bin',    width: '140px' },
  { key: 'worker',  label: '담당 작업자', width: '100px' },
  { key: 'avail',   label: '가용 수량',   width: '90px', align: 'right' },
  { key: 'memo',    label: '메모' },
]

const zoneColumns = [
  { key: 'zone',     label: '존',               width: '100px' },
  { key: 'worker',   label: '전담 작업자',      width: '100px' },
  { key: 'category', label: '주요 취급 카테고리' },
  { key: 'fallback', label: 'Fallback',          width: '100px' },
  { key: 'status',   label: '상태',              width: '90px'  },
]
</script>

<template>
  <AppLayout title="ASN 목록" :breadcrumb="breadcrumb" :loading="ui.isLoading">

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
              <span class="asn-link" @click="openDetailModal(row)">{{ row.id }}</span>
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
              <button
                class="ui-btn ui-btn--ghost ui-btn--sm"
                @click="row.status === 'mismatch' ? openMismatchModal(row) : openDetailModal(row)"
              >
                {{ row.status === 'mismatch' ? '처리' : '상세' }}
              </button>
            </template>
          </BaseTable>
        </div>

      </section>

      <!-- ▶ 전체 작업 목록 탭 ────────────────────── -->
      <section v-else-if="activeTab === 'tasks'">
        <!-- 헤더 -->
        <div class="matrix-note">
          <div>
            <strong>입고 작업 전체 큐</strong>
            <p class="matrix-sub">ASN 검수, 수량 대조, Bin 추천, 적재 완료까지 이어지는 전체 작업 흐름을 한 화면에서 관리합니다.</p>
          </div>
          <button class="ui-btn ui-btn--primary ui-btn--sm">우선순위 갱신</button>
        </div>

        <!-- 2컬럼 그리드 -->
        <div class="queue-grid">
          <!-- 왼쪽: 작업 테이블 -->
          <div class="summary-box">
            <div class="summary-title">전체 작업 목록</div>
            <BaseTable :columns="taskColumns" :rows="taskList" row-key="id">
              <template #cell-type="{ row }">
                <span class="badge" :class="`badge--${row.typeColor}`">{{ row.type }}</span>
              </template>
              <template #cell-asnId="{ row }">
                <span class="mono-sm">{{ row.asnId }}</span>
              </template>
              <template #cell-bin="{ row }">
                <span class="location-tag">{{ row.bin }}</span>
              </template>
              <template #cell-status="{ row }">
                <span class="badge" :class="`badge--${row.statusColor}`">{{ row.status }}</span>
              </template>
              <template #cell-action="{ row }">
                <button
                  class="ui-btn ui-btn--sm"
                  :class="row.action === 'mismatch' ? 'ui-btn--primary' : 'ui-btn--ghost'"
                  @click="openModalForTask(row)"
                >
                  {{ row.action === 'track' ? '추적' : row.action === 'history' ? '이력' : row.action === 'mismatch' ? '처리' : '상세' }}
                </button>
              </template>
            </BaseTable>
          </div>

          <!-- 오른쪽: 우선순위 + 메모 -->
          <div class="card-stack">
            <!-- 검토 우선순위 -->
            <div class="summary-box">
              <div class="summary-title">검토 우선순위</div>
              <div class="priority-list">
                <div v-for="item in priorities" :key="item.asnId" class="priority-item">
                  <div class="priority-copy">
                    <div class="priority-main">{{ item.asnId }}</div>
                    <div class="priority-sub">{{ item.sub }}</div>
                  </div>
                  <span class="badge" :class="`badge--${item.color}`">{{ item.level }}</span>
                </div>
              </div>
            </div>
            <!-- 오늘 운영 메모 -->
            <div class="summary-box">
              <div class="summary-title">오늘 운영 메모</div>
              <div class="priority-list">
                <div v-for="memo in opMemos" :key="memo.title" class="priority-item">
                  <div class="priority-copy">
                    <div class="priority-main">{{ memo.title }}</div>
                    <div class="priority-sub">{{ memo.sub }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ▶ Bin 사전 배정 탭 ───────────────────────── -->
      <section v-else-if="activeTab === 'bin'">
        <div class="matrix-note">
          <div>
            <strong>Bin 사전 배정 기준</strong>
            <p class="matrix-sub">입고 예정 ASN 기준으로 검수 존과 적재 Bin을 선배정해 작업자와 공간 충돌을 줄입니다.</p>
          </div>
          <button class="ui-btn ui-btn--primary ui-btn--sm">배정 기준 저장</button>
        </div>

        <div class="bin-body">
          <!-- 미니 KPI -->
          <div class="mini-kpis">
            <div v-for="item in binKpi" :key="item.label" class="mini-kpi">
              <div class="mini-kpi-label">{{ item.label }}</div>
              <div
                class="mini-kpi-value"
                :class="item.color ? `kpi--${item.color}` : ''"
              >{{ item.value }}</div>
            </div>
          </div>

          <!-- ASN별 추천 Bin 테이블 -->
          <div class="summary-box" style="margin-top: var(--space-4);">
            <div class="summary-title">ASN별 추천 Bin</div>
            <BaseTable :columns="binColumns" :rows="binRecommendations" row-key="asnId">
              <template #cell-bins="{ row }">
                <template v-if="row.bins.length">
                  <span v-for="b in row.bins" :key="b" class="location-tag" style="margin-right:4px;">{{ b }}</span>
                </template>
                <span v-else class="location-tag location-tag--warn">검토 필요</span>
              </template>
              <template #cell-memo="{ row }">
                <span class="memo-text">{{ row.memo }}</span>
              </template>
            </BaseTable>
          </div>

          <!-- 검수 존 운영 정책 테이블 -->
          <div class="summary-box" style="margin-top: var(--space-4);">
            <div class="summary-title">검수 존 운영 정책</div>
            <BaseTable :columns="zoneColumns" :rows="zonePolicy" row-key="zone">
              <template #cell-zone="{ row }">
                <span class="location-tag">{{ row.zone }}</span>
              </template>
              <template #cell-status="{ row }">
                <span class="badge" :class="`badge--${row.statusColor}`">{{ row.status }}</span>
              </template>
            </BaseTable>
          </div>
        </div>
      </section>

    </div>

    <!-- ── 모달 ─────────────────────────────────── -->
    <AsnDetailModal
      :is-open="showDetailModal"
      :asn="selectedAsn"
      @cancel="showDetailModal = false"
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

/* ── Matrix Note (탭 헤더) ─────────────────────── */
.matrix-note {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}
.matrix-note strong { color: var(--t1); font-size: var(--font-size-md); }
.matrix-sub { font-size: var(--font-size-xs); color: var(--t3); margin: 4px 0 0; }

/* ── Queue Grid (전체 작업 목록 탭) ─────────────── */
.queue-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-4);
  padding: var(--space-5);
}

/* ── Summary Box / Card Stack ──────────────────── */
.summary-box {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  padding: var(--space-4);
}
.summary-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--t1);
  margin-bottom: var(--space-3);
}
.card-stack { display: flex; flex-direction: column; gap: var(--space-4); }

/* ── Priority List ─────────────────────────────── */
.priority-list { display: flex; flex-direction: column; gap: var(--space-3); }
.priority-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}
.priority-copy { flex: 1; min-width: 0; }
.priority-main { font-size: var(--font-size-xs); font-weight: 600; color: var(--t1); }
.priority-sub  { font-size: 11px; color: var(--t3); margin-top: 2px; line-height: 1.45; }

/* ── Table Cell Helpers (탭 공용) ──────────────── */
.mono-sm { font-family: var(--font-mono); font-size: 11px; color: var(--t3); }
.location-tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--t2);
}
.location-tag--warn { border-color: var(--amber); color: #b45309; background: var(--amber-pale); }
.memo-text { color: var(--t3); font-size: var(--font-size-xs); }

/* ── Bin Tab ────────────────────────────────────── */
.bin-body { padding: var(--space-5); }
.mini-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}
.mini-kpi {
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}
.mini-kpi-label { font-size: 11px; color: var(--t3); margin-bottom: var(--space-1); }
.mini-kpi-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--t1);
  font-family: var(--font-condensed);
}
</style>
