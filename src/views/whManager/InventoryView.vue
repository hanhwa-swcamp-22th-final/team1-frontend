<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import InventoryDetailModal from '@/components/whManager/InventoryDetailModal.vue'
import { useRouter } from 'vue-router'
import { getWhmInventories } from '@/api/wh-manager'
import { INVENTORY_STATUS, ROUTE_NAMES } from '@/constants'

const router = useRouter()

function goToWarehouseMap(bin) {
  router.push({ name: ROUTE_NAMES.WH_MANAGER_WAREHOUSE_MAP, query: { bin } })
}

// ── 필터 상태
const searchText   = ref('')
const filterSeller = ref('')
const filterStatus = ref('all')

// ── 페이지네이션
const currentPage = ref(1)
const PAGE_SIZE   = 7

// ── 데이터
const inventories = ref([])

async function fetchInventories() {
  try {
    const { data } = await getWhmInventories()
    inventories.value = data
  } catch (e) {
    console.error('재고 데이터 로드 실패:', e)
  }
}

onMounted(fetchInventories)

// 필터 바뀌면 1페이지로 초기화
watch([searchText, filterSeller, filterStatus], () => {
  currentPage.value = 1
})

// ── KPI 집계
const kpi = computed(() => ({
  availableSkuCount: inventories.value.filter(i => i.availableQty > 0).length,
  availableTotalQty: inventories.value.reduce((s, i) => s + i.availableQty, 0),
  allocatedSkuCount: inventories.value.filter(i => i.allocatedQty > 0).length,
  allocatedTotalQty: inventories.value.reduce((s, i) => s + i.allocatedQty, 0),
  shortageCount:     inventories.value.filter(i => i.status === INVENTORY_STATUS.SHORTAGE).length,
}))

