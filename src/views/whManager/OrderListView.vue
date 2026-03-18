<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BulkOutboundModal from './components/BulkOutboundModal.vue'
import { getWhmOrders } from '@/api/order'

// ── 탭
const TABS = [
  { key: 'all',      label: '전체',    badgeColor: 'gray'  },
  { key: 'received', label: '접수',    badgeColor: 'blue'  },
  { key: 'picking',  label: '피킹 중', badgeColor: 'amber' },
  { key: 'packed',   label: '포장완료', badgeColor: 'amber' },
  { key: 'shipped',  label: '출고완료', badgeColor: 'green' },
  { key: 'transit',  label: '배송중',  badgeColor: 'blue'  },
]
const activeTab = ref('all')

// ── 상태 개요 텍스트
const STATUS_OVERVIEW = {
  all:      { heading: '전체 주문',      copy: '주문 접수부터 배송중까지 전체 흐름을 한 화면에서 확인하고, 출고 우선순위와 지연 가능성을 빠르게 점검합니다.' },
  received: { heading: '접수 주문',      copy: '방금 유입된 주문을 확인하고 피킹 전 검토가 필요한 주문을 우선 배치합니다.' },
  picking:  { heading: '피킹 진행 주문', copy: '작업자가 현재 피킹 중인 주문을 추적하고, 지연 가능성이 있는 주문을 빠르게 조정합니다.' },
  packed:   { heading: '포장완료 주문',  copy: '포장은 끝났지만 출고 확정 전인 주문입니다. 송장, 박스, 출고대기 시간을 함께 확인합니다.' },
  shipped:  { heading: '출고완료 주문',  copy: '창고에서 출고가 완료된 주문입니다. 인수 완료 여부와 다음 배송 단계 진입 시간을 확인합니다.' },
  transit:  { heading: '배송중 주문',    copy: '운송장 기준 배송중인 주문입니다. ETA 지연과 고객 문의 가능성이 높은 건을 우선 모니터링합니다.' },
}

// ── 상태 배지 매핑
const STATUS_MAP = {
  received: { label: '접수',    color: 'blue'  },
  picking:  { label: '피킹 중', color: 'amber' },
  packed:   { label: '포장완료', color: 'amber' },
  shipped:  { label: '출고완료', color: 'green' },
  transit:  { label: '배송중',  color: 'blue'  },
}

// ── 채널 배지 매핑
const CHANNEL_MAP = {
  amazon: { label: 'Amazon', color: 'blue' },
  manual: { label: '수동',   color: 'gray' },
  csv:    { label: 'CSV',    color: 'gray' },
}

// ── 필터
const searchText    = ref('')
const filterSeller  = ref('')
const filterChannel = ref('')

// ── 페이지네이션
const currentPage = ref(1)
const PAGE_SIZE   = 8

// ── 데이터
const orders = ref([])

async function fetchOrders() {
  try {
    const { data } = await getWhmOrders()
    orders.value = data.data ?? data
  } catch (e) {
    console.error('주문 데이터 로드 실패:', e)
  }
}
onMounted(fetchOrders)

// 필터 바뀌면 1페이지로
watch([activeTab, searchText, filterSeller, filterChannel], () => {
  currentPage.value = 1
})

// ── 클라이언트 필터링
const filtered = computed(() => {
  let list = orders.value
  if (activeTab.value !== 'all') {
    list = list.filter(o => o.status === activeTab.value)
  }
  if (filterSeller.value) {
    list = list.filter(o => o.company === filterSeller.value)
  }
  if (filterChannel.value) {
    list = list.filter(o => o.channel === filterChannel.value)
  }
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.company.toLowerCase().includes(q) ||
      o.product.toLowerCase().includes(q),
    )
  }
  return list
})

// ── 페이지네이션
const paged = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({
  page:     currentPage.value,
  pageSize: PAGE_SIZE,
  total:    filtered.value.length,
}))

// ── 탭별 카운트
const tabCount = computed(() => {
  const counts = { all: orders.value.length }
  orders.value.forEach(o => {
    counts[o.status] = (counts[o.status] ?? 0) + 1
  })
  return counts
})

// ── 상태 개요 KPI
const overviewKpi = computed(() => {
  const list = filtered.value
  return {
    count:     list.length,
    priority:  list.filter(o => o.status === 'received').length,
    highlight: TABS.find(t => t.key === activeTab.value)?.label ?? '전체',
  }
})

// ── 셀러/채널 목록 (중복 제거)
const companyOptions = computed(() => [...new Set(orders.value.map(o => o.company))])
const channelOptions = computed(() => [...new Set(orders.value.map(o => o.channel))])

// ── 체크박스 선택
const selectedIds = ref(new Set())