// ── 클라이언트 필터링
const filtered = computed(() => {
  let list = inventories.value

  if (filterSeller.value) {
    list = list.filter(i => i.seller === filterSeller.value)
  }
  if (filterStatus.value !== 'all') {
    list = list.filter(i => i.status === filterStatus.value)
  }
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(i =>
      i.sku.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      i.seller.toLowerCase().includes(q),
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

// ── 셀러 목록 (중복 제거)
const sellerOptions = computed(() =>
  [...new Set(inventories.value.map(i => i.seller))],
)

// ── 컬럼 정의
const columns = [
  { key: 'sku',          label: 'SKU',      width: '130px' },
  { key: 'name',         label: '품목명' },
  { key: 'seller',       label: '셀러',     width: '150px' },
  { key: 'availableQty', label: '가용 수량', align: 'right', width: '100px' },
  { key: 'allocatedQty', label: '할당 수량', align: 'right', width: '100px' },
  { key: 'totalQty',     label: '총 수량',   align: 'right', width: '100px' },
  { key: 'locations',    label: '보관 위치', width: '130px' },
  { key: 'threshold',    label: '임계값',    align: 'right', width: '80px' },
  { key: 'status',       label: '상태',      width: '110px' },
  { key: 'actions',      label: '작업',      width: '70px', align: 'center' },
]

// ── 상세 모달
const selectedItem = ref(null)

function openDetail(item) {
  selectedItem.value = item
}
function closeDetail() {
  selectedItem.value = null
}

// ── 위치 태그 툴팁 (Teleport 사용 — overflow:hidden 카드 내부 클리핑 방지)
const hoveredLoc   = ref(null)
const tooltipStyle = ref({})

function showTooltip(loc, event) {
  hoveredLoc.value = loc
  const rect = event.currentTarget.getBoundingClientRect()
  tooltipStyle.value = {
    top:       `${rect.top - 8}px`,
    left:      `${rect.left + rect.width / 2}px`,
    transform: 'translate(-50%, -100%)',
  }
}

function hideTooltip() {
  hoveredLoc.value = null
}

// ── 브레드크럼
const breadcrumb = [
  { label: 'CONK' },
  { label: '재고 관리' },
  { label: '재고 현황' },
]
</script>

<template>
  <AppLayout title="재고 현황" :breadcrumb="breadcrumb">

    <!-- ── KPI 카드 4개 ───────────────────────────── -->
    <div class="kpi-grid">

      <div class="kpi-card" style="border-left: 3px solid var(--green);">
        <div class="kpi-label">가용 재고 SKU</div>
        <div class="kpi-value">{{ kpi.availableSkuCount }}</div>
        <div class="kpi-sub">총 <strong>{{ kpi.availableTotalQty.toLocaleString() }}</strong>개 보관 중</div>
      </div>

      <div class="kpi-card" style="border-left: 3px solid var(--blue);">
        <div class="kpi-label">할당 재고 SKU</div>
        <div class="kpi-value">{{ kpi.allocatedSkuCount }}</div>
        <div class="kpi-sub">출고 대기 <strong>{{ kpi.allocatedTotalQty.toLocaleString() }}</strong>개</div>
      </div>

      <div class="kpi-card" style="border-left: 3px solid var(--red);">
        <div class="kpi-label">재고 부족 경고</div>
        <div class="kpi-value kpi--red">{{ kpi.shortageCount }}</div>
        <div class="kpi-sub">임계값 이하 SKU</div>
      </div>

    </div>

    <!-- ── 필터 + 테이블 카드 ─────────────────────── -->
    <div class="card">

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
            placeholder="SKU, 품목명 검색..."
          />
        </div>

        <select v-model="filterSeller" class="select-filter">
          <option value="">전체 셀러</option>
          <option v-for="seller in sellerOptions" :key="seller" :value="seller">{{ seller }}</option>
        </select>

        <select v-model="filterStatus" class="select-filter">
          <option value="all">전체 상태</option>
          <option :value="INVENTORY_STATUS.NORMAL">정상</option>
          <option :value="INVENTORY_STATUS.CAUTION">주의</option>
          <option :value="INVENTORY_STATUS.SHORTAGE">재고 부족</option>
        </select>
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
          <!-- SKU: 모노스페이스 -->
          <template #cell-sku="{ row }">
            <span class="mono">{{ row.sku }}</span>
          </template>

          <!-- 품목명: 볼드 -->
          <template #cell-name="{ row }">
            <strong>{{ row.name }}</strong>
          </template>

          <!-- 가용 수량: 부족이면 빨간색 -->
          <template #cell-availableQty="{ row }">
            <span
              class="fw-600"
              :class="row.status === INVENTORY_STATUS.SHORTAGE ? 'text-red' : row.status === INVENTORY_STATUS.CAUTION ? 'text-amber' : 'text-green'"
            >
              {{ row.availableQty.toLocaleString() }}
            </span>
          </template>

          <!-- 할당 수량 -->
          <template #cell-allocatedQty="{ row }">
            {{ row.allocatedQty.toLocaleString() }}
          </template>

          <!-- 총 수량: 볼드 -->
          <template #cell-totalQty="{ row }">
            <span class="fw-600">{{ row.totalQty.toLocaleString() }}</span>
          </template>

          <!-- 보관 위치: hover tooltip + click 라우팅 -->
          <template #cell-locations="{ row }">
            <div class="loc-wrap">
              <div
                v-for="loc in row.locations"
                :key="loc.bin"
                class="location-tag location-tag--link"
                @mouseenter="showTooltip(loc, $event)"
                @mouseleave="hideTooltip"
              >
                <span class="loc-code" @click="goToWarehouseMap(loc.bin)">{{ loc.bin }}</span>
              </div>
            </div>
          </template>

          <!-- 임계값: 회색 -->
          <template #cell-threshold="{ row }">
            <span class="text-muted">{{ row.threshold.toLocaleString() }}</span>
          </template>

          <!-- 상태 배지 -->
          <template #cell-status="{ row }">
            <StatusBadge :status="row.status" type="inventory" />
          </template>

          <!-- 작업 버튼 -->
          <template #cell-actions="{ row }">
            <button class="ui-btn ui-btn--ghost ui-btn--sm" @click="openDetail(row)">상세</button>
          </template>
        </BaseTable>
      </div>

    </div>

    <!-- ── 상세 모달 ──────────────────────────────── -->
    <InventoryDetailModal :item="selectedItem" @close="closeDetail" />

    <!-- ── 위치 툴팁 (body에 렌더링 — overflow 클리핑 방지) ── -->
    <Teleport to="body">
      <div v-if="hoveredLoc" class="loc-tooltip-body" :style="tooltipStyle">
        <div class="lt-row"><span class="lt-label">보관 수량</span><span class="lt-val">{{ hoveredLoc.qty.toLocaleString() }}개</span></div>
        <div class="lt-row"><span class="lt-label">ASN</span><span class="lt-val lt-mono">{{ hoveredLoc.asnId }}</span></div>
        <div class="lt-row"><span class="lt-label">입고일</span><span class="lt-val">{{ hoveredLoc.receivedDate }}</span></div>
        <div class="lt-hint">클릭 시 배치도에서 확인</div>
      </div>
    </Teleport>

  </AppLayout>
</template>

<style scoped>
/* ── KPI Grid ──────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
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
.kpi-sub   { font-size: var(--font-size-xs); color: var(--t3); }
.kpi--red  { color: var(--red); }
.kpi--amber { color: #b45309; }

/* ── Card ──────────────────────────────────────── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

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
  width: 220px;
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

/* ── Table Section ─────────────────────────────── */
.table-section { padding: var(--space-4); }

/* ── Cell Helpers ──────────────────────────────── */
.mono    { font-family: var(--font-mono); font-size: var(--font-size-xs); }
.fw-600  { font-weight: 600; }
.text-muted  { color: var(--t3); }
.text-green  { color: var(--green); }
.text-amber  { color: #b45309; }
.text-red    { color: var(--red); }

.location-tag {
  display: inline-flex;
  padding: 2px 7px;
  background: var(--blue-pale);
  color: var(--blue);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  font-family: var(--font-mono);
  margin-right: 4px;
}

/* ── 위치 태그 */
.loc-wrap { display: flex; flex-wrap: wrap; gap: 4px; }

.location-tag--link { cursor: default; }

.loc-code {
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.loc-code:hover { filter: brightness(0.8); }

/* ── 위치 툴팁 (body Teleport — scoped 불가하므로 :global 사용) */
:global(.loc-tooltip-body) {
  position: fixed;
  z-index: 9999;
  min-width: 200px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  padding: var(--space-3);
  pointer-events: none;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:global(.loc-tooltip-body .lt-row)   { display: flex; gap: var(--space-2); font-size: var(--font-size-xs); }
:global(.loc-tooltip-body .lt-label) { color: var(--t3); min-width: 56px; flex-shrink: 0; }
:global(.loc-tooltip-body .lt-val)   { color: var(--t1); font-weight: 500; }
:global(.loc-tooltip-body .lt-mono)  { font-family: var(--font-mono); font-size: var(--font-size-xs); }
:global(.loc-tooltip-body .lt-hint)  { margin-top: var(--space-1); font-size: 10px; color: var(--blue); font-weight: 600; }

/* ── Status Badge ──────────────────────────────── */
/* ── Buttons ───────────────────────────────────── */
.ui-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  height: 32px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--t2);
  transition: background var(--ease-fast), color var(--ease-fast);
}
.ui-btn--ghost:hover { background: var(--surface-2); color: var(--t1); }
.ui-btn--sm { height: 28px; padding: 0 var(--space-3); white-space: nowrap; }
</style>