function toggleRow(id) {
  const next = new Set(selectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedIds.value = next
}
function toggleAll(checked) {
  selectedIds.value = checked ? new Set(paged.value.map(o => o.id)) : new Set()
}
const allChecked = computed(() =>
  paged.value.length > 0 && paged.value.every(o => selectedIds.value.has(o.id)),
)
const selectedOrders = computed(() => orders.value.filter(o => selectedIds.value.has(o.id)))

// ── 일괄 출고 지시 모달
const isBulkModalOpen = ref(false)

function openBulkModal() {
  if (!selectedIds.value.size) return
  isBulkModalOpen.value = true
}
function closeBulkModal() {
  isBulkModalOpen.value = false
}
function confirmBulkOutbound() {
  // TODO: 실제 출고 지시 API 연동 시 교체
  isBulkModalOpen.value = false
  selectedIds.value = new Set()
}

// ── 컬럼 정의
const columns = [
  { key: 'check',     label: '',         width: '44px',  align: 'center' },
  { key: 'id',        label: '주문번호',  width: '160px' },
  { key: 'channel',   label: '채널',     width: '80px',  align: 'center' },
  { key: 'company',   label: '셀러 / 회사' },
  { key: 'product',   label: '상품 / 수량' },
  { key: 'region',    label: '배송지',    width: '100px' },
  { key: 'orderedAt', label: '주문일',    width: '100px', align: 'center' },
  { key: 'warehouse', label: '창고',      width: '80px',  align: 'center' },
  { key: 'status',    label: '상태',      width: '100px', align: 'center' },
  { key: 'actions',   label: '작업',      width: '70px',  align: 'center' },
]

// ── 브레드크럼
const breadcrumb = [
  { label: 'CONK' },
  { label: '주문 관리' },
  { label: '주문 목록' },
]
</script>

<template>
  <AppLayout title="주문 목록" :breadcrumb="breadcrumb">

    <!-- ── 탭 바 ──────────────────────────────── -->
    <div class="tab-bar">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="tab-badge" :class="`tab-badge--${tab.badgeColor}`">
          {{ tabCount[tab.key] ?? 0 }}
        </span>
      </button>
    </div>

    <!-- ── 카드 (탭 이하 전체) ───────────────── -->
    <div class="card card--no-top-radius">

      <!-- 상태 개요 -->
      <div class="status-overview">
        <div class="status-overview-copy">
          <div class="status-overview-label">Order Status</div>
          <div class="status-overview-title">{{ STATUS_OVERVIEW[activeTab].heading }}</div>
          <div class="status-overview-copytext">{{ STATUS_OVERVIEW[activeTab].copy }}</div>
        </div>
        <div class="status-kpis">
          <div class="status-kpi">
            <div class="status-kpi-label">표시 주문</div>
            <div class="status-kpi-value">{{ overviewKpi.count }}</div>
          </div>
          <div class="status-kpi">
            <div class="status-kpi-label">우선 조치</div>
            <div class="status-kpi-value">{{ overviewKpi.priority }}</div>
          </div>
          <div class="status-kpi">
            <div class="status-kpi-label">운영 포인트</div>
            <div class="status-kpi-value">{{ overviewKpi.highlight }}</div>
          </div>
        </div>
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
            placeholder="주문번호, 셀러명, 상품명 검색..."
          />
        </div>

        <select v-model="filterSeller" class="select-filter">
          <option value="">전체 셀러</option>
          <option v-for="c in companyOptions" :key="c" :value="c">{{ c }}</option>
        </select>

        <select v-model="filterChannel" class="select-filter">
          <option value="">전체 채널</option>
          <option v-for="ch in channelOptions" :key="ch" :value="ch">
            {{ CHANNEL_MAP[ch]?.label ?? ch }}
          </option>
        </select>

        <div class="spacer" />

        <button
          class="ui-btn ui-btn--primary"
          :disabled="!selectedIds.size"
          @click="openBulkModal"
        >
          <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
            <path d="M1 6.5h9M7.5 4l3 2.5-3 2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          선택 출고 지시 ({{ selectedIds.size }})
        </button>
      </div>

      <!-- 테이블 -->
      <div class="table-section">
        <BaseTable
          :columns="columns"
          :rows="paged"
          :pagination="pagination"
          row-key="id"
          @page-change="p => currentPage = p"
        >
          <!-- 체크박스 헤더 -->
          <template #header-check>
            <input
              type="checkbox"
              :checked="allChecked"
              @change="e => toggleAll(e.target.checked)"
            />
          </template>

          <!-- 체크박스 셀 -->
          <template #cell-check="{ row }">
            <input
              type="checkbox"
              :checked="selectedIds.has(row.id)"
              @change="toggleRow(row.id)"
            />
          </template>

          <!-- 주문번호 -->
          <template #cell-id="{ row }">
            <span class="mono order-id">{{ row.id }}</span>
          </template>

          <!-- 채널 배지 -->
          <template #cell-channel="{ row }">
            <span class="badge" :class="`badge--${CHANNEL_MAP[row.channel]?.color ?? 'gray'}`">
              {{ CHANNEL_MAP[row.channel]?.label ?? row.channel }}
            </span>
          </template>

          <!-- 셀러 / 회사 -->
          <template #cell-company="{ row }">
            {{ row.seller }} / {{ row.company }}
          </template>

          <!-- 주문일 -->
          <template #cell-orderedAt="{ row }">
            <span class="text-muted">{{ row.orderedAt }}</span>
          </template>

          <!-- 상태 배지 -->
          <template #cell-status="{ row }">
            <span class="badge" :class="`badge--${STATUS_MAP[row.status]?.color ?? 'gray'}`">
              {{ STATUS_MAP[row.status]?.label ?? row.status }}
            </span>
          </template>

          <!-- 작업 버튼 -->
          <template #cell-actions>
            <button class="ui-btn ui-btn--ghost ui-btn--sm">상세</button>
          </template>
        </BaseTable>
      </div>

    </div>

    <!-- ── 일괄 출고 지시 모달 ───────────────── -->
    <BulkOutboundModal
      :isOpen="isBulkModalOpen"
      :orders="selectedOrders"
      @cancel="closeBulkModal"
      @confirm="confirmBulkOutbound"
    />

  </AppLayout>
</template>

<style scoped>
/* ── 탭 바 ──────────────────────────────────── */
.tab-bar {
  display: flex;
  gap: 2px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 6px 6px 0;
  overflow-x: auto;
}
.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  background: transparent;
  color: var(--t3);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--ease-fast), color var(--ease-fast);
}
.tab-item:hover  { background: var(--surface); color: var(--t1); }
.tab-item.active { background: var(--surface); color: var(--t1); font-weight: 600; }

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 700;
}
.tab-badge--gray  { background: var(--surface-2); color: var(--t3); }
.tab-badge--blue  { background: var(--blue-pale);  color: var(--blue); }
.tab-badge--amber { background: var(--amber-pale); color: #b45309; }
.tab-badge--green { background: var(--green-pale); color: var(--green); }

/* ── 카드 ───────────────────────────────────── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.card--no-top-radius {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-top: none;
}

/* ── 상태 개요 ──────────────────────────────── */
.status-overview {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 20px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(76, 116, 255, 0.04), rgba(76, 116, 255, 0));
}
.status-overview-copy { flex: 1; min-width: 0; }
.status-overview-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--blue);
  margin-bottom: 8px;
}
.status-overview-title {
  font-family: var(--font-condensed);
  font-size: 26px;
  font-weight: 700;
  color: var(--t1);
  line-height: 1;
  margin-bottom: 8px;
}
.status-overview-copytext {
  font-size: 13px;
  line-height: 1.6;
  color: var(--t3);
  max-width: 520px;
}
.status-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(110px, 1fr));
  gap: 12px;
  min-width: 360px;
}
.status-kpi {
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}
.status-kpi-label { font-size: 11px; color: var(--t3); margin-bottom: 6px; }
.status-kpi-value { font-size: 20px; font-weight: 700; color: var(--t1); line-height: 1; }

/* ── 필터 바 ────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.search-wrap { position: relative; display: flex; align-items: center; }
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
  font-size: 13px;
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
  font-size: 13px;
  cursor: pointer;
}
.spacer { flex: 1; }

/* ── 테이블 섹션 ─────────────────────────────── */
.table-section { padding: 16px; }

/* ── 셀 헬퍼 ────────────────────────────────── */
.mono     { font-family: var(--font-mono); font-size: 12px; }
.order-id { color: var(--blue); }
.text-muted { color: var(--t3); font-size: 12px; }

/* ── 배지 ───────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.badge--blue  { background: var(--blue-pale);  color: var(--blue);  }
.badge--amber { background: var(--amber-pale); color: #b45309;      }
.badge--green { background: var(--green-pale); color: var(--green); }
.badge--gray  { background: var(--surface-2);  color: var(--t3);    }

/* ── 버튼 ───────────────────────────────────── */
.ui-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--t2);
  transition: background var(--ease-fast), color var(--ease-fast);
}
.ui-btn--ghost:hover                    { background: var(--surface-2); color: var(--t1); }
.ui-btn--primary                        { background: var(--blue); color: #fff; border-color: var(--blue); }
.ui-btn--primary:hover:not(:disabled)   { background: #3a5fd8; }
.ui-btn--primary:disabled               { opacity: 0.4; cursor: not-allowed; }
.ui-btn--sm { height: 28px; padding: 0 10px; font-size: 12px; }
</style